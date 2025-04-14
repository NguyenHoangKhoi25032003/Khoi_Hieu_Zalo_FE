import { Platform } from 'react-native';

// export const API_URL = Platform.OS === 'web' ? 'http://localhost:5000' : 'http://192.168.1.140:5000'; // Thay bằng IP hoặc URL ngrok
export const NETWORK_CONFIG = {
    EXPO_URL: 'exp://192.168.88.134:8081',
    API_URL: 'http://192.168.88.134:5000', // Nếu backend cũng chạy trên cùng mạng
  };
  export const API_URL = NETWORK_CONFIG.API_URL;