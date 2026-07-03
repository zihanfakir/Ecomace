const express = require('express');
const { protect } = require('../middleware/auth');
const Notification = require('../models/Notification');

const router = express.Router();

// Get notifications for logged in user (or admin)
router.get('/', protect, async (req, res) => {
  try {
    const targets = (req.user.role === 'admin' || req.user.role === 'owner') ? ['admin', req.user._id] : [req.user._id];
    
    const notifications = await Notification.find({ target: { $in: targets } })
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark all notifications as read for current user
router.put('/read-all', protect, async (req, res) => {
  try {
    const targets = (req.user.role === 'admin' || req.user.role === 'owner') ? ['admin', req.user._id] : [req.user._id];
    
    await Notification.updateMany({ target: { $in: targets }, read: false }, { read: true });
    
    res.json({ message: 'All marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark a single notification as read
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Check ownership/target before marking read
    if (notification.target === 'admin' && (req.user.role !== 'admin' && req.user.role !== 'owner')) {
       return res.status(403).json({ message: 'Not authorized' });
    }
    if (notification.target !== 'admin' && notification.target !== req.user._id) {
       return res.status(403).json({ message: 'Not authorized' });
    }
    
    notification.read = true;
    await notification.save();
    
    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
