const express = require('express');
const { protect, admin } = require('../middleware/auth');
const mongoose = require('mongoose');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

const router = express.Router();

// Get all messages (Admin)
router.get('/', protect, admin, async (req, res) => {
  try {
    const messages = await Message.find({}).sort({ updatedAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get messages for a specific user
router.get('/user/:userId', protect, async (req, res) => {
  if (req.user._id !== req.params.userId && req.user.role !== 'admin' && req.user.role !== 'owner') {
    return res.status(403).json({ message: 'Not authorized to view these messages' });
  }
  try {
    const userMessages = await Message.find({ userId: req.params.userId }).sort({ updatedAt: -1 });
    res.json(userMessages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new ticket (User)
router.post('/', protect, async (req, res) => {
  try {
    const { subject, text, userPhone } = req.body;
    
    // Use verified userId from token instead of trusting client
    const userId = req.user._id;

    if (!userId || !subject || !text) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newMessage = new Message({
      _id: 'MSG-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      userId,
      userPhone: userPhone || req.user.phone || 'N/A',
      subject: subject,
      status: 'open',
      conversation: [
        {
          sender: 'user',
          text,
          timestamp: Date.now()
        }
      ]
    });
    
    await newMessage.save();
    
    // Add notification for admin
    const newNotification = new Notification({
      _id: 'NOTIF-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      target: 'admin',
      type: 'message',
      title: 'New Support Ticket',
      message: `New support ticket: ${subject}`,
      link: '/admin'
    });
    await newNotification.save();
    
    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reply to a ticket (Admin or User)
router.post('/:id/reply', protect, async (req, res) => {
  try {
    const { text } = req.body;
    
    // Strictly set sender based on authenticated token, ignoring client request
    const sender = (req.user.role === 'admin' || req.user.role === 'owner') ? 'admin' : 'user';
    
    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }
    
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    // Ownership check: only the ticket owner or an admin can reply
    const isOwner = message.userId === req.user._id;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'owner';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to reply to this ticket' });
    }
    
    const reply = {
      sender,
      text,
      timestamp: Date.now()
    };
    
    message.conversation.push(reply);
    message.updatedAt = Date.now();
    
    // Automatically reopen if a user replies to a closed ticket
    if (sender === 'user' && message.status === 'closed') {
      message.status = 'open';
    }
    
    await message.save();
    
    // Add notification
    const target = sender === 'admin' ? message.userId : 'admin';
    const link = sender === 'admin' ? '/dashboard' : '/admin';
    const newNotification = new Notification({
      _id: 'NOTIF-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      target,
      type: 'message_reply',
      title: 'Ticket Reply',
      message: `New reply on ticket: ${message.subject}`,
      link
    });
    await newNotification.save();
    
    res.json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update ticket status (Admin)
router.put('/:id/status', protect, admin, async (req, res) => {
  try {
    const { status } = req.body;
    
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    message.status = status;
    message.updatedAt = Date.now();
    
    await message.save();
    res.json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
