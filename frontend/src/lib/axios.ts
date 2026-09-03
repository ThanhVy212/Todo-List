import axios from "axios";

const BASE_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:8000/api"
    : import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  const demoToken = sessionStorage.getItem("demo_token");
  if (demoToken) return demoToken;
  return localStorage.getItem("token");
}

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
