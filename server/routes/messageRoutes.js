const express = require('express');
const { readData, writeData } = require('../data/db');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// Get all messages (Admin)
router.get('/', protect, admin, async (req, res) => {
  try {
    const data = await readData();
    res.json(data.messages || []);
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
    const data = await readData();
    const userMessages = (data.messages || []).filter(m => m.userId === req.params.userId);
    res.json(userMessages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new support ticket
router.post('/', async (req, res) => {
  try {
    const data = await readData();
    const { userId, userName, userEmail, userPhone, subject, text } = req.body;
    
    if (!userId || !text) {
      return res.status(400).json({ message: 'User ID and message text are required' });
    }
    
    const newMessage = {
      _id: Date.now().toString() + Math.random().toString(36).substring(7),
      userId,
      userName: userName || 'Unknown User',
      userEmail: userEmail || 'unknown@example.com',
      userPhone: userPhone || 'N/A',
      subject: subject || 'Support Request',
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      conversation: [
        {
          sender: 'user',
          text,
          timestamp: new Date().toISOString()
        }
      ]
    };
    
    data.messages = data.messages || [];
    data.messages.push(newMessage);
    await writeData(data);
    
    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reply to a ticket (Admin or User)
router.post('/:id/reply', protect, async (req, res) => {
  try {
    const data = await readData();
    const { text } = req.body;
    
    // Strictly set sender based on authenticated token, ignoring client request
    const sender = (req.user.role === 'admin' || req.user.role === 'owner') ? 'admin' : 'user';
    
    if (!sender || !text) {
      return res.status(400).json({ message: 'Sender and text are required' });
    }
    
    const msgIndex = (data.messages || []).findIndex(m => m._id === req.params.id);
    if (msgIndex === -1) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    const reply = {
      sender,
      text,
      timestamp: new Date().toISOString()
    };
    
    data.messages[msgIndex].conversation.push(reply);
    data.messages[msgIndex].updatedAt = new Date().toISOString();
    
    // Automatically reopen if a user replies to a closed ticket
    if (sender === 'user' && data.messages[msgIndex].status === 'closed') {
      data.messages[msgIndex].status = 'open';
    }
    
    await writeData(data);
    res.json(data.messages[msgIndex]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update ticket status (Admin)
router.put('/:id/status', protect, admin, async (req, res) => {
  try {
    const data = await readData();
    const { status } = req.body;
    
    const msgIndex = (data.messages || []).findIndex(m => m._id === req.params.id);
    if (msgIndex === -1) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    data.messages[msgIndex].status = status;
    data.messages[msgIndex].updatedAt = new Date().toISOString();
    
    await writeData(data);
    res.json(data.messages[msgIndex]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
