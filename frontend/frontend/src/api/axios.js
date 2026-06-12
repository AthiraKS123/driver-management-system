import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// =====================
// REQUEST INTERCEPTOR
// =====================
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// =====================
// REFRESH CONTROL
// =====================
let isRefreshing = false;
let queue = [];

const processQueue = (error, token = null) => {
  queue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
      return;
    }

    resolve(token);
  });
  queue = [];
};

// =====================
// RESPONSE INTERCEPTOR
// =====================
API.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config || {};

    if (!error.response) {
      console.log("❌ API ERROR:", error.message, originalRequest.url);
      return Promise.reject(error);
    }

    // 🚫 Prevent infinite loop on refresh API itself
    if (originalRequest.url?.includes("/auth/refresh")) {
      localStorage.clear();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    // =====================
    // HANDLE 401 ONLY
    // =====================
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Queue requests while refreshing
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then((token) => {
          if (!token) {
            return Promise.reject(error);
          }

          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return API(originalRequest);
        });
      }

      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          localStorage.clear();
          window.location.href = "/login";
          return Promise.reject(error);
        }

        const res = await axios.post("http://localhost:5000/api/auth/refresh", {
          refreshToken,
        });

        const newToken = res.data.accessToken;
        const newRefreshToken = res.data.refreshToken;

        if (!newToken) {
          throw new Error("No access token returned from refresh");
        }

        // 💾 store new access token
        localStorage.setItem("accessToken", newToken);
        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
        }

        // process queued requests
        processQueue(null, newToken);

        // update request header
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return API(originalRequest);
      } catch (err) {
        console.log("❌ REFRESH FAILED:", err.response?.status || err.message);
        processQueue(err, null);
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    console.log("❌ API ERROR:", error.response.status, originalRequest.url);
    return Promise.reject(error);
  },
);

export default API;
