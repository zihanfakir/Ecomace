const mongoose = require('mongoose');

// Cache the connection
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is not defined');
  
  try {
    await mongoose.connect(uri);
    isConnected = true;
    console.log('MongoDB Connected successfully (Normalized DB)');
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    process.exit(1);
  }
};

module.exports = { connectDB };
