const express = require('express');
const { readData, writeData } = require('../data/db');

const router = express.Router();
const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '../data.json');

// Helper to read data
// Helper to write data
// Edit product (Admin)
router.put('/:id', async (req, res) => {
  try {
    const data = await readData();
    const productIndex = data.products.findIndex(p => p._id === req.params.id);
    
    if (productIndex === -1) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Parse keys from multiline text if it's a string, or keep it if it's already an array/undefined
    let keysArray = data.products[productIndex].stockKeys;
    if (typeof req.body.keys === 'string') {
      keysArray = req.body.keys ? req.body.keys.split('\n').map(k => k.trim()).filter(k => k) : [];
    } else if (Array.isArray(req.body.keys)) {
      keysArray = req.body.keys;
    }

    // Update fields
    const updatedProduct = {
      ...data.products[productIndex],
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      icon: req.body.icon,
      photoUrl: req.body.photoUrl,
      discount: req.body.discount,
      discountType: req.body.discountType || 'percent',
      category: req.body.category || 'Uncategorized',
      bigDescription: req.body.bigDescription,
      stockKeys: keysArray
    };
    
    data.products[productIndex] = updatedProduct;
    await writeData(data);
    
    res.json(updatedProduct);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete product (Admin)
router.delete('/:id', async (req, res) => {
  try {
    const data = await readData();
    const productIndex = data.products.findIndex(p => p._id === req.params.id);
    
    if (productIndex === -1) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    data.products.splice(productIndex, 1);
    await writeData(data);
    
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all products
router.get('/', async (req, res) => {
  try {
    const data = await readData();
    res.json(data.products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new product (License Keys/Accounts)
router.post('/', express.json(), async (req, res) => {
  try {
    const data = await readData();
    
    // Parse keys from multiline text
    const keysArray = req.body.keys ? req.body.keys.split('\n').map(k => k.trim()).filter(k => k) : [];

    const newProduct = {
      _id: Date.now().toString() + Math.random().toString(36).substring(7),
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      icon: req.body.icon,
      photoUrl: req.body.photoUrl,
      discount: req.body.discount || 0,
      discountType: req.body.discountType || 'percent',
      category: req.body.category || 'Uncategorized',
      bigDescription: req.body.bigDescription || '',
      stockKeys: keysArray, // Store all available keys/accounts
      createdAt: new Date().toISOString()
    };

    data.products.push(newProduct);
    await writeData(data);
    
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Buy a product (decrease stock and return a key)
router.post('/:id/buy', async (req, res) => {
  try {
    const data = await readData();
    const productIndex = data.products.findIndex(p => p._id === req.params.id);

    if (productIndex === -1) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = data.products[productIndex];

    if (!product.stockKeys || product.stockKeys.length === 0) {
      return res.status(400).json({ message: 'Out of stock' });
    }

    // Get the first key and remove it from stock
    const soldKey = product.stockKeys.shift();
    
    // Create an order record
    const { userId, paymentMethod, paymentDetails } = req.body;
    const order = {
      _id: 'ORD-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      userId: userId || 'guest',
      productId: product._id,
      productName: product.name,
      price: product.price, // or final price if we send it
      soldKey: soldKey,
      paymentMethod: paymentMethod || 'bkash',
      paymentDetails: paymentDetails || {},
      createdAt: new Date().toISOString()
    };
    
    if (!data.orders) data.orders = [];
    data.orders.push(order);

    // Save updated data
    await writeData(data);

    res.json({ key: soldKey, order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
