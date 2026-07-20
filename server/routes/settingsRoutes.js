const express = require('express');
const { protect, admin } = require('../middleware/auth');
const mongoose = require('mongoose');
const Setting = require('../models/Setting');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');

const router = express.Router();

// Get settings
router.get('/', async (req, res) => {
  try {
    let settingDoc = await Setting.findOne({ settingType: 'global' });
    
    if (!settingDoc) {
      settingDoc = new Setting({
        settingType: 'global',
        state: {
          paymentMethods: {
            bkash: '',
            nagad: '',
            rocket: '',
            upay: '',
            bybit: '',
            binance: ''
          },
          banners: []
        }
      });
      await settingDoc.save();
    }
    // Cache the settings for 5 minutes (300 seconds) since they rarely change
    res.set('Cache-Control', 'public, max-age=300');
    res.json(settingDoc.state || {});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update settings (Admin)
router.put('/', protect, admin, async (req, res) => {
  try {
    let settingDoc = await Setting.findOne({ settingType: 'global' });
    
    if (!settingDoc) {
      settingDoc = new Setting({
        settingType: 'global',
        state: {}
      });
    }
    
    // BUG-013 FIX: Whitelist allowed settings keys to prevent prototype pollution and arbitrary injection
    const ALLOWED_SETTINGS_KEYS = ['paymentMethods', 'banners', 'noticeText', 'noticeColor', 'footerText', 'telegramLink', 'whatsappLink', 'categoryOrder'];
    const safeUpdate = {};
    ALLOWED_SETTINGS_KEYS.forEach(key => {
      if (req.body[key] !== undefined) {
        safeUpdate[key] = req.body[key];
      }
    });

    settingDoc.state = { ...(settingDoc.state || {}), ...safeUpdate };
    settingDoc.markModified('state'); // Ensure Mongoose knows the Mixed type was modified
    await settingDoc.save();
    
    res.json(settingDoc.state);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Trigger database migration (Admin)
router.post('/migrate', protect, admin, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const storeCollection = db.collection('stores');
    const mainDoc = await storeCollection.findOne({ docId: 'main' });
    
    if (!mainDoc) {
      return res.status(400).json({ message: 'No monolithic "main" document found. Nothing to migrate.' });
    }

    const state = mainDoc.state;
    let log = [];

    // Safe migration: insert first, then delete old only if insert succeeds
    // 1. Users
    if (state.users && state.users.length > 0) {
      await User.deleteMany({});
      await User.insertMany(state.users, { ordered: false });
      log.push(`Migrated ${state.users.length} users.`);
    }

    // 2. Products
    if (state.products && state.products.length > 0) {
      await Product.deleteMany({});
      await Product.insertMany(state.products, { ordered: false });
      log.push(`Migrated ${state.products.length} products.`);
    }

    // 3. Orders
    if (state.orders && state.orders.length > 0) {
      await Order.deleteMany({});
      await Order.insertMany(state.orders, { ordered: false });
      log.push(`Migrated ${state.orders.length} orders.`);
    }

    // 4. Coupons
    if (state.coupons && state.coupons.length > 0) {
      await Coupon.deleteMany({});
      await Coupon.insertMany(state.coupons, { ordered: false });
      log.push(`Migrated ${state.coupons.length} coupons.`);
    }

    // 7. Settings
    if (state.settings) {
      await Setting.deleteMany({});
      await Setting.create({ settingType: 'global', state: state.settings });
      log.push('Migrated settings.');
    }

    // Mark as migrated to prevent accidental re-run
    await storeCollection.updateOne({ docId: 'main' }, { $set: { docId: 'main_migrated' } });

    res.json({ message: 'Migration completed successfully.', log });
  } catch (err) {
    res.status(500).json({ message: 'Migration failed: ' + err.message });
  }
});

module.exports = router;
