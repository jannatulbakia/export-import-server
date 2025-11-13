const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

router.get('/', async (req, res) => {
  try {
    const products = await Product.find()
      .select('name image price country rating availableQuantity')
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});
router.get('/latest', async (req, res) => {
  try {
    const products = await Product.find()
      .select('name image price country rating availableQuantity')
      .sort({ createdAt: -1 })
      .limit(6);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .select('name image price country rating availableQuantity');
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;