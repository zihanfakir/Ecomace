const express = require('express');
const { protect, admin } = require('../middleware/auth');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const Notification = require('../models/Notification');
const router = express.Router();

const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Get all orders (Admin only)
router.get('/', protect, admin, async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get orders by specific user
router.get('/user/:userId', protect, async (req, res) => {
  if (req.user._id !== req.params.userId && req.user.role !== 'admin' && req.user.role !== 'owner') {
    return res.status(403).json({ message: 'Not authorized to view these orders' });
  }
  try {
    const userOrders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    const safeOrders = userOrders.map(o => {
      const orderObj = o.toObject ? o.toObject() : o;
      if (orderObj.status !== 'completed' && orderObj.status !== 'approved') {
        return {
          ...orderObj,
          items: (orderObj.items || []).map(item => ({ ...item, keys: [] }))
        };
      }
      return orderObj;
    });
    res.json(safeOrders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Checkout (Process multiple products from cart)
router.post('/checkout', protect, async (req, res) => {
  const modifiedProducts = [];
  let appliedCoupon = null;

  try {
    const { cartItems, customerDetails, paymentMethod, paymentDetails, couponCode } = req.body;
    
    if (!cartItems || cartItems.length === 0) {
      throw new Error('Cart is empty');
    }

    let subtotal = 0;
    const purchasedItems = [];

    // Verify stock and prepare items
    for (const item of cartItems) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new Error('Invalid quantity');
      }
      const product = await Product.findById(item.product._id);
      if (!product) {
        throw new Error(`Product ${item.product.name} not found`);
      }
      if (!product.stockKeys || product.stockKeys.length < item.quantity) {
        throw new Error(`Not enough stock for ${product.name}`);
      }

      let finalPrice = product.price;
      if (product.discount > 0) {
        if (product.discountType === 'flat') {
          finalPrice = Math.max(0, product.price - product.discount);
        } else {
          finalPrice = Math.round(product.price - (product.price * (product.discount / 100)));
          finalPrice = Math.max(0, finalPrice);
        }
      }
      subtotal += finalPrice * item.quantity;
      
      const keys = [];
      for (let i = 0; i < item.quantity; i++) {
        keys.push(product.stockKeys.shift());
      }
      
      purchasedItems.push({
        productId: product._id,
        productName: product.name,
        category: product.category,
        quantity: item.quantity,
        price: finalPrice,
        keys: keys
      });
      
      await product.save();
      modifiedProducts.push({ product, keys });
    }

    // Apply Coupon
    let discountAmount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: { $regex: new RegExp(`^${escapeRegExp(couponCode)}$`, 'i') }, isActive: true });
      if (!coupon) {
        throw new Error('Invalid or inactive coupon code');
      }
      
      if (coupon.usageLimit && (coupon.usageCount || 0) >= coupon.usageLimit) {
        throw new Error('Coupon usage limit reached');
      }
      
      let applicableSubtotal = 0;
      
      if (coupon.applicableType === 'product') {
        const applicableItems = purchasedItems.filter(item => item.productId === coupon.applicableTo);
        if (applicableItems.length === 0) {
          throw new Error('Coupon is not valid for any items in cart');
        }
        applicableSubtotal = applicableItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      } else if (coupon.applicableType === 'category') {
        const applicableItems = purchasedItems.filter(item => item.category === coupon.applicableTo);
        if (applicableItems.length === 0) {
          throw new Error('Coupon is not valid for any items in cart');
        }
        applicableSubtotal = applicableItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      } else {
        applicableSubtotal = subtotal;
      }

      if (coupon.discountType === 'flat') {
        discountAmount = Math.min(coupon.discountPercent, applicableSubtotal); 
      } else {
        discountAmount = Math.round(applicableSubtotal * (coupon.discountPercent / 100));
      }
      // Cap discount to applicable subtotal
      discountAmount = Math.min(discountAmount, applicableSubtotal);
      
      coupon.usageCount = (coupon.usageCount || 0) + 1;
      await coupon.save();
      appliedCoupon = coupon;
    }
    
    const totalPrice = subtotal - discountAmount;

    const newOrder = new Order({
      _id: 'ORD-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      userId: req.user._id,
      customerName: customerDetails.name || req.user.name || 'Guest',
      customerPhone: customerDetails.phone,
      customerDetails: customerDetails || {},
      paymentMethod: paymentMethod || 'bkash',
      paymentDetails: paymentDetails || {},
      transactionId: paymentDetails?.transactionId || 'N/A',
      paymentPhone: paymentDetails?.phone || '',
      couponApplied: couponCode ? { code: couponCode, discountAmount } : null,
      items: purchasedItems,
      subtotal,
      totalPrice,
      status: 'pending'
    });
    
    await newOrder.save();
    
    const newNotification = new Notification({
      _id: 'NOTIF-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      target: 'admin',
      type: 'order',
      title: 'New Order',
      message: `New order ${newOrder._id} received for ৳ ${totalPrice}`,
      link: '/admin'
    });

    try { await newNotification.save(); } catch (e) { console.error('Notification failed to save', e); }
    
    const orderObj = newOrder.toObject();
    const safeOrder = {
      ...orderObj,
      items: orderObj.items.map(item => ({ ...item, keys: [] }))
    };

    res.status(200).json({ message: 'Checkout successful', order: safeOrder });
  } catch (err) {
    // Manual Rollback
    for (const modified of modifiedProducts) {
      try {
        modified.product.stockKeys = [...modified.keys, ...modified.product.stockKeys];
        await modified.product.save();
      } catch (rollbackErr) {
        console.error('Failed to rollback product stock:', rollbackErr);
      }
    }
    if (appliedCoupon) {
      try {
        appliedCoupon.usageCount -= 1;
        await appliedCoupon.save();
      } catch (rollbackErr) {
        console.error('Failed to rollback coupon usage:', rollbackErr);
      }
    }
    res.status(400).json({ message: err.message });
  }
});

