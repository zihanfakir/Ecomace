const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  sender: { type: String, required: true }, // 'user' or 'admin'
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const MessageSchema = new mongoose.Schema({
  _id: { type: String },
  userId: { type: String, required: true },
  userPhone: { type: String },
  subject: { type: String, required: true },
  status: { type: String, default: 'open' }, // 'open', 'closed'
  conversation: [ConversationSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', MessageSchema);
