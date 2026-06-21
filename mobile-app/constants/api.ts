import Constants from "expo-constants";

// Extract computer IP dynamically from hostUri (e.g., "192.168.1.4:8081" -> "192.168.1.4")
const hostUri = Constants.expoConfig?.hostUri;
const ip = hostUri ? hostUri.split(":")[0] : "localhost";

export const API_URL = `http://${ip}:5000/api`;