// Update order status (Approve/Reject)
router.put('/:id/status', protect, admin, async (req, res) => {
  const modifiedProducts = [];
  let modifiedCoupon = null;

  try {
    const { status } = req.body;
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      throw new Error('Order not found');
    }
    
    if (order.statusChangeCount === undefined) {
      order.statusChangeCount = 0;
    }

    if (order.status === status) {
      throw new Error('Status is already ' + status);
    }
    
    if (order.statusChangeCount >= 5) {
      throw new Error('Order status can only be changed up to 5 times');
    }
    
    if (status === 'cancelled' || status === 'rejected') {
      if (order.status !== 'cancelled' && order.status !== 'rejected') {
        // Restore keys to products
        if (order.items) {
          for (const item of order.items) {
            const product = await Product.findById(item.productId);
            if (product && item.keys && item.keys.length > 0) {
              product.stockKeys = [...product.stockKeys, ...item.keys];
              await product.save();
              modifiedProducts.push({ product, action: 'restore', keys: item.keys });
            }
          }
        }
        if (order.couponApplied?.code) {
          const coupon = await Coupon.findOne({ code: { $regex: new RegExp(`^${escapeRegExp(order.couponApplied.code)}$`, 'i') } });
          if (coupon && coupon.usageCount > 0) {
            coupon.usageCount -= 1;
            await coupon.save();
            modifiedCoupon = { coupon, action: 'restore' };
          }
        }
      }
    } else if (order.status === 'cancelled' || order.status === 'rejected') {
      if (order.items) {
        for (const item of order.items) {
          const product = await Product.findById(item.productId);
          if (product && item.keys && item.keys.length > 0) {
            const availableKeys = product.stockKeys || [];
            const keysStillAvailable = item.keys.every(k => availableKeys.includes(k));
            if (!keysStillAvailable) {
              throw new Error(`Cannot re-approve order: some stock keys for "${item.productName}" have already been re-sold. Please issue a manual replacement.`);
            }
            item.keys.forEach(k => {
              const idx = product.stockKeys.indexOf(k);
              if (idx !== -1) product.stockKeys.splice(idx, 1);
            });
            await product.save();
            modifiedProducts.push({ product, action: 'consume', keys: item.keys });
          }
        }
      }
    }
    
    order.status = status;
    order.statusChangeCount += 1;
    
    await order.save();
    
    if (order.userId && order.userId !== 'guest') {
      const newNotification = new Notification({
        _id: 'NOTIF-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        target: order.userId,
        type: 'order_update',
        title: 'Order Status Update',
        message: `Your order ${order._id} status is now: ${status}`,
        link: '/dashboard'
      });
      try { await newNotification.save(); } catch (e) { console.error('Notification failed to save', e); }
    }
    
    res.status(200).json(order);
  } catch (err) {
    // Rollback
    for (const modified of modifiedProducts) {
      try {
        if (modified.action === 'restore') {
          // undo restore
          modified.keys.forEach(k => {
            const idx = modified.product.stockKeys.indexOf(k);
            if (idx !== -1) modified.product.stockKeys.splice(idx, 1);
          });
        } else {
          // undo consume
          modified.product.stockKeys = [...modified.keys, ...modified.product.stockKeys];
        }
        await modified.product.save();
      } catch (rollbackErr) {
        console.error('Failed to rollback product stock:', rollbackErr);
      }
    }
    if (modifiedCoupon) {
      try {
        modifiedCoupon.coupon.usageCount += 1; // undo restore
        await modifiedCoupon.coupon.save();
      } catch (rollbackErr) {
        console.error('Failed to rollback coupon usage:', rollbackErr);
      }
    }
    res.status(400).json({ message: err.message });
  }
});

// Delete Order
router.delete('/:id', protect, admin, async (req, res) => {
  const modifiedProducts = [];

  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      throw new Error('Order not found');
    }
    
    if (order.status !== 'cancelled' && order.status !== 'rejected') {
      if (order.items) {
        for (const item of order.items) {
          const product = await Product.findById(item.productId);
          if (product && item.keys && item.keys.length > 0) {
            product.stockKeys = [...product.stockKeys, ...item.keys];
            await product.save();
            modifiedProducts.push({ product, keys: item.keys });
          }
        }
      }
    }
    
    await Order.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (err) {
    // Rollback
    for (const modified of modifiedProducts) {
      try {
        modified.keys.forEach(k => {
          const idx = modified.product.stockKeys.indexOf(k);
          if (idx !== -1) modified.product.stockKeys.splice(idx, 1);
        });
        await modified.product.save();
      } catch (rollbackErr) {
        console.error('Failed to rollback product stock:', rollbackErr);
      }
    }
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
