import axios from "axios";
import toast from "react-hot-toast";

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
// REFRESH STATE
// =====================
let isRefreshing = false;
let queue = [];

const processQueue = (token) => {
  queue.forEach((cb) => cb(token));
  queue = [];
};

// =====================
// RESPONSE INTERCEPTOR
// =====================
API.interceptors.response.use(
  (res) => res,

  async (error) => {
    const originalRequest = error.config;

    if (!error.response) return Promise.reject(error);
//    if (error.response.status === 429) {
//   toast.error("Too many requests. Please slow down 🚫");

//   // ✅ IMPORTANT: DON'T reject
//   return Promise.resolve({
//     data: {
//       drivers: null,
//       totalPages: null,
//       rateLimited: true,
//     },
//   });
// }

    // ❌ avoid refresh loop
    if (originalRequest.url.includes("/auth/refresh")) {
      localStorage.clear();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    // =====================
    // HANDLE 401
    // =====================
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // queue requests during refresh
      if (isRefreshing) {
        return new Promise((resolve) => {
          queue.push((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(API(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");

        const res = await axios.post("http://localhost:5000/api/auth/refresh", {
          refreshToken,
        });

        const newToken = res.data.accessToken;

        localStorage.setItem("accessToken", newToken);

        processQueue(newToken);

        // 🔥 IMPORTANT: set header
        API.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        // ✅ IMPORTANT FIX: use API, not axios
        return API(originalRequest);
      } catch (err) {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default API;
