const express = require('express');
const { readData, writeData } = require('../data/db');
const bcrypt = require('bcryptjs');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// Get all users
router.get('/', protect, admin, async (req, res) => {
  try {
    const data = await readData();
    const safeUsers = (data.users || []).map(u => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      photoUrl: u.photoUrl,
      phone: u.phone,
      createdAt: u.createdAt
    }));
    res.json(safeUsers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update user details
router.put('/:id', protect, async (req, res) => {
  if (req.user._id !== req.params.id && req.user.role !== 'admin' && req.user.role !== 'owner') {
    return res.status(403).json({ message: 'Not authorized to update this user' });
  }

  try {
    const data = await readData();
    const userIndex = data.users.findIndex(u => u._id === req.params.id);
    
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if email is being changed and already exists for another user
    if (req.body.email && req.body.email !== data.users[userIndex].email) {
      const emailExists = data.users.find(u => u.email === req.body.email);
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }
    
    // Role protection logic
    if (req.body.role && req.body.role !== data.users[userIndex].role) {
      const requester = req.user; // from protect middleware
      
      if (!requester || (requester.role !== 'admin' && requester.role !== 'owner')) {
        return res.status(403).json({ message: 'Only admins or owners can change roles' });
      }
      
      const targetUser = data.users[userIndex];
      
      // If target is owner, ONLY an owner can change them
      if (targetUser.role === 'owner' && requester.role !== 'owner') {
        return res.status(403).json({ message: 'Admins cannot change owner roles' });
      }
      
      // If making someone an owner, ONLY an owner can do it
      if (req.body.role === 'owner' && requester.role !== 'owner') {
        return res.status(403).json({ message: 'Only owners can create other owners' });
      }
    }
    
    const updatedUser = {
      ...data.users[userIndex],
      name: req.body.name || data.users[userIndex].name,
      email: req.body.email || data.users[userIndex].email,
      role: req.body.role || data.users[userIndex].role,
      photoUrl: req.body.photoUrl !== undefined ? req.body.photoUrl : data.users[userIndex].photoUrl
    };
    
    // Only update password if provided
    if (req.body.password && req.body.password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      updatedUser.password = await bcrypt.hash(req.body.password, salt);
    }
    
    data.users[userIndex] = updatedUser;
    await writeData(data);
    
    // Return updated user profile (without password)
    const userProfile = { _id: updatedUser._id, name: updatedUser.name, email: updatedUser.email, role: updatedUser.role, photoUrl: updatedUser.photoUrl };
    res.json(userProfile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
