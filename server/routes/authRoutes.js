const express = require('express');
const { readData, writeData } = require('../data/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_key', {
    expiresIn: '30d',
  });
};

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const data = await readData();
    
    const user = data.users.find(u => u.email === email);
    
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
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const data = await readData();
    
    // Check if user already exists
    if (data.users.find(u => u.email === email)) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      _id: 'user_' + Date.now().toString() + Math.random().toString(36).substring(7),
      name,
      email,
      password: hashedPassword,
      role: 'customer', // default role
      createdAt: new Date().toISOString()
    };

    data.users.push(newUser);
    await writeData(data);

    const userProfile = { _id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role, photoUrl: newUser.photoUrl };
    res.status(201).json({ user: userProfile, token: generateToken(newUser._id) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
