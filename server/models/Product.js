const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  _id: { type: String },
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, default: 'Uncategorized' },
  bigDescription: { type: String },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  discountType: { type: String, default: 'percent' }, // 'percent' or 'flat'
  photoUrl: { type: String },
  icon: { type: String },
  stockKeys: { type: [String], default: [] },
  sortOrder: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
}, { optimisticConcurrency: true });

// Performance Indexes
ProductSchema.index({ sortOrder: 1, createdAt: -1 });

module.exports = mongoose.model('Product', ProductSchema);
