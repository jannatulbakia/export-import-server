const express = require('express');
const router = express.Router();
const Import = require('../models/Import');
const Product = require('../models/Product');

router.post('/', async (req, res) => {
  const { productId, quantity } = req.body;

  if (!productId || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Invalid data: productId and quantity are required' });
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
    console.error('Import error:', { message: err.message, stack: err.stack });
    res.status(500).json({ error: `Server error: ${err.message}` });
  }
});

router.get('/my', async (req, res) => {
  try {
    console.log('Fetching all imports');

    // Fetch imports and filter out those with invalid productId
    const imports = await Import.find({
      productId: { $ne: null, $exists: true }
    }).sort({ importedAt: -1 });

    console.log(`Found ${imports.length} imports`);

    // Verify productId existence before populating
    const validImports = [];
    for (const imp of imports) {
      const product = await Product.findById(imp.productId);
      if (product) {
        validImports.push(imp);
      } else {
        console.warn(`Skipping import ${imp._id} with invalid productId: ${imp.productId}`);
      }
    }

    // Populate only valid imports
    const populatedImports = await Import.populate(validImports, {
      path: 'productId',
      select: 'name image price country rating availableQuantity'
    });

    console.log(`Processing ${populatedImports.length} valid imports`);

    const formatted = populatedImports.map(i => {
      try {
        return {
          _id: i._id.toString(),
          product: {
            _id: i.productId._id.toString(),
            name: i.productId.name || 'Unknown',
            image: i.productId.image || 'https://via.placeholder.com/150?text=Image+Not+Found',
            price: i.productId.price || 0,
            country: i.productId.country || 'N/A',
            rating: i.productId.rating || 0,
            availableQuantity: i.productId.availableQuantity || 0
          },
          importedQuantity: i.quantity || 0,
          importedAt: i.importedAt
        };
      } catch (err) {
        console.error(`Error formatting import ${i._id}:`, err.message);
        return null;
      }
    }).filter(item => item !== null);

    console.log(`Returning ${formatted.length} formatted imports`);
    res.json(formatted);
  } catch (err) {
    console.error('Get imports error:', { message: err.message, stack: err.stack });
    res.status(500).json({ error: `Server error: ${err.message}` });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const imp = await Import.findById(req.params.id);
    if (!imp) {
      return res.status(404).json({ error: 'Import not found' });
    }
    const product = await Product.findById(imp.productId);
    if (!product) {
      console.warn(`Product not found for import ${imp._id}, deleting import only`);
    } else {
      await Product.findByIdAndUpdate(imp.productId, {
        $inc: { availableQuantity: imp.quantity }
      });
    }

    await Import.findByIdAndDelete(req.params.id);
    res.json({ message: 'Import removed and stock restored' });
  } catch (err) {
    console.error('Delete import error:', { message: err.message, stack: err.stack });
    res.status(500).json({ error: `Server error: ${err.message}` });
  }
});

module.exports = router;