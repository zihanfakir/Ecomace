const express = require('express');
const { readData, writeData } = require('../data/db');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// Get all coupons (Admin)
router.get('/', protect, admin, async (req, res) => {
  try {
    const data = await readData();
    res.json(data.coupons || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new coupon (Admin)
router.post('/', protect, admin, async (req, res) => {
  try {
    const data = await readData();
    if (!data.coupons) data.coupons = [];

    const existing = data.coupons.find(c => c.code.toLowerCase() === req.body.code.toLowerCase());
    if (existing) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }

    if (req.body.discountType === 'percent' && Number(req.body.discountPercent) > 100) {
      return res.status(400).json({ message: 'Percentage discount cannot exceed 100%' });
    }

    const newCoupon = {
      _id: Date.now().toString() + Math.random().toString(36).substring(7),
      code: req.body.code.toUpperCase(),
      discountPercent: req.body.discountPercent,
      discountType: req.body.discountType || 'percent',
      applicableType: req.body.applicableType || 'all',
      applicableTo: req.body.applicableTo || null,
      usageLimit: req.body.usageLimit ? parseInt(req.body.usageLimit, 10) : null,
      minPurchaseAmount: req.body.minPurchaseAmount ? Number(req.body.minPurchaseAmount) : null,
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

// Update/Toggle coupon status (Admin)
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const data = await readData();
    const index = data.coupons.findIndex(c => c._id === req.params.id);
    
    if (index === -1) return res.status(404).json({ message: 'Coupon not found' });
    
    const updatedCoupon = {
      ...data.coupons[index],
      ...req.body
    };
    
    if (updatedCoupon.discountType === 'percent' && Number(updatedCoupon.discountPercent) > 100) {
      return res.status(400).json({ message: 'Percentage discount cannot exceed 100%' });
    }
    
    data.coupons[index] = updatedCoupon;
    
    await writeData(data);
    res.json(data.coupons[index]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete coupon (Admin)
router.delete('/:id', protect, admin, async (req, res) => {
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
