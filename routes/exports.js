const express = require('express');
const router = express.Router();
const Export = require('../models/Export');
const Product = require('../models/Product');

router.post('/', async (req, res) => {
  const { name, image, price, country, rating, availableQuantity, userId } = req.body;

  if (!name || !image || !price || !country || !availableQuantity || !userId) {
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
      addedBy: userId,
    });

    await newProduct.save();

    const newExport = new Export({
      product: newProduct._id,
      userId,
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

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    const exports = await Export.find({ userId }).populate('product').sort({ createdAt: -1 });
    res.json(exports);
  } catch (err) {
    console.error('Get exports error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { name, image, price, country, rating, availableQuantity, userId } = req.body;
  const exportId = req.params.id;

  if (!name || !image || !price || !country || !availableQuantity || !userId) {
    return res.status(400).json({ error: 'All required fields are missing' });
  }

  try {
    const exp = await Export.findOne({ _id: exportId, userId });
    if (!exp) {
      return res.status(404).json({ error: 'Export not found or unauthorized' });
    }
    const updatedProduct = await Product.findByIdAndUpdate(
      exp.product,
      { name, image, price, country, rating: rating || 4.5, availableQuantity, addedBy: userId },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ error: 'Associated product not found' });
    }

    exp.product = updatedProduct._id;
    await exp.save();

    res.json({ message: 'Product updated successfully', export: { ...exp.toObject(), product: updatedProduct } });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  const exportId = req.params.id;

  try {
    const exp = await Export.findById(exportId);
    if (!exp) {
      return res.status(404).json({ error: 'Export not found' });
    }

    await Product.findByIdAndDelete(exp.product);
    await Export.findByIdAndDelete(exportId);

    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

module.exports = router;