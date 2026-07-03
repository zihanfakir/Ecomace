const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  _id: { type: String },
  target: { type: String, required: true }, // 'admin' or userId
  type: { type: String },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  link: { type: String }, // e.g. '/admin/orders'
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', NotificationSchema);
