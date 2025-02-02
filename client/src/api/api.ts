import axios, { AxiosRequestConfig, AxiosError } from 'axios';

const backendURL = 'http://localhost:3000';
const api = axios.create({
  baseURL: backendURL,
  headers: {
    'Content-Type': 'application/json',
  },
  validateStatus: (status) => {
    return status >= 200 && status < 300;
  },
});

// Remove caching of accessToken and always read from localStorage
api.interceptors.request.use(
  (config: AxiosRequestConfig): AxiosRequestConfig => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError): Promise<AxiosError> => Promise.reject(error)
);

// Axios response interceptor: Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError): Promise<any> => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if ([401, 403].includes(error.response?.status) && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await axios.post<{ accessToken: string }>(`${backendURL}/api/auth/refresh`, {
          refreshToken: localStorage.getItem('refreshToken'),
        });
        localStorage.setItem('accessToken', data.accessToken); // optionally update localStorage

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        }
        return api(originalRequest);
      } catch (err) {
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;