const express = require('express');
const { readData, writeData } = require('../data/db');

const router = express.Router();
const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '../data.json');

// Helper to read data
// Helper to write data
// Get settings
router.get('/', async (req, res) => {
  try {
    const data = await readData();
    if (!data.settings) {
      data.settings = {
        paymentMethods: {
          bkash: '',
          nagad: '',
          rocket: '',
          upay: '',
          bybit: '',
          binance: ''
        },
        banners: []
      };
      await writeData(data);
    }
    res.json(data.settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update settings (Admin)
router.put('/', async (req, res) => {
  try {
    const data = await readData();
    data.settings = { ...data.settings, ...req.body };
    await writeData(data);
    res.json(data.settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
