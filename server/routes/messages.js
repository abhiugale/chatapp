const express = require('express');
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const mongoose = require('mongoose');

const router = express.Router();

// Get messages for a conversation
router.get('/conversations/:conversationId/messages', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    console.log('📨 Fetching messages for conversation:', conversationId);
    
    // Validate conversationId
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: 'Invalid conversation ID' });
    }

    const messages = await Message.find({
      conversationId: conversationId
    })
    .populate('sender', 'name email')
    .sort({ createdAt: 1 });
    
    console.log(`✅ Found ${messages.length} messages`);
    res.json(messages);
  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    res.status(500).json({ 
      message: 'Failed to fetch messages', 
      error: error.message 
    });
  }
});

// Create or get conversation
router.post('/conversations', auth, async (req, res) => {
  try {
    const { participantId } = req.body;
    const currentUserId = req.user.userId;
    
    console.log('💬 Creating/getting conversation:');
    console.log('  - Current user:', currentUserId);
    console.log('  - Participant:', participantId);

    // Validate input
    if (!participantId) {
      return res.status(400).json({ message: 'Participant ID is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(participantId)) {
      return res.status(400).json({ message: 'Invalid participant ID' });
    }

    // Check if participant exists
    const participant = await mongoose.model('User').findById(participantId);
    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    // Check if conversation already exists (both directions)
    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, participantId] }
    }).populate('participants', 'name email');

    if (conversation) {
      console.log('✅ Existing conversation found:', conversation._id);
      return res.json(conversation);
    }

    // Create new conversation
    console.log('🆕 Creating new conversation');
    conversation = await Conversation.create({
      participants: [currentUserId, participantId]
    });
    
    // Populate the participants after creation
    await conversation.populate('participants', 'name email');
    console.log('✅ New conversation created:', conversation._id);

    res.status(201).json(conversation);
  } catch (error) {
    console.error('❌ Error in /conversations:', error);
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    
    if (error.code === 11000) {
      return res.status(409).json({ 
        message: 'Conversation already exists' 
      });
    }
    
    res.status(500).json({ 
      message: 'Server error while creating conversation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;