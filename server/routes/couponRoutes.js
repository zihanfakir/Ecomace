const express = require('express');
const { protect, admin } = require('../middleware/auth');
const Coupon = require('../models/Coupon');

const router = express.Router();

const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Get all coupons (Admin)
router.get('/', protect, admin, async (req, res) => {
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new coupon (Admin)
router.post('/', protect, admin, async (req, res) => {
  try {
    const existing = await Coupon.findOne({ code: { $regex: new RegExp(`^${escapeRegExp(req.body.code)}$`, 'i') } });
    if (existing) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }

    if (req.body.discountType === 'percent' && Number(req.body.discountPercent) > 100) {
      return res.status(400).json({ message: 'Percentage discount cannot exceed 100%' });
    }

    const newCoupon = new Coupon({
      _id: Date.now().toString() + Math.random().toString(36).substring(7),
      code: req.body.code.toUpperCase(),
      discountPercent: req.body.discountPercent,
      discountType: req.body.discountType || 'percent',
      applicableType: req.body.applicableType || 'all',
      applicableTo: req.body.applicableTo || null,
      usageLimit: req.body.usageLimit ? parseInt(req.body.usageLimit, 10) : null,
      usageCount: 0,
      isActive: true
    });

    await newCoupon.save();
    res.status(201).json(newCoupon);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update/Toggle coupon status (Admin)
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    
    if (req.body.discountType === 'percent' && Number(req.body.discountPercent) > 100) {
      return res.status(400).json({ message: 'Percentage discount cannot exceed 100%' });
    }
    
    // Prevent duplicate code if code is being changed
    if (req.body.code && req.body.code.toUpperCase() !== coupon.code) {
      const existing = await Coupon.findOne({ code: { $regex: new RegExp(`^${escapeRegExp(req.body.code)}$`, 'i') } });
      if (existing) {
        return res.status(400).json({ message: 'Coupon code already exists' });
      }
      coupon.code = req.body.code.toUpperCase();
    }
    
    // Explicitly allow only specific fields to be updated
    const allowedUpdates = ['discountPercent', 'discountType', 'applicableType', 'applicableTo', 'usageLimit', 'isActive'];
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        if (key === 'usageLimit') {
          coupon[key] = req.body[key] ? parseInt(req.body[key], 10) : null;
        } else {
          coupon[key] = req.body[key];
        }
      }
    });
    
    await coupon.save();
    res.json(coupon);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete coupon (Admin)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    res.json({ message: 'Coupon deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Validate coupon
router.post('/validate', async (req, res) => {
  try {
    const { code } = req.body;
    const coupon = await Coupon.findOne({ code: { $regex: new RegExp(`^${escapeRegExp(code)}$`, 'i') } });
    
    if (!coupon) {
      return res.status(404).json({ message: 'Invalid coupon code' });
    }
    
    if (!coupon.isActive) {
      return res.status(400).json({ message: 'Coupon is inactive' });
    }

    if (coupon.usageLimit && (coupon.usageCount || 0) >= coupon.usageLimit) {
      return res.status(400).json({ message: 'Coupon usage limit reached' });
    }
    
    res.json(coupon);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
