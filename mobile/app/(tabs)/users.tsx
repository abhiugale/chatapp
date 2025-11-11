import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { userService } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { User } from '../../types';
import { useRouter } from 'expo-router';

export default function UsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();
  const router = useRouter();

  useEffect(() => {
    loadUsers();
    
    if (socket) {
      socket.on('user_status', (data: { userId: string; status: string }) => {
        setUsers(prev => prev.map(user => 
          user._id === data.userId 
            ? { ...user, isOnline: data.status === 'online' }
            : user
        ));
      });
    }

    return () => {
      if (socket) {
        socket.off('user_status');
      }
    };
  }, [socket]);

  const loadUsers = async () => {
    try {
      console.log('📱 Loading users...');
      const usersData = await userService.getUsers();
      console.log('✅ Users loaded:', usersData.length);
      setUsers(usersData);
    } catch (error) {
      console.error('❌ Error loading users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const startChat = (user: User) => {
    console.log('💬 Starting chat with:', user.name);
    router.push({
      pathname: '/(tabs)/chat',
      params: { 
        participant: JSON.stringify(user),
        conversationId: user.conversationId || '' 
      }
    } as any);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chats</Text>
      {users.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No users found</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadUsers}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.userItem} onPress={() => startChat(item)}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
                {item.lastMessage && (
                  <Text style={styles.lastMessage} numberOfLines={1}>
                    {item.lastMessage}
                  </Text>
                )}
              </View>
              <View style={styles.status}>
                <View style={[
                  styles.statusIndicator, 
                  { backgroundColor: item.isOnline ? '#4CAF50' : '#9E9E9E' }
                ]} />
                <Text style={styles.statusText}>
                  {item.isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  userItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
  status: {
    alignItems: 'center',
    marginLeft: 12,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});