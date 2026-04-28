import API from "./axios";

// 🔐 LOGIN
export const loginUser = (data) => API.post("/auth/login", data);

// 🆕 REGISTER (optional)
export const registerUser = (data) => API.post("/auth/register", data);