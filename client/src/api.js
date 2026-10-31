import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('staffsync_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export function errorMessage(error) {
  return error?.response?.data?.message || error?.message || 'Something went wrong.';
}
export default api;
