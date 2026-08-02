import axios from "axios";
import { useAuthStore } from "../store/authStore";

// Attach the JWT to every outgoing request when the user is authenticated.
axios.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Log the user out on 401 responses (expired / invalid token).
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);
