const express = require('express');
const { protect, admin } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Get all users (Admin only)
router.get('/', protect, admin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user profile (Self or Admin)
router.put('/:id', protect, async (req, res) => {
  try {
    // Only allow users to update their own profile, unless they are admin
    if (req.user._id !== req.params.id && req.user.role !== 'admin' && req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Protection: Admin cannot modify an Owner's profile (name, email, password, etc)
    if (user.role === 'owner' && req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Only an owner can modify an owner profile' });
    }

    user.name = req.body.name || user.name;
    user.photoUrl = req.body.photoUrl !== undefined ? req.body.photoUrl : user.photoUrl;

    if (req.body.email) {
      // Check if new email is already taken
      const emailExists = await User.findOne({ email: req.body.email });
      if (emailExists && emailExists._id !== user._id) {
        return res.status(400).json({ message: 'Email is already taken by another account' });
      }
      user.email = req.body.email;
    }

    // Admins can update roles
    if (req.body.role && (req.user.role === 'admin' || req.user.role === 'owner')) {
       // Only owner can create another owner or demote an owner
       if (req.body.role === 'owner' && req.user.role !== 'owner') {
           return res.status(403).json({ message: 'Only an owner can grant owner privileges' });
       }
       if (user.role === 'owner' && req.user.role !== 'owner') {
           return res.status(403).json({ message: 'Only an owner can modify another owner' });
       }
       user.role = req.body.role;
    }

    if (req.body.password) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
    }

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      photoUrl: user.photoUrl
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete user (Admin only)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'owner' && req.user.role !== 'owner') {
        return res.status(403).json({ message: 'Only an owner can delete another owner' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
