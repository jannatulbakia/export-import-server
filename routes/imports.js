const express = require('express');
const router = express.Router();
const Import = require('../models/Import');
const Product = require('../models/Product');

router.post('/', async (req, res) => {
  const { productId, quantity } = req.body;

  if (!productId || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Invalid data' });
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

    const newImport = new Import({ productId, quantity });
    await newImport.save();

    res.status(201).json({ message: 'Imported successfully', data: newImport });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
router.get('/my', async (req, res) => {
  try {
    const imports = await Import.find()
      .populate('productId', 'name image price country rating availableQuantity')
      .sort({ importedAt: -1 });

    const formatted = imports.map(i => ({
      _id: i._id,
      product: {
        _id: i.productId._id,
        name: i.productId.name,
        image: i.productId.image,
        price: i.productId.price,
        country: i.productId.country,
        rating: i.productId.rating,
        availableQuantity: i.productId.availableQuantity
      },
      importedQuantity: i.quantity,
      importedAt: i.importedAt
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
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
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;