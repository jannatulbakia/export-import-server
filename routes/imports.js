const express = require('express');
const router = express.Router();
const Import = require('../models/Import');
const Product = require('../models/Product');
const mongoose = require('mongoose');
const productsData = require('../product.json'); // Ensure product.json is in the project root

// Existing POST /api/imports
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

// Existing GET /api/imports/my
router.get('/my', async (req, res) => {
  try {
    console.log('Fetching all imports');
    const imports = await Import.find()
      .populate({
        path: 'productId',
        select: 'name image price country rating availableQuantity'
      })
      .sort({ importedAt: -1 });

    console.log(`Found ${imports.length} imports`);

    const formatted = imports
      .filter(i => {
        if (!i.productId) {
          console.warn(`Skipping import ${i._id} with invalid productId: ${i.productId}`);
          return false;
        }
        return true;
      })
      .map(i => {
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
      })
      .filter(item => item !== null);

    console.log(`Returning ${formatted.length} formatted imports`);
    res.json(formatted);
  } catch (err) {
    console.error('Get imports error:', { message: err.message, stack: err.stack });
    res.status(500).json({ error: `Server error: ${err.message}` });
  }
});

// Existing DELETE /api/imports/:id
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
    console.error('Delete import error:', { message: err.message, stack: err.stack });
    res.status(500).json({ error: `Server error: ${err.message}` });
  }
});

// New Cleanup Endpoint: POST /api/imports/cleanup
router.post('/cleanup', async (req, res) => {
  try {
    // Step 1: Delete imports missing userId
    const deleteUserIdResult = await Import.deleteMany({
      $or: [{ userId: null }, { userId: { $exists: false } }]
    });
    console.log(`Deleted ${deleteUserIdResult.deletedCount} imports missing userId`);

    // Step 2: Delete imports with null or missing productId
    const deleteProductIdResult = await Import.deleteMany({
      $or: [{ productId: null }, { productId: { $exists: false } }]
    });
    console.log(`Deleted ${deleteProductIdResult.deletedCount} imports with invalid productId`);

    // Step 3: Delete imports with non-existent productId
    const imports = await Import.find({}, { productId: 1 });
    const invalidImports = [];
    for (const imp of imports) {
      const product = await Product.findById(imp.productId);
      if (!product) {
        invalidImports.push(imp._id);
      }
    }
    let deleteInvalidProductIdResult = { deletedCount: 0 };
    if (invalidImports.length > 0) {
      deleteInvalidProductIdResult = await Import.deleteMany({
        _id: { $in: invalidImports }
      });
      console.log(`Deleted ${deleteInvalidProductIdResult.deletedCount} imports with non-existent productId`);
    }

    // Step 4: Re-seed products collection
    await Product.deleteMany({});
    console.log('Cleared products collection');
    const products = productsData.map(item => ({
      _id: new mongoose.Types.ObjectId(),
      name: item.productName,
      image: item.image,
      price: item.price,
      country: item.originCountry,
      rating: item.rating,
      availableQuantity: item.availableQuantity,
      createdAt: item.createdAt
    }));
    await Product.insertMany(products);
    console.log(`Seeded ${products.length} products`);

    // Step 5: Create a test import
    const sampleProduct = await Product.findOne();
    if (sampleProduct) {
      const newImport = new Import({
        productId: sampleProduct._id,
        quantity: 5,
        importedAt: new Date()
      });
      await newImport.save();
      console.log('Created test import:', newImport);
    } else {
      console.warn('No products available to create test import');
    }

    // Return cleanup results
    res.json({
      message: 'Cleanup completed',
      deletedUserIdCount: deleteUserIdResult.deletedCount,
      deletedInvalidProductIdCount: deleteProductIdResult.deletedCount + deleteInvalidProductIdResult.deletedCount,
      seededProductsCount: products.length,
      testImportCreated: !!sampleProduct
    });
  } catch (err) {
    console.error('Cleanup error:', { message: err.message, stack: err.stack });
    res.status(500).json({ error: `Cleanup failed: ${err.message}` });
  }
});

module.exports = router;