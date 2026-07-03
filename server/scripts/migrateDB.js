require('dotenv').config();
const mongoose = require('mongoose');

// Import the old monolithic Store model
const StoreSchema = new mongoose.Schema({
  docId: { type: String, required: true, default: 'main' },
  state: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { minimize: false, strict: false });

const Store = mongoose.model('Store', StoreSchema);

// Import the new normalized models
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const Setting = require('../models/Setting');

const migrateDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    const mainDoc = await Store.findOne({ docId: 'main' });
    
    if (!mainDoc) {
      console.log('No monolithic "main" document found. Nothing to migrate.');
      process.exit(0);
    }

    const state = mainDoc.state;
    console.log('Main document found. Migrating data...');

    // 1. Users
    if (state.users && state.users.length > 0) {
      await User.deleteMany({});
      await User.insertMany(state.users);
      console.log(`Migrated ${state.users.length} users.`);
    }

    // 2. Products
    if (state.products && state.products.length > 0) {
      await Product.deleteMany({});
      await Product.insertMany(state.products);
      console.log(`Migrated ${state.products.length} products.`);
    }

    // 3. Orders
    if (state.orders && state.orders.length > 0) {
      await Order.deleteMany({});
      await Order.insertMany(state.orders);
      console.log(`Migrated ${state.orders.length} orders.`);
    }

    // 4. Coupons
    if (state.coupons && state.coupons.length > 0) {
      await Coupon.deleteMany({});
      await Coupon.insertMany(state.coupons);
      console.log(`Migrated ${state.coupons.length} coupons.`);
    }

    // 5. Messages
    if (state.messages && state.messages.length > 0) {
      await Message.deleteMany({});
      await Message.insertMany(state.messages);
      console.log(`Migrated ${state.messages.length} messages.`);
    }

      console.log(`Migrated ${state.notifications.length} notifications.`);
    }

    // 7. Settings
    if (state.settings) {
      await Setting.deleteMany({});
      await Setting.create({ settingType: 'global', state: state.settings });
      console.log('Migrated settings.');
    }

    console.log('Migration completed successfully.');
    console.log('You can now safely drop the "stores" collection if you want, but it has been kept as a backup.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateDB();
