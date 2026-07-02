const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
  // Since we only need a single document for settings, we'll store the object here.
  // Alternatively, we could have one document per key, but a single document is simpler.
  // We'll use a fixed _id or a specific type field to always update the same document.
  settingType: { type: String, required: true, default: 'global' },
  state: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { minimize: false, strict: false });

module.exports = mongoose.model('Setting', SettingSchema);
