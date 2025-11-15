const express = require('express');
const { check, validationResult } = require('express-validator');
const Import = require('../models/Import');
const Product = require('../models/Product');

const router = express.Router();
const verifyUser = (req, res, next) => {
  const userId = req.header('X-User-ID');
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: No user ID provided' });
  }
  req.userId = userId;
  next();
};

router.post(
  '/',
  [
    verifyUser,
    check('productId', 'Product ID is required').isMongoId(),
    check('quantity', 'Quantity must be a positive integer').isInt({ min: 1 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { productId, quantity } = req.body;

    try {
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      if (quantity > product.availableQuantity) {
        return res.status(400).json({ message: 'Quantity exceeds available stock' });
      }

      const importItem = new Import({
        userId: req.userId,
        productId,
        quantity,
      });
      await importItem.save();
      await Product.findByIdAndUpdate(productId, { $inc: { availableQuantity: -quantity } });

      res.json(importItem);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);
router.get('/', verifyUser, async (req, res) => {
  try {
    const imports = await Import.find({ userId: req.userId }).populate('productId');
    res.json(imports);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', verifyUser, async (req, res) => {
  try {
    const importItem = await Import.findById(req.params.id);
    if (!importItem) {
      return res.status(404).json({ message: 'Import not found' });
    }

    if (importItem.userId !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await importItem.deleteOne();
    res.json({ message: 'Import removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;