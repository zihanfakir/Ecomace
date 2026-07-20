const express = require('express');
const { protect, admin } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Get all users (Admin only)
router.get('/', protect, admin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 }).lean();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user profile (Self or Admin)
router.put('/:id', protect, async (req, res) => {
  try {
    // Only allow users to update their own profile, unless they are admin
    if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin' && req.user.role !== 'owner') {
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
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(req.body.email)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }
      const lowerEmail = req.body.email.toLowerCase();
      // Check if new email is already taken
      const emailExists = await User.findOne({ email: lowerEmail });
      if (emailExists && emailExists._id.toString() !== user._id.toString()) {
        return res.status(400).json({ message: 'Email is already taken by another account' });
      }
      user.email = lowerEmail;
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
      if (req.body.password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
      }
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
    // BUG-026 FIX: Prevent admin from deleting their own account
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

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
