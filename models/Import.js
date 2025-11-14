const mongoose = require('mongoose');

const importSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  userId: {
    type: String,
    required: true
  },
  importedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Import', importSchema);