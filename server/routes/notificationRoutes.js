const express = require('express');
const { readData, writeData } = require('../data/db');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Get notifications for logged in user (or admin)
router.get('/', protect, async (req, res) => {
  try {
    const data = await readData();
    const notifications = data.notifications || [];
    
    let userNotifications = [];
    
    if (req.user.role === 'admin' || req.user.role === 'owner') {
      // Admins see notifications intended for admins
      userNotifications = notifications.filter(n => n.target === 'admin');
    } else {
      // Customers see notifications intended for their userId
      userNotifications = notifications.filter(n => n.target === req.user._id);
    }
    
    // Sort by newest first, limit to 20
    userNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json(userNotifications.slice(0, 20));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark a single notification as read
router.put('/:id/read', protect, async (req, res) => {
  try {
    const data = await readData();
    const notifications = data.notifications || [];
    
    const index = notifications.findIndex(n => n._id === req.params.id);
    if (index !== -1) {
      // Check ownership/target before marking read
      if (notifications[index].target === 'admin' && (req.user.role !== 'admin' && req.user.role !== 'owner')) {
         return res.status(403).json({ message: 'Not authorized' });
      }
      if (notifications[index].target !== 'admin' && notifications[index].target !== req.user._id) {
         return res.status(403).json({ message: 'Not authorized' });
      }
      
      notifications[index].read = true;
      data.notifications = notifications;
      await writeData(data);
    }
    
    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark all notifications as read for current user
router.put('/read-all', protect, async (req, res) => {
  try {
    const data = await readData();
    const notifications = data.notifications || [];
    
    const target = (req.user.role === 'admin' || req.user.role === 'owner') ? 'admin' : req.user._id;
    
    notifications.forEach(n => {
      if (n.target === target) {
        n.read = true;
      }
    });
    
    data.notifications = notifications;
    await writeData(data);
    
    res.json({ message: 'All marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
