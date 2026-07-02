const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
  _id: { type: String },
  code: { type: String, required: true, unique: true },
  discountPercent: { type: Number },
  discountType: { type: String, default: 'percent' },
  applicableType: { type: String, default: 'all' },
  applicableTo: { type: String },
  usageLimit: { type: Number },
  usageCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}, { strict: false });

module.exports = mongoose.model('Coupon', CouponSchema);
