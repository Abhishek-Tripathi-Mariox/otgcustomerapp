import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Dev: local backend on the same Wi-Fi (this machine's LAN IP). Prod: hosted.
// export const API_BASE_URL = __DEV__
//   ? 'http://10.235.182.192:5011/api'
//   : 'https://otgtrading.in/api/';
export const API_BASE_URL = 'https://otgtrading.in/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token to every request
api.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('userToken');
    }
    return Promise.reject(error);
  },
);

export default api;
