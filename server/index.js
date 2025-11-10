const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');

const Conversation = require('./models/Conversation');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/messages', messageRoutes);

// MongoDB connection with better error handling
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.log('\nTroubleshooting tips:');
    console.log('1. Make sure MongoDB is running locally or Atlas connection string is correct');
    console.log('2. For local MongoDB: run "mongod" in terminal');
    console.log('3. For MongoDB Atlas: check your connection string in .env file');
    process.exit(1);
  });

// Socket.IO connection handling
const activeUsers = new Map();

io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id);

  // User goes online
  socket.on('user_online', (userId) => {
    activeUsers.set(userId, socket.id);
    socket.userId = userId;
    io.emit('user_status', { userId, status: 'online' });
    console.log(`🟢 User ${userId} is online`);
  });

  // Join conversation room
  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`User ${socket.userId} joined conversation: ${conversationId}`);
  });

  // Send message
  socket.on('message:send', async (data) => {
    try {
      console.log('📨 New message:', data);
      
      const message = new Message({
        conversationId: data.conversationId,
        sender: data.sender,
        text: data.text,
        readBy: [data.sender]
      });
      
      await message.save();
      
      // Populate sender info
      await message.populate('sender', 'name email');
      
      io.to(data.conversationId).emit('message:new', message);
      
      // Update last message in conversation
      await Conversation.findByIdAndUpdate(data.conversationId, {
        lastMessage: message.text,
        lastMessageAt: new Date()
      });
      
      console.log('Message saved and sent');
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Typing indicators
  socket.on('typing:start', (data) => {
    socket.to(data.conversationId).emit('typing:start', {
      userId: socket.userId,
      conversationId: data.conversationId
    });
  });

  socket.on('typing:stop', (data) => {
    socket.to(data.conversationId).emit('typing:stop', {
      userId: socket.userId,
      conversationId: data.conversationId
    });
  });

  // Message read receipt
  socket.on('message:read', async (data) => {
    try {
      await Message.updateMany(
        {
          conversationId: data.conversationId,
          sender: { $ne: socket.userId },
          readBy: { $ne: socket.userId }
        },
        { $addToSet: { readBy: socket.userId } }
      );
      
      io.to(data.conversationId).emit('message:read', {
        userId: socket.userId,
        conversationId: data.conversationId
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });

  // User goes offline
  socket.on('disconnect', () => {
    if (socket.userId) {
      activeUsers.delete(socket.userId);
      io.emit('user_status', { userId: socket.userId, status: 'offline' });
      console.log(`🔴 User ${socket.userId} went offline`);
    }
    console.log('👤 User disconnected:', socket.id);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});