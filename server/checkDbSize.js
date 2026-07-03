const mongoose = require('mongoose');
require('dotenv').config();

const StoreSchema = new mongoose.Schema({
  docId: { type: String, required: true, default: 'main' },
  state: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { minimize: false, strict: false });
const Store = mongoose.model('Store', StoreSchema);

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const doc = await Store.findOne({ docId: 'main' }).lean();
  if (doc) {
    const size = Buffer.byteLength(JSON.stringify(doc));
    console.log(`Document size: ${(size / 1024 / 1024).toFixed(2)} MB`);
    
    // Check how many products
    const products = doc.state.products || [];
    console.log(`Total products: ${products.length}`);
    
    // Find products with large base64 images
    const largeProducts = products.filter(p => p.photoUrl && p.photoUrl.startsWith('data:image'));
    console.log(`Products with base64 images: ${largeProducts.length}`);
  }
  process.exit(0);
}
check().catch(console.error);
