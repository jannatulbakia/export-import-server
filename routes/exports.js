const express = require('express');
const router = express.Router();
const Export = require('../models/Export');
const Product = require('../models/Product');
router.post('/', async (req, res) => {
  const { name, image, price, country, rating, availableQuantity, userId } = req.body;

  if (!name || !image || !price || !country || !availableQuantity) {
    return res.status(400).json({ error: 'All required fields are missing' });
  }

  try {
    const newProduct = new Product({
      name,
      image,
      price,
      country,
      rating: rating || 4.5,
      availableQuantity,
      addedBy: userId || 'anonymous',
    });

    await newProduct.save();

    const newExport = new Export({
      product: newProduct.toObject(),
      userId: userId || 'anonymous',
    });

    await newExport.save();

    res.status(201).json({ message: 'Product added successfully', product: newProduct });
  } catch (err) {
    console.error('Add export error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});
router.get('/my', async (req, res) => {
  const { userId } = req.query;

  try {
    const exports = await Export.find().sort({ createdAt: -1 });
    res.json(exports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.put('/:id', async (req, res) => {
  const updates = req.body;

  try {
    const exp = await Export.findById(req.params.id);
    if (!exp) return res.status(404).json({ error: 'Export not found' });
    await Product.findOneAndUpdate(
      { name: exp.product.name },
      updates,
      { new: true, runValidators: true }
    );

    const updatedExport = await Export.findByIdAndUpdate(
      req.params.id,
      { product: { ...exp.product, ...updates } },
      { new: true }
    );

    res.json(updatedExport);
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const exp = await Export.findById(req.params.id);
    if (!exp) return res.status(404).json({ error: 'Not found' });
    await Product.findOneAndDelete({ name: exp.product.name });
    await Export.findByIdAndDelete(req.params.id);

    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;