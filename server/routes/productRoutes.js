const express = require('express');
const { readData, writeData, withTransaction } = require('../data/db');
const { protect, admin } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Edit product (Admin)
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const response = await withTransaction(async (data) => {
      const productIndex = data.products.findIndex(p => p._id === req.params.id);
      
      if (productIndex === -1) {
        return { modified: false, response: { status: 404, body: { message: 'Product not found' } } };
      }
      
      // Parse keys from multiline text if it's a string, or keep it if it's already an array/undefined
      let keysArray = data.products[productIndex].stockKeys;
      if (typeof req.body.keys === 'string') {
        keysArray = req.body.keys ? req.body.keys.split('\n').map(k => k.trim()).filter(k => k) : [];
      } else if (Array.isArray(req.body.keys)) {
        keysArray = req.body.keys;
      }

      // Update fields
      const newPrice = req.body.price !== undefined ? req.body.price : data.products[productIndex].price;
      const newDiscount = req.body.discount !== undefined ? req.body.discount : data.products[productIndex].discount;
      const newDiscountType = req.body.discountType !== undefined ? req.body.discountType : data.products[productIndex].discountType;
      
      if (newPrice < 0) {
        return { modified: false, response: { status: 400, body: { message: 'Price cannot be negative' } } };
      }
      if (newDiscount < 0) {
        return { modified: false, response: { status: 400, body: { message: 'Discount cannot be negative' } } };
      }
      if (newDiscountType === 'percent' && Number(newDiscount) > 100) {
        return { modified: false, response: { status: 400, body: { message: 'Percentage discount cannot exceed 100%' } } };
      }

      const updatedProduct = {
        ...data.products[productIndex],
        name: req.body.name !== undefined ? req.body.name : data.products[productIndex].name,
        description: req.body.description !== undefined ? req.body.description : data.products[productIndex].description,
        price: req.body.price !== undefined ? req.body.price : data.products[productIndex].price,
        icon: req.body.icon !== undefined ? req.body.icon : data.products[productIndex].icon,
        photoUrl: req.body.photoUrl !== undefined ? req.body.photoUrl : data.products[productIndex].photoUrl,
        discount: req.body.discount !== undefined ? req.body.discount : data.products[productIndex].discount,
        discountType: req.body.discountType !== undefined ? req.body.discountType : data.products[productIndex].discountType,
        category: req.body.category !== undefined ? req.body.category : data.products[productIndex].category,
        bigDescription: req.body.bigDescription !== undefined ? req.body.bigDescription : data.products[productIndex].bigDescription,
        stockKeys: keysArray
      };
      
      data.products[productIndex] = updatedProduct;
      return { modified: true, data, response: { status: 200, body: updatedProduct } };
    });
    
    res.status(response.status).json(response.body);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete product (Admin)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const response = await withTransaction(async (data) => {
      const productIndex = data.products.findIndex(p => p._id === req.params.id);
      
      if (productIndex === -1) {
        return { modified: false, response: { status: 404, body: { message: 'Product not found' } } };
      }
      
      data.products.splice(productIndex, 1);
      return { modified: true, data, response: { status: 200, body: { message: 'Product deleted successfully' } } };
    });
    
    res.status(response.status).json(response.body);
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

// Get a single product by ID
router.get('/:id', async (req, res) => {
  try {
    const data = await readData();
    let isAdmin = false;

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

    const product = data.products.find(p => p._id === req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const safeProduct = isAdmin ? product : {
      ...product,
      stockKeys: product.stockKeys ? new Array(product.stockKeys.length).fill('HIDDEN_KEY') : []
    };

    res.json(safeProduct);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new product (License Keys/Accounts)
router.post('/', protect, admin, express.json(), async (req, res) => {
  try {
    const response = await withTransaction(async (data) => {
      // Parse keys from multiline text
      const keysArray = req.body.keys ? req.body.keys.split('\n').map(k => k.trim()).filter(k => k) : [];

      if (req.body.price !== undefined && req.body.price < 0) {
        return { modified: false, response: { status: 400, body: { message: 'Price cannot be negative' } } };
      }
      if (req.body.discount !== undefined && req.body.discount < 0) {
        return { modified: false, response: { status: 400, body: { message: 'Discount cannot be negative' } } };
      }
      if ((req.body.discountType || 'percent') === 'percent' && Number(req.body.discount || 0) > 100) {
        return { modified: false, response: { status: 400, body: { message: 'Percentage discount cannot exceed 100%' } } };
      }

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
      return { modified: true, data, response: { status: 201, body: newProduct } };
    });
    
    res.status(response.status).json(response.body);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
