const express = require('express');
const { protect, admin } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const Product = require('../models/Product');
const User = require('../models/User');

const router = express.Router();

// Reorder products (Admin only)
router.put('/reorder', protect, admin, async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'Invalid items format' });
    }
    
    // items should be [{ _id: '...', sortOrder: 0 }, { _id: '...', sortOrder: 1 }]
    const operations = items.map(item => ({
      updateOne: {
        filter: { _id: item._id },
        update: { sortOrder: item.sortOrder }
      }
    }));
    
    if (operations.length > 0) {
      await Product.bulkWrite(operations);
    }
    
    res.json({ message: 'Order updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Edit product (Admin)
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Parse keys from multiline text if it's a string, or keep it if it's already an array
    let keysArray = product.stockKeys;
    if (typeof req.body.keys === 'string') {
      keysArray = req.body.keys ? req.body.keys.split('\n').map(k => k.trim()).filter(k => k) : [];
    } else if (Array.isArray(req.body.keys)) {
      keysArray = req.body.keys;
    }

    // Validate
    const newPrice = req.body.price !== undefined ? req.body.price : product.price;
    const newDiscount = req.body.discount !== undefined ? req.body.discount : product.discount;
    const newDiscountType = req.body.discountType !== undefined ? req.body.discountType : product.discountType;
    
    if (newPrice < 0) return res.status(400).json({ message: 'Price cannot be negative' });
    if (newDiscount < 0) return res.status(400).json({ message: 'Discount cannot be negative' });
    if (newDiscountType === 'percent' && Number(newDiscount) > 100) {
      return res.status(400).json({ message: 'Percentage discount cannot exceed 100%' });
    }

    product.name = req.body.name ? req.body.name : product.name;
    product.description = req.body.description ? req.body.description : product.description;
    product.price = newPrice;
    product.icon = req.body.icon !== undefined ? req.body.icon : product.icon;
    product.photoUrl = req.body.photoUrl !== undefined ? req.body.photoUrl : product.photoUrl;
    product.discount = newDiscount;
    product.discountType = newDiscountType;
    product.category = req.body.category !== undefined ? req.body.category : product.category;
    product.bigDescription = req.body.bigDescription !== undefined ? req.body.bigDescription : product.bigDescription;
    product.stockKeys = keysArray;

    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete product (Admin)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all products
router.get('/', async (req, res) => {
  try {
    let isAdmin = false;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      const token = req.headers.authorization.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (user && (user.role === 'admin' || user.role === 'owner')) {
          isAdmin = true;
        }
      } catch (e) {}
    }

    const products = await Product.find({}).sort({ sortOrder: 1, createdAt: -1 });

    const safeProducts = products.map(p => {
      const productObj = p.toObject ? p.toObject() : p;
      if (isAdmin) return productObj;
      return {
        ...productObj,
        stockKeys: productObj.stockKeys ? new Array(productObj.stockKeys.length).fill('HIDDEN_KEY') : []
      };
    });

    res.json(safeProducts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single product by ID
router.get('/:id', async (req, res) => {
  try {
    let isAdmin = false;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      const token = req.headers.authorization.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (user && (user.role === 'admin' || user.role === 'owner')) {
          isAdmin = true;
        }
      } catch (e) {}
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const productObj = product.toObject ? product.toObject() : product;
    const safeProduct = isAdmin ? productObj : {
      ...productObj,
      stockKeys: productObj.stockKeys ? new Array(productObj.stockKeys.length).fill('HIDDEN_KEY') : []
    };

    res.json(safeProduct);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new product (License Keys/Accounts)
router.post('/', protect, admin, async (req, res) => {
  try {
    const keysArray = req.body.keys ? req.body.keys.split('\n').map(k => k.trim()).filter(k => k) : [];

    if (!req.body.name || String(req.body.name).trim() === '') {
      return res.status(400).json({ message: 'Product name is required' });
    }
    if (req.body.price === undefined || req.body.price === null || req.body.price === '') {
      return res.status(400).json({ message: 'Product price is required' });
    }

    if (req.body.price !== undefined && req.body.price < 0) {
      return res.status(400).json({ message: 'Price cannot be negative' });
    }
    if (req.body.discount !== undefined && req.body.discount < 0) {
      return res.status(400).json({ message: 'Discount cannot be negative' });
    }
    if ((req.body.discountType || 'percent') === 'percent' && Number(req.body.discount || 0) > 100) {
      return res.status(400).json({ message: 'Percentage discount cannot exceed 100%' });
    }

    const newProduct = new Product({
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
      stockKeys: keysArray
    });

    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
