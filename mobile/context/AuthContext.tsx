import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, apiUtils } from '../services/api';
import { AuthUser } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('🔍 Checking authentication...');
      const userData = await AsyncStorage.getItem('user');
      
      if (userData) {
        const parsedUser = JSON.parse(userData);
        console.log('✅ User found in storage:', parsedUser.name);
        
        if (parsedUser.token && typeof parsedUser.token === 'string') {
          // Sync token with API service
          apiUtils.setToken(parsedUser.token);
          setUser(parsedUser);
          console.log('✅ User and token set in context and API service');
        } else {
          console.warn('⚠️ Invalid token structure, clearing storage');
          await AsyncStorage.removeItem('user');
          apiUtils.clearToken();
        }
      } else {
        console.log('🔍 No user data in storage');
      }
    } catch (error) {
      console.error('❌ Auth check error:', error);
      await AsyncStorage.removeItem('user');
      apiUtils.clearToken();
    } finally {
      setLoading(false);
      console.log('🔍 Auth check completed');
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Starting login process...');
      const response = await authService.login(email, password);
      
      if (!response.token || !response.user) {
        throw new Error('Invalid response from server');
      }

      const userData: AuthUser = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        token: response.token
      };
      
      console.log('✅ Login response verified');
      
      // Update state and storage
      setUser(userData);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      // Token is already set in the API service by authService.login
      console.log('✅ Login completed - user and token stored');
      
    } catch (error) {
      console.error('❌ Login error:', error);
      // Clear any partial data on error
      apiUtils.clearToken();
      await AsyncStorage.removeItem('user');
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      console.log('🔐 Starting registration process...');
      const response = await authService.register(name, email, password);
      
      if (!response.token || !response.user) {
        throw new Error('Invalid response from server');
      }

      const userData: AuthUser = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        token: response.token
      };
      
      console.log('✅ Registration response verified');
      
      // Update state and storage
      setUser(userData);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      console.log('✅ Registration completed - user and token stored');
      
    } catch (error) {
      console.error('❌ Registration error:', error);
      // Clear any partial data on error
      apiUtils.clearToken();
      await AsyncStorage.removeItem('user');
      throw error;
    }
  };

  const logout = async () => {
    console.log('🚪 Starting logout process...');
    setUser(null);
    await AsyncStorage.removeItem('user');
    apiUtils.clearToken();
    console.log('✅ Logout completed - all data cleared');
  };

  console.log('🔍 AuthProvider render - user:', user?.name, 'loading:', loading);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);