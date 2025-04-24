import { Platform } from 'react-native';

// export const API_URL = Platform.OS === 'web' ? 'http://localhost:5000' : 'http://192.168.1.140:5000'; // Thay bằng IP hoặc URL ngrok
export const NETWORK_CONFIG = {
    //Shool
    // EXPO_URL: 'exp://172.28.47.52:8081',
    // API_URL: 'http://172.28.47.52:5000', 
    //Home
    EXPO_URL: 'exp://192.168.1.140:8081',
    API_URL: 'http://192.168.1.140:5000', 
    //Bai
    // EXPO_URL: 'exp://192.168.2.9:8081',
    // API_URL: 'http://192.168.2.9:5000', 
  };
  export const API_URL = NETWORK_CONFIG.API_URL;