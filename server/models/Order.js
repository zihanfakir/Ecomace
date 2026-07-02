const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  keys: { type: [String], default: [] }
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  _id: { type: String },
  userId: { type: String, required: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String },
  items: [OrderItemSchema],
  totalPrice: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  transactionId: { type: String, required: true },
  paymentPhone: { type: String },
  status: { type: String, default: 'pending' }, // 'pending', 'processing', 'completed', 'cancelled'
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);
