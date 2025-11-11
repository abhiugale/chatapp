import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Configure base URL based on platform and environment
const getBaseURL = () => {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      return 'http://192.168.1.14:5000'; // Android emulator
    } else {
      return 'http://192.168.1.14:5000'; // iOS simulator
    }
  }
  return 'http://192.168.1.14:5000'; // Production
};

const API_BASE_URL = getBaseURL();

console.log('🌐 API Base URL:', API_BASE_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Store the current token in memory for quick access
let currentToken: string | null = null;

// Initialize token from storage
const initializeToken = async () => {
  try {
    const userData = await AsyncStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      currentToken = user.token;
      console.log('🔐 Token initialized from storage');
    }
  } catch (error) {
    console.error('❌ Error initializing token:', error);
  }
};

// Call this when the app starts
initializeToken();

// Enhanced request interceptor
api.interceptors.request.use(
  async (config) => {
    // Try to get token from memory first (faster)
    if (currentToken) {
      config.headers.Authorization = `Bearer ${currentToken}`;
      console.log('✅ Token attached from memory:', config.url);
    } else {
      // Fallback to AsyncStorage
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          if (user.token) {
            currentToken = user.token;
            config.headers.Authorization = `Bearer ${user.token}`;
            console.log('✅ Token attached from storage:', config.url);
          } else {
            console.warn('⚠️ No token found in user data');
          }
        } else {
          console.warn('⚠️ No user data found in storage for:', config.url);
        }
      } catch (error) {
        console.error('❌ Error getting token from storage:', error);
      }
    }

    console.log('📤 Making request to:', config.url);
    console.log('🔐 Auth header:', config.headers.Authorization ? 'Present' : 'Missing');
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Success:', response.config.url, response.status);
    return response;
  },
  (error) => {
    const { message, config, response } = error;
    
    console.error('❌ API Error:', {
      url: config?.url,
      method: config?.method,
      status: response?.status,
      message: message,
      data: response?.data
    });

    // Handle specific error cases
    if (response?.status === 401) {
      console.log('🔐 401 Unauthorized - Token may be invalid or expired');
      // Clear the token from memory
      currentToken = null;
      // Optionally: redirect to login screen or refresh token
    }

    return Promise.reject(error);
  }
);

// Auth service
export const authService = {
  login: async (email: string, password: string) => {
    console.log('🔐 Attempting login for:', email);
    const response = await api.post('/auth/login', { email, password });
    
    // Update the token in memory after successful login
    if (response.data.token) {
      currentToken = response.data.token;
      console.log('✅ Token stored in memory after login');
    }
    
    console.log('✅ Login successful');
    return response.data;
  },

  register: async (name: string, email: string, password: string) => {
    console.log('🔐 Attempting registration for:', email);
    const response = await api.post('/auth/register', { name, email, password });
    
    // Update the token in memory after successful registration
    if (response.data.token) {
      currentToken = response.data.token;
      console.log('✅ Token stored in memory after registration');
    }
    
    console.log('✅ Registration successful');
    return response.data;
  },
};

// User service
export const userService = {
  getUsers: async () => {
    console.log('👥 Fetching users list...');
    console.log('🔐 Current token in memory:', currentToken ? 'Present' : 'Missing');
    
    const response = await api.get('/users');
    console.log('✅ Users list received:', response.data.length, 'users');
    return response.data;
  },
};

// Message service
export const messageService = {
  getMessages: async (conversationId: string) => {
    console.log('💬 Fetching messages for conversation:', conversationId);
    const response = await api.get(`/messages/conversations/${conversationId}/messages`);
    console.log('✅ Messages received:', response.data.length, 'messages');
    return response.data;
  },

  createConversation: async (participantId: string) => {
    console.log('💬 Creating conversation with participant:', participantId);
    console.log('🔐 Current token:', currentToken ? 'Present' : 'Missing');
    
    const response = await api.post('/messages/conversations', { participantId });
    console.log('✅ Conversation created:', response.data._id);
    return response.data;
  },
};

// Utility functions
export const apiUtils = {
  getCurrentToken: () => currentToken,
  
  setToken: (token: string) => {
    currentToken = token;
    console.log('🔐 Token updated in memory');
  },
  
  clearToken: () => {
    currentToken = null;
    console.log('🔐 Token cleared from memory');
  },
  
  // Test functions
  testConnection: async () => {
    try {
      const response = await api.get('/health');
      console.log('✅ Server connection test:', response.data);
      return true;
    } catch (error) {
      console.error('❌ Server connection test failed:', error);
      return false;
    }
  },

  testAuth: async () => {
    try {
      const response = await api.get('/users');
      console.log('✅ Auth test successful - can access protected route');
      return true;
    } catch (error) {
      console.error('❌ Auth test failed:', error);
      return false;
    }
  },
};