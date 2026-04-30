import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Dynamically get the LAN IP address of the developer machine
const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
const ipAddress = debuggerHost ? debuggerHost.split(':')[0] : '10.52.160.221';

// Use localhost for web, LAN IP for physical device/emulator
const API_URL = Platform.OS === 'web' 
  ? 'http://localhost:8005/api/v1/' 
  : `http://${ipAddress}:8005/api/v1/`;

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.warn('Error reading token from SecureStore', err);
  }
  return config;
});

export default api;
