const express = require('express');
const { readData, writeData } = require('../data/db');

const router = express.Router();
const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '../data.json');

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const data = await readData();
    
    const user = data.users.find(u => u.email === email && u.password === password);
    
    if (user) {
      // In a real app we would use JWT, here we just return the user object (minus password)
      const userProfile = { _id: user._id, name: user.name, email: user.email, role: user.role, photoUrl: user.photoUrl };
      res.json({ user: userProfile, token: 'mock-jwt-token-' + user._id });
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

    const newUser = {
      _id: 'user_' + Date.now().toString() + Math.random().toString(36).substring(7),
      name,
      email,
      password,
      role: 'customer', // default role
      createdAt: new Date().toISOString()
    };

    data.users.push(newUser);
    await writeData(data);

    const userProfile = { _id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role, photoUrl: newUser.photoUrl };
    res.status(201).json({ user: userProfile, token: 'mock-jwt-token-' + newUser._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
