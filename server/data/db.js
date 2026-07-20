const mongoose = require('mongoose');

let isConnected = false;
let connectionPromise = null;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is not defined');
  
  try {
    if (!connectionPromise) {
      // Vercel serverless optimizations with Promise caching
      connectionPromise = mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
      });
    }
    
    await connectionPromise;
    isConnected = true;
    console.log('MongoDB Connected successfully (Serverless optimized)');
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    connectionPromise = null; // Reset on failure so it can retry
  }
};

module.exports = { connectDB };
