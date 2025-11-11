const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: String,
  lastMessageAt: Date
}, {
  timestamps: true
});

// Remove unique index to prevent duplicate key errors
// conversationSchema.index({ participants: 1 }, { unique: true });

module.exports = mongoose.model('Conversation', conversationSchema);