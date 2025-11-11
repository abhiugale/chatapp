import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { messageService } from '../../services/api';
import { Message, User } from '../../types';
import { useLocalSearchParams, useNavigation } from 'expo-router';

export default function ChatScreen() {
  const { participant: participantString, conversationId: existingConversationId } = useLocalSearchParams();
  const participant: User = JSON.parse(participantString as string);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversationId, setConversationId] = useState(existingConversationId as string);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  
  const { socket } = useSocket();
  const { user } = useAuth();
  const navigation = useNavigation();
  const flatListRef = useRef<FlatList>(null);

  // Set screen title using navigation
  useEffect(() => {
    navigation.setOptions({ 
      title: participant.name || 'Chat'
    });
  }, [navigation, participant.name]);

  useEffect(() => {
    initializeChat();
    
    if (socket) {
      if (conversationId) {
        socket.emit('join_conversation', conversationId);
      }

      socket.on('message:new', (message: Message) => {
        setMessages(prev => [...prev, message]);
        markAsRead();
      });

      socket.on('typing:start', (data: { userId: string }) => {
        if (data.userId !== user?.id) {
          setIsTyping(true);
          setTypingUser(participant.name);
        }
      });

      socket.on('typing:stop', (data: { userId: string }) => {
        if (data.userId !== user?.id) {
          setIsTyping(false);
          setTypingUser(null);
        }
      });

      socket.on('message:read', (data: { userId: string }) => {
        if (data.userId !== user?.id) {
          setMessages(prev => prev.map(msg => 
            msg.sender._id !== data.userId 
              ? { ...msg, readBy: [...msg.readBy, data.userId] }
              : msg
          ));
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('message:new');
        socket.off('typing:start');
        socket.off('typing:stop');
        socket.off('message:read');
      }
    };
  }, [socket, conversationId]);

  const initializeChat = async () => {
    try {
      let convId = conversationId;
      
      if (!convId) {
        const conversation = await messageService.createConversation(participant._id);
        convId = conversation._id;
        setConversationId(convId);
        socket?.emit('join_conversation', convId);
      }

      const messagesData = await messageService.getMessages(convId);
      setMessages(messagesData);
      
      markAsRead();
    } catch (error) {
      console.error('❌ Error loading conversation:', error);
      Alert.alert('Error', 'Failed to load conversation');
    }
  };

  const markAsRead = () => {
    if (socket && conversationId) {
      socket.emit('message:read', { conversationId });
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !socket || !conversationId || !user) return;

    const messageData = {
      conversationId,
      sender: user.id,
      text: newMessage.trim(),
    };

    socket.emit('message:send', messageData);
    setNewMessage('');
    stopTyping();
  };

  const startTyping = () => {
    if (socket && conversationId) {
      socket.emit('typing:start', { conversationId });
    }
  };

  const stopTyping = () => {
    if (socket && conversationId) {
      socket.emit('typing:stop', { conversationId });
    }
  };

  const handleTextChange = (text: string) => {
    setNewMessage(text);
    if (text.length > 0) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.sender._id === user?.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessage : styles.theirMessage
      ]}>
        {!isMyMessage && (
          <Text style={styles.senderName}>{item.sender.name}</Text>
        )}
        <Text style={[
          styles.messageText,
          isMyMessage ? styles.myMessageText : styles.theirMessageText
        ]}>
          {item.text}
        </Text>
        <Text style={styles.messageTime}>
          {new Date(item.createdAt).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
        {isMyMessage && (
          <Text style={styles.readReceipt}>
            {item.readBy.includes(participant._id) ? '✓✓' : '✓'}
          </Text>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={renderMessage}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        onLayout={() => flatListRef.current?.scrollToEnd()}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
      />
      
      {isTyping && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>{typingUser} is typing...</Text>
        </View>
      )}
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={newMessage}
          onChangeText={handleTextChange}
          placeholder="Type a message..."
          placeholderTextColor="#999"
          multiline
          maxLength={500}
          onBlur={stopTyping}
        />
        <TouchableOpacity 
          style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]} 
          onPress={sendMessage}
          disabled={!newMessage.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 10,
    paddingBottom: 20,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  senderName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  messageText: {
    fontSize: 16,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  theirMessageText: {
    color: '#000000',
  },
  messageTime: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  readReceipt: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
    alignSelf: 'flex-end',
  },
  typingIndicator: {
    padding: 10,
    paddingHorizontal: 16,
  },
  typingText: {
    fontStyle: 'italic',
    color: '#666',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: '#f8f8f8',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});