const mongoose = require('mongoose');

const importSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Import', importSchema);