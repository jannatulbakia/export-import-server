const mongoose = require('mongoose');

const exportSchema = new mongoose.Schema({
  product: {
    name: String,
    image: String,
    price: Number,
    country: String,
    rating: Number,
    quantity: Number,
  }
}, { timestamps: true });

module.exports = mongoose.model('Export', exportSchema);