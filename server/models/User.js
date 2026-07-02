const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  _id: { type: String },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'customer' }, // 'customer', 'admin', 'owner'
  photoUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
