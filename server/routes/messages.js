const express = require('express');
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

const router = express.Router();

// Get messages for a conversation
router.get('/conversations/:conversationId/messages', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.conversationId
    })
    .populate('sender', 'name email')
    .sort({ createdAt: 1 });
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create or get conversation
router.post('/conversations', auth, async (req, res) => {
  try {
    const { participantId } = req.body;
    
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.userId, participantId] }
    });
    
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.userId, participantId]
      });
    }
    
    await conversation.populate('participants', 'name email');
    
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;