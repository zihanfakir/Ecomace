const express = require('express');
const { readData, writeData } = require('../data/db');

const router = express.Router();
const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '../data.json');

// Get all coupons
router.get('/', async (req, res) => {
  try {
    const data = await readData();
    res.json(data.coupons || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new coupon
router.post('/', async (req, res) => {
  try {
    const data = await readData();
    if (!data.coupons) data.coupons = [];

    const existing = data.coupons.find(c => c.code.toLowerCase() === req.body.code.toLowerCase());
    if (existing) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }

    const newCoupon = {
      _id: Date.now().toString() + Math.random().toString(36).substring(7),
      code: req.body.code.toUpperCase(),
      discountPercent: req.body.discountPercent,
      discountType: req.body.discountType || 'percent',
      usageLimit: req.body.usageLimit ? parseInt(req.body.usageLimit, 10) : null,
      usageCount: 0,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    data.coupons.push(newCoupon);
    await writeData(data);
    res.status(201).json(newCoupon);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update/Toggle coupon status
router.put('/:id', async (req, res) => {
  try {
    const data = await readData();
    const index = data.coupons.findIndex(c => c._id === req.params.id);
    
    if (index === -1) return res.status(404).json({ message: 'Coupon not found' });
    
    data.coupons[index] = {
      ...data.coupons[index],
      ...req.body
    };
    
    await writeData(data);
    res.json(data.coupons[index]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete coupon
router.delete('/:id', async (req, res) => {
  try {
    const data = await readData();
    const index = data.coupons.findIndex(c => c._id === req.params.id);
    
    if (index === -1) return res.status(404).json({ message: 'Coupon not found' });
    
    data.coupons.splice(index, 1);
    await writeData(data);
    res.json({ message: 'Coupon deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Validate coupon
router.post('/validate', async (req, res) => {
  try {
    const { code } = req.body;
    const data = await readData();
    const coupons = data.coupons || [];
    
    const coupon = coupons.find(c => c.code.toUpperCase() === code.toUpperCase());
    
    if (!coupon) {
      return res.status(404).json({ message: 'Invalid coupon code' });
    }
    
    if (!coupon.isActive) {
      return res.status(400).json({ message: 'This coupon is no longer active' });
    }
    
    if (coupon.usageLimit !== null && coupon.usageLimit !== undefined) {
      if ((coupon.usageCount || 0) >= coupon.usageLimit) {
        return res.status(400).json({ message: 'Coupon usage limit reached' });
      }
    }
    
    res.json(coupon);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
