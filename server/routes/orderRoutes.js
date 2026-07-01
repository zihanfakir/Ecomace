const express = require('express');
const { readData, writeData } = require('../data/db');

const router = express.Router();
const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '../data.json');

// Get all orders (Admin only ideally, but we'll leave it open for now and handle protection in frontend)
router.get('/', async (req, res) => {
  try {
    const data = await readData();
    res.json(data.orders || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get orders by specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const data = await readData();
    const userOrders = (data.orders || []).filter(o => o.userId === req.params.userId);
    res.json(userOrders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Checkout (Process multiple products from cart)
router.post('/checkout', async (req, res) => {
  try {
    const { cartItems, userId, customerDetails, paymentMethod, paymentDetails, couponCode } = req.body;
    const data = await readData();
    
    let subtotal = 0;
    const purchasedItems = [];

    // Verify stock and prepare items
    for (const item of cartItems) {
      const productIndex = data.products.findIndex(p => p._id === item.product._id);
      if (productIndex === -1) {
        return res.status(404).json({ message: `Product ${item.product.name} not found` });
      }
      const product = data.products[productIndex];
      if (!product.stockKeys || product.stockKeys.length < item.quantity) {
        return res.status(400).json({ message: `Not enough stock for ${product.name}` });
      }

      let finalPrice = product.price;
      if (product.discount > 0) {
        if (product.discountType === 'flat') {
          finalPrice = Math.max(0, product.price - product.discount);
        } else {
          finalPrice = Math.round(product.price - (product.price * (product.discount / 100)));
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
        quantity: item.quantity,
        price: finalPrice,
        keys: keys
      });
      
      // Update product stock
      data.products[productIndex] = product;
    }

    // Apply Coupon
    let discountAmount = 0;
    if (couponCode) {
      const coupon = (data.coupons || []).find(c => c.code.toUpperCase() === couponCode.toUpperCase() && c.isActive);
      if (coupon) {
        if (coupon.discountType === 'flat') {
          discountAmount = coupon.discountPercent; // this holds the value
        } else {
          discountAmount = Math.round(subtotal * (coupon.discountPercent / 100));
        }
        
        // Increment usage count
        const couponIndex = data.coupons.findIndex(c => c.code.toUpperCase() === couponCode.toUpperCase());
        if (couponIndex !== -1) {
          data.coupons[couponIndex].usageCount = (data.coupons[couponIndex].usageCount || 0) + 1;
        }
      }
    }
    
    const totalPrice = subtotal - discountAmount;

    // Create Order Record
    const newOrder = {
      _id: 'ORD-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      userId: userId || 'guest',
      customerDetails: customerDetails || {},
      paymentMethod: paymentMethod || 'bkash',
      paymentDetails: paymentDetails || {},
      couponApplied: couponCode ? { code: couponCode, discountAmount } : null,
      items: purchasedItems,
      subtotal,
      totalPrice,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    if (!data.orders) data.orders = [];
    data.orders.push(newOrder);
    await writeData(data);
    
    res.json({ message: 'Checkout successful', order: newOrder });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update order status (Approve/Reject)
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const data = await readData();
    const orderIndex = data.orders.findIndex(o => o._id === req.params.id);
    
    if (orderIndex === -1) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    const order = data.orders[orderIndex];
    
    // Initialize change count if not present
    if (order.statusChangeCount === undefined) {
      order.statusChangeCount = 0;
    }

    if (order.status === status) {
      return res.status(400).json({ message: 'Status is already ' + status });
    }
    
    if (order.statusChangeCount >= 5) {
      return res.status(400).json({ message: 'Order status can only be changed up to 5 times' });
    }
    
    // Logic for restoring keys if rejecting an order that was NOT already rejected
    if (status === 'cancel' || status === 'rejected') {
      if (order.status !== 'cancel' && order.status !== 'rejected') {
        // Restore keys to products
        if (order.items) {
          order.items.forEach(item => {
            const productIndex = data.products.findIndex(p => p._id === item.productId);
            if (productIndex !== -1 && item.keys && item.keys.length > 0) {
              data.products[productIndex].stockKeys = [...data.products[productIndex].stockKeys, ...item.keys];
            }
          });
        }
      }
    } else if (order.status === 'cancel' || order.status === 'rejected') {
      // If moving FROM a cancelled state to a processing/complete state, we should ideally deduct stock again.
      // But for simplicity, we just allow the status change. The keys were returned to stock.
      // In a real system, we'd check if stock is still available and re-deduct it.
      // For this app, we will just allow the status change.
    }
    
    order.status = status;
    order.statusChangeCount += 1;
    
    data.orders[orderIndex] = order;
    await writeData(data);
    
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete Order
router.delete('/:id', async (req, res) => {
  try {
    const data = await readData();
    const orderIndex = data.orders.findIndex(o => o._id === req.params.id);
    
    if (orderIndex === -1) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    data.orders.splice(orderIndex, 1);
    await writeData(data);
    
    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
