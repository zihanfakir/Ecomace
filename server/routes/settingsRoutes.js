const express = require('express');
const { readData, writeData, withTransaction } = require('../data/db');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

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
router.put('/', protect, admin, async (req, res) => {
  try {
    const response = await withTransaction(async (data) => {
      data.settings = { ...data.settings, ...req.body };
      return { modified: true, data, response: { status: 200, body: data.settings } };
    });
    res.status(response.status).json(response.body);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
