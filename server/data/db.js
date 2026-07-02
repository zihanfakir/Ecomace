const mongoose = require('mongoose');

// We will store the entire data.json state in a single document for easy migration
const StoreSchema = new mongoose.Schema({
  docId: { type: String, required: true, default: 'main' },
  state: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { minimize: false, strict: false });

const Store = mongoose.model('Store', StoreSchema);

// Cache the connection
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is not defined');
  
  await mongoose.connect(uri);
  isConnected = true;
  console.log('MongoDB Connected successfully');
};

class Mutex {
  constructor() {
    this.queue = [];
    this.locked = false;
  }

  async acquire() {
    if (!this.locked) {
      this.locked = true;
      return;
    }
    return new Promise(resolve => this.queue.push(resolve));
  }

  release() {
    if (this.queue.length > 0) {
      const nextResolve = this.queue.shift();
      nextResolve();
    } else {
      this.locked = false;
    }
  }
}

const dbMutex = new Mutex();

const readData = async () => {
  await connectDB();
  let doc = await Store.findOne({ docId: 'main' });
  if (!doc) {
    // If it doesn't exist, create an empty one (or wait for migration)
    doc = new Store({ docId: 'main', state: { products: [], users: [], orders: [], coupons: [], messages: [], settings: {} } });
    await doc.save();
  }
  return doc.state;
};

const writeData = async (data) => {
  await connectDB();
  await Store.findOneAndUpdate({ docId: 'main' }, { state: data }, { upsert: true });
};

// Safe wrapper for atomic operations
const withTransaction = async (operation) => {
  await dbMutex.acquire();
  try {
    const data = await readData();
    const result = await operation(data);
    if (result.modified) {
      await writeData(result.data);
    }
    return result.response;
  } finally {
    dbMutex.release();
  }
};

module.exports = { connectDB, readData, writeData, withTransaction, Store, dbMutex };
