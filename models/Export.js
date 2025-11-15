const mongoose = require('mongoose');

const exportSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  originCountry: { type: String, required: true },
  rating: { type: Number, required: true, min: 0, max: 5 },
  availableQuantity: { type: Number, required: true, min: 0 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Export', exportSchema);