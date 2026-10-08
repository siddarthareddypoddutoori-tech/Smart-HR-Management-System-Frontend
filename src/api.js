import axios from "axios";
export function getApiErrorMessage(error, fallback) {
  const data = error.response?.data;
  const serverMessage = typeof data === "string" ? data : data?.message || data?.error;
  if (serverMessage) return serverMessage;
  if (error.code === "ERR_NETWORK" || !error.response) {
    return "Cannot reach the HR server. Start the backend and try again.";
  }
  return fallback;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.dispatchEvent(new Event("session-expired"));
    }
    return Promise.reject(error);
  },
);

export default api;
