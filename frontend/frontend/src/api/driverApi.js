import API from "./axios";

// 📦 GET DRIVERS
export const fetchDrivers = (params) =>
  API.get("/drivers", { params });

export const addDriver = (data) =>
  API.post("/drivers", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  export const getDriverById = (id) =>
  API.get(`/drivers/${id}`);

// ✏️ UPDATE
export const updateDriver = (id, data) =>
  API.put(`/drivers/${id}`, data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
// ❌ DELETE
export const deleteDriver = (id) =>
  API.delete(`/drivers/${id}`);

export const fetchDriverStats = () =>
  API.get("/drivers/stats");

// 🚪 LOGOUT
export const logoutUser = (refreshToken) =>
  API.post("/auth/logout", { refreshToken });

export const getTrashDrivers = () => API.get("/drivers/trash");

export const restoreDriver = (id) =>
  API.put(`/drivers/restore/${id}`);

export const permanentDelete = (id) =>
  API.delete(`/drivers/permanent/${id}`);
