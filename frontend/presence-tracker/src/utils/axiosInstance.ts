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
  async (error) => {
    if (error.response && error.response.data instanceof Blob) {
      const data = await error.response.data.text();
      error.response.data = data ? JSON.parse(data) : {};
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
