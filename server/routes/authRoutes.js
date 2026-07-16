const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login/register attempts from this IP, please try again after 15 minutes" }
});

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Login Route
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    const lowerEmail = email.toLowerCase();
    const user = await User.findOne({ email: lowerEmail });
    
    if (user && (await bcrypt.compare(password, user.password))) {
      const userProfile = { _id: user._id, name: user.name, email: user.email, role: user.role, photoUrl: user.photoUrl };
      res.json({ user: userProfile, token: generateToken(user._id) });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Register Route
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const lowerEmail = email.toLowerCase();
    
    // Check if user already exists
    const userExists = await User.findOne({ email: lowerEmail });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Validation
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Name is required' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(lowerEmail)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      _id: 'user_' + Date.now().toString() + Math.random().toString(36).substring(7),
      name,
      email: lowerEmail,
      password: hashedPassword,
      role: 'customer'
    });

    await newUser.save();

    const userProfile = { _id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role, photoUrl: newUser.photoUrl };
    res.status(201).json({ user: userProfile, token: generateToken(newUser._id) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
