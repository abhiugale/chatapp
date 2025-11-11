import React, { createContext, useContext, useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { Platform } from 'react-native';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  // For Android emulator: use 10.0.2.2
  // For iOS simulator: use localhost
  // For physical device: use your computer's IP
  const getSocketURL = () => {
    if (__DEV__) {
      if (Platform.OS === 'android') {
        return 'http://192.168.1.14:5000'; // Android emulator
      } else {
        return 'http://192.168.1.14:5000'; // iOS simulator
      }
    }
    return 'http://192.168.1.14:5000'; // Production
  };

  useEffect(() => {
    if (user?.token) {
      const socketURL = getSocketURL();
      console.log('Connecting to socket:', socketURL);
      
      const newSocket = io(socketURL, {
        auth: {
          token: user.token
        },
        transports: ['websocket', 'polling'], // Add polling as fallback
        forceNew: true,
        timeout: 10000,
      });

      newSocket.on('connect', () => {
        console.log('Socket connected successfully');
        setIsConnected(true);
        newSocket.emit('user_online', user.id);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
      
      });

      setSocket(newSocket);

      return () => {
        console.log('Cleaning up socket connection');
        newSocket.close();
      };
    } else {
      // No user, close existing socket
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);