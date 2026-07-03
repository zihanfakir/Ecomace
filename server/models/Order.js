const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  category: { type: String },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  keys: { type: [String], default: [] }
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  _id: { type: String },
  userId: { type: String, required: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String },
  customerDetails: { type: mongoose.Schema.Types.Mixed },
  items: [OrderItemSchema],
  subtotal: { type: Number },
  totalPrice: { type: Number, required: true },
  couponApplied: { type: mongoose.Schema.Types.Mixed },
  paymentMethod: { type: String, required: true },
  paymentDetails: { type: mongoose.Schema.Types.Mixed },
  transactionId: { type: String, required: true },
  paymentPhone: { type: String },
  status: { type: String, default: 'pending' }, // 'pending', 'processing', 'completed', 'cancelled'
  statusChangeCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);
