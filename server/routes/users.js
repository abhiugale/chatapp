const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Conversation = require('../models/Conversation');

const router = express.Router();

// Get all users (except current user)
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.userId } })
      .select('name email isOnline lastSeen');
    
    // Get conversations to include last message
    const conversations = await Conversation.find({
      participants: req.user.userId
    }).populate('participants', 'name email');
    
    const usersWithConversations = users.map(user => {
      const conversation = conversations.find(conv => 
        conv.participants.some(p => p._id.toString() === user._id.toString())
      );
      
      return {
        ...user.toObject(),
        lastMessage: conversation?.lastMessage,
        lastMessageAt: conversation?.lastMessageAt,
        conversationId: conversation?._id
      };
    });
    
    res.json(usersWithConversations);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;