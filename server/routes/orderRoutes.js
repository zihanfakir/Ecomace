const express = require('express');
const { readData, writeData } = require('../data/db');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// Get all orders (Admin only)
router.get('/', protect, admin, async (req, res) => {
  try {
    const data = await readData();
    res.json(data.orders || []);
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
    const data = await readData();
    const userOrders = (data.orders || []).filter(o => o.userId === req.params.userId).map(o => {
      // Hide keys for non-completed orders to prevent pre-payment key theft
      if (o.status !== 'completed' && o.status !== 'approved') {
        return {
          ...o,
          items: (o.items || []).map(item => ({ ...item, keys: [] }))
        };
      }
      return o;
    });
    res.json(userOrders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Checkout (Process multiple products from cart) — requires authentication
router.post('/checkout', protect, async (req, res) => {
  try {
    const { cartItems, customerDetails, paymentMethod, paymentDetails, couponCode } = req.body;
    const data = await readData();
    
    let subtotal = 0;
    const purchasedItems = [];

    // Verify stock and prepare items
    for (const item of cartItems) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        return res.status(400).json({ message: 'Invalid quantity' });
      }
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
      
      // Update product stock
      data.products[productIndex] = product;
    }

    // Apply Coupon
    let discountAmount = 0;
    if (couponCode) {
      const coupon = (data.coupons || []).find(c => c.code.toUpperCase() === couponCode.toUpperCase() && c.isActive);
      if (!coupon) {
        return res.status(400).json({ message: 'Invalid or inactive coupon code' });
      }
      
      if (coupon) {
        if (coupon.usageLimit && (coupon.usageCount || 0) >= coupon.usageLimit) {
          return res.status(400).json({ message: 'Coupon usage limit reached' });
        }
        
        let applicableSubtotal = 0;
        
        if (coupon.applicableType === 'product') {
          const applicableItems = purchasedItems.filter(item => item.productId === coupon.applicableTo);
          if (applicableItems.length === 0) {
            return res.status(400).json({ message: 'Coupon is not valid for any items in cart' });
          }
          applicableSubtotal = applicableItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        } else if (coupon.applicableType === 'category') {
          const applicableItems = purchasedItems.filter(item => item.category === coupon.applicableTo);
          if (applicableItems.length === 0) {
            return res.status(400).json({ message: 'Coupon is not valid for any items in cart' });
          }
          applicableSubtotal = applicableItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        } else {
          applicableSubtotal = subtotal;
        }

        if (coupon.minPurchaseAmount && subtotal < coupon.minPurchaseAmount) {
          return res.status(400).json({ message: `Minimum purchase of ৳${coupon.minPurchaseAmount} required for this coupon` });
        }

        if (coupon.discountType === 'flat') {
          discountAmount = Math.min(coupon.discountPercent, applicableSubtotal); 
        } else {
          discountAmount = Math.round(applicableSubtotal * (coupon.discountPercent / 100));
        }
        // Cap discount to applicable subtotal
        discountAmount = Math.min(discountAmount, applicableSubtotal);
        
        // Increment usage count
        const couponIndex = data.coupons.findIndex(c => c.code.toUpperCase() === couponCode.toUpperCase());
        if (couponIndex !== -1) {
          data.coupons[couponIndex].usageCount = (data.coupons[couponIndex].usageCount || 0) + 1;
        }
      }
    }
    
    const totalPrice = subtotal - discountAmount;

    // Use authenticated user ID from the protect middleware — never trust client-supplied userId
    const verifiedUserId = req.user._id;

    const newOrder = {
      _id: 'ORD-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      userId: verifiedUserId,
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
    
    // Add notification for admin
    if (!data.notifications) data.notifications = [];
    data.notifications.push({
      _id: 'NOTIF-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      target: 'admin',
      type: 'order',
      message: `New order ${newOrder._id} received for ৳ ${totalPrice}`,
      link: '/admin',
      read: false,
      createdAt: new Date().toISOString()
    });
    
    await writeData(data);
    
    // Hide keys in immediate checkout response
    const safeOrder = {
      ...newOrder,
      items: newOrder.items.map(item => ({ ...item, keys: [] }))
    };
    
    res.json({ message: 'Checkout successful', order: safeOrder });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update order status (Approve/Reject)
router.put('/:id/status', protect, admin, async (req, res) => {
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
    if (status === 'cancelled' || status === 'rejected') {
      if (order.status !== 'cancelled' && order.status !== 'rejected') {
        // Restore keys to products
        if (order.items) {
          order.items.forEach(item => {
            const productIndex = data.products.findIndex(p => p._id === item.productId);
            if (productIndex !== -1 && item.keys && item.keys.length > 0) {
              data.products[productIndex].stockKeys = [...data.products[productIndex].stockKeys, ...item.keys];
            }
          });
        }
        // M-11: Decrement coupon usageCount when cancelling an order that used a coupon
        if (order.couponApplied?.code) {
          const couponIndex = (data.coupons || []).findIndex(c => c.code.toUpperCase() === order.couponApplied.code.toUpperCase());
          if (couponIndex !== -1 && data.coupons[couponIndex].usageCount > 0) {
            data.coupons[couponIndex].usageCount -= 1;
          }
        }
      }
    } else if (order.status === 'cancelled' || order.status === 'rejected') {
      // H-3: Moving FROM a cancelled state back to active — re-deduct stock keys
      // Check if those specific keys are still in inventory (they might have been re-sold)
      if (order.items) {
        for (const item of order.items) {
          const productIndex = data.products.findIndex(p => p._id === item.productId);
          if (productIndex !== -1 && item.keys && item.keys.length > 0) {
            const product = data.products[productIndex];
            const availableKeys = product.stockKeys || [];
            // Check if every key for this item is still present in stock
            const keysStillAvailable = item.keys.every(k => availableKeys.includes(k));
            if (!keysStillAvailable) {
              return res.status(400).json({ 
                message: `Cannot re-approve order: some stock keys for "${item.productName}" have already been re-sold. Please issue a manual replacement.`
              });
            }
            // Remove the keys back out of inventory
            item.keys.forEach(k => {
              const idx = product.stockKeys.indexOf(k);
              if (idx !== -1) product.stockKeys.splice(idx, 1);
            });
            data.products[productIndex] = product;
          }
        }
      }
    }
    
    order.status = status;
    order.statusChangeCount += 1;
    
    data.orders[orderIndex] = order;
    
    // Notify customer
    if (!data.notifications) data.notifications = [];
    if (order.userId && order.userId !== 'guest') {
      data.notifications.push({
        _id: 'NOTIF-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        target: order.userId,
        type: 'order_update',
        message: `Your order ${order._id} status is now: ${status}`,
        link: '/dashboard',
        read: false,
        createdAt: new Date().toISOString()
      });
    }
    
    await writeData(data);
    
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete Order
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const data = await readData();
    const orderIndex = data.orders.findIndex(o => o._id === req.params.id);
    
    if (orderIndex === -1) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const order = data.orders[orderIndex];
    
    // Restore keys to products if order was not already cancelled or rejected
    if (order.status !== 'cancelled' && order.status !== 'rejected') {
      if (order.items) {
        order.items.forEach(item => {
          const productIndex = data.products.findIndex(p => p._id === item.productId);
          if (productIndex !== -1 && item.keys && item.keys.length > 0) {
            data.products[productIndex].stockKeys = [...data.products[productIndex].stockKeys, ...item.keys];
          }
        });
      }
    }
    
    data.orders.splice(orderIndex, 1);
    await writeData(data);
    
    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
