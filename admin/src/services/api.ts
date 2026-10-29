import axios, { InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

let refreshRequest: Promise<string> | null = null;

const refreshAdminToken = (): Promise<string> => {
  if (!refreshRequest) {
    refreshRequest = api
      .post('/auth/refresh')
      .then((response) => {
        const token = response.data?.data?.accessToken;
        if (typeof token !== 'string' || !token) {
          throw new Error('The session refresh response did not include an access token.');
        }
        localStorage.setItem('admin_token', token);
        return token;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }
  return refreshRequest;
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config as RetriableRequestConfig | undefined;
    const url = request?.url || '';

    if (
      error.response?.status !== 401 ||
      !request ||
      request._retry ||
      url.includes('/auth/login') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/logout') ||
      !localStorage.getItem('admin_token')
    ) {
      return Promise.reject(error);
    }

    request._retry = true;
    try {
      const token = await refreshAdminToken();
      request.headers.Authorization = `Bearer ${token}`;
      return api(request);
    } catch (refreshError) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      if (typeof window !== 'undefined') {
        window.location.assign('/login');
      }
      return Promise.reject(refreshError);
    }
  }
);
