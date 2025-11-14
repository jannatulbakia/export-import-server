const express = require('express');
const router = express.Router();
const Import = require('../models/Import');
const Product = require('../models/Product');

router.post('/', async (req, res) => {
  const { productId, quantity, userId } = req.body;

  if (!productId || !quantity || quantity <= 0 || !userId) {
    return res.status(400).json({ error: 'Invalid data: productId, quantity, and userId are required' });
  }

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.availableQuantity < quantity) {
      return res.status(400).json({ error: 'Not enough stock' });
    }

    await Product.findByIdAndUpdate(productId, {
      $inc: { availableQuantity: -quantity }
    });

    const newImport = new Import({ productId, quantity, userId });
    await newImport.save();

    res.status(201).json({ message: 'Imported successfully', data: newImport });
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

router.get('/my', async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    const imports = await Import.find({ userId })
      .populate({
        path: 'productId',
        select: 'name image price country rating availableQuantity'
      })
      .sort({ importedAt: -1 });

    const formatted = imports
      .filter(i => i.productId) // Skip imports with null productId
      .map(i => ({
        _id: i._id,
        product: {
          _id: i.productId._id,
          name: i.productId.name || 'Unknown',
          image: i.productId.image || 'https://via.placeholder.com/150?text=Image+Not+Found',
          price: i.productId.price || 0,
          country: i.productId.country || 'N/A',
          rating: i.productId.rating || 0,
          availableQuantity: i.productId.availableQuantity || 0
        },
        importedQuantity: i.quantity,
        importedAt: i.importedAt
      }));

    console.log(`Fetched ${formatted.length} imports for user ${userId}`);
    res.json(formatted);
  } catch (err) {
    console.error('Get imports error:', { message: err.message, stack: err.stack, userId });
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const imp = await Import.findById(req.params.id);
    if (!imp) {
      return res.status(404).json({ error: 'Import not found' });
    }
    await Product.findByIdAndUpdate(imp.productId, {
      $inc: { availableQuantity: imp.quantity }
    });

    await Import.findByIdAndDelete(req.params.id);
    res.json({ message: 'Import removed and stock restored' });
  } catch (err) {
    console.error('Delete import error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

module.exports = router;