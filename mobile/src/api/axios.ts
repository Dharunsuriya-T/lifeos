import axios from 'axios';
import { getAccessToken, getRefreshToken, setAccessToken, clearTokens, getServerUrl } from '../utils/auth';

const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    config.baseURL = await getServerUrl();
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await getRefreshToken();
        if (refreshToken) {
          const baseURL = await getServerUrl();
          const response = await axios.post(`${baseURL}/auth/refresh`, {
            refreshToken,
          });
          const { accessToken } = response.data;
          await setAccessToken(accessToken);
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        await clearTokens();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
