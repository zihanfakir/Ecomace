const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is not defined');
  
  try {
    // Vercel serverless optimizations
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });
    isConnected = true;
    console.log('MongoDB Connected successfully (Serverless optimized)');
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
  }
};

module.exports = { connectDB };
