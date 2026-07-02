const express = require('express');
const { readData, writeData } = require('../data/db');
const { protect, admin } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Edit product (Admin)
router.put('/:id', protect, admin, async (req, res) => {
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
router.delete('/:id', protect, admin, async (req, res) => {
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
    let isAdmin = false;
    
    // Optionally check if requester is admin
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      const token = req.headers.authorization.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = data.users.find(u => u._id === decoded.id);
        if (user && (user.role === 'admin' || user.role === 'owner')) {
          isAdmin = true;
        }
      } catch (e) {
        // Ignore token errors for public route
      }
    }

    const safeProducts = data.products.map(p => {
      if (isAdmin) return p;
      return {
        ...p,
        stockKeys: p.stockKeys ? new Array(p.stockKeys.length).fill('HIDDEN_KEY') : []
      };
    });

    res.json(safeProducts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new product (License Keys/Accounts)
router.post('/', protect, admin, express.json(), async (req, res) => {
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

module.exports = router;
