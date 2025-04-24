import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "/api",
});

// Request interceptor to add authorization token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = "Bearer " + token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Global API Error:", error);
    return Promise.reject(error);
  }
);

export default axiosInstance;
