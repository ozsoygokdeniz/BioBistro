import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Dynamically get the LAN IP address of the developer machine
const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
let ipAddress = debuggerHost ? debuggerHost.split(':')[0] : '172.20.10.14';

// Android emülatörleri host bilgisayara erişmek için 10.0.2.2 kullanır
if (!Constants.isDevice && Platform.OS === 'android') {
  ipAddress = '10.0.2.2';
}

// Use localhost for web, LAN IP/Emulator IP for mobile
const API_URL = Platform.OS === 'web'
  ? 'http://localhost:8000/api/v1/'
  : `http://${ipAddress}:8000/api/v1/`;

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(async (config) => {
  try {
    let token = null;
    if (Platform.OS === 'web') {
      token = localStorage.getItem('token');
    } else {
      token = await SecureStore.getItemAsync('token');
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.warn('Error reading token', err);
  }
  return config;
});

export default api;
