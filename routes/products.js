const express = require('express');
const { check, validationResult } = require('express-validator');
const Product = require('../models/Product');

const router = express.Router();
router.get('/latest', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).limit(6);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});
router.post(
  '/',
  [
    check('name', 'Product name is required').not().isEmpty(),
    check('image', 'Image URL is required').isURL(),
    check('price', 'Price must be a positive number').isFloat({ min: 0 }),
    check('originCountry', 'Origin country is required').not().isEmpty(),
    check('rating', 'Rating must be between 0 and 5').isFloat({ min: 0, max: 5 }),
    check('availableQuantity', 'Available quantity must be a positive number').isInt({ min: 0 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, image, price, originCountry, rating, availableQuantity } = req.body;

    try {
      const product = new Product({
        name,
        image,
        price,
        originCountry,
        rating,
        availableQuantity,
      });
      await product.save();
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;