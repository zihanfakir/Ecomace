const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined. Server cannot start.");
  process.exit(1);
}

// Connect to MongoDB
const { connectDB } = require('./data/db');
connectDB().then(async () => {
  // Auto-migration Logic (Run once on startup if needed)
  try {
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    const storeCollection = db.collection('stores');
    const mainDoc = await storeCollection.findOne({ docId: 'main' });
    
    if (mainDoc) {
      console.log("Found legacy monolithic database. Starting auto-migration...");
      const state = mainDoc.state;
      
      const User = require('./models/User');
      const Product = require('./models/Product');
      const Order = require('./models/Order');
      const Coupon = require('./models/Coupon');
      const Message = require('./models/Message');
      const Notification = require('./models/Notification');
      const Setting = require('./models/Setting');
      
      if (state.users && state.users.length > 0) { await User.deleteMany({}); await User.insertMany(state.users); }
      if (state.products && state.products.length > 0) { await Product.deleteMany({}); await Product.insertMany(state.products); }
      if (state.orders && state.orders.length > 0) { await Order.deleteMany({}); await Order.insertMany(state.orders); }
      if (state.coupons && state.coupons.length > 0) { await Coupon.deleteMany({}); await Coupon.insertMany(state.coupons); }
      if (state.messages && state.messages.length > 0) { await Message.deleteMany({}); await Message.insertMany(state.messages); }
      if (state.notifications && state.notifications.length > 0) { await Notification.deleteMany({}); await Notification.insertMany(state.notifications); }
      if (state.settings) { await Setting.deleteMany({}); await Setting.create({ settingType: 'global', state: state.settings }); }
      
      // Mark as migrated so it doesn't run again
      await storeCollection.updateOne({ docId: 'main' }, { $set: { docId: 'main_migrated' } });
      console.log("Auto-migration completed successfully!");
    }
  } catch (err) {
    console.error("Auto-migration failed:", err);
  }
}).catch(console.error);

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'https://ecomace.onrender.com', 'https://ecomace.vercel.app'] }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Basic Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Ecomace API' });
});

// Serve uploaded files statically
app.use('/downloads', express.static(__dirname + '/uploads'));

const dbLock = require('./middleware/dbLock');
app.use(dbLock);

// Routes
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const couponRoutes = require('./routes/couponRoutes');
const messageRoutes = require('./routes/messageRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);

// Global error handler — must be registered AFTER all routes
// Catches any errors passed via next(err) or thrown in async routes
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack || err.message);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
