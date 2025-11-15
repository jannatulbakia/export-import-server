const express = require('express');
const { check, validationResult } = require('express-validator');
const Export = require('../models/Export');

const router = express.Router();
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
    const userId = req.header('X-User-ID');
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: No user ID provided' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, image, price, originCountry, rating, availableQuantity } = req.body;

    try {
      console.log('Creating export with data:', { userId, name, image, price, originCountry, rating, availableQuantity });
      const exportItem = new Export({
        userId,
        name,
        image,
        price,
        originCountry,
        rating,
        availableQuantity,
      });
      await exportItem.save();
      console.log('Export saved:', exportItem);
      res.status(201).json(exportItem);
    } catch (error) {
      console.error('Error saving export:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.get('/', async (req, res) => {
  const userId = req.header('X-User-ID');
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: No user ID provided' });
  }

  try {
    const exports = await Export.find({ userId });
    console.log('Fetched exports for user:', userId, exports);
    res.json(exports);
  } catch (error) {
    console.error('Error fetching exports:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
router.put(
  '/:id',
  [
    check('name', 'Product name is required').optional().not().isEmpty(),
    check('image', 'Image URL is required').optional().isURL(),
    check('price', 'Price must be a positive number').optional().isFloat({ min: 0 }),
    check('originCountry', 'Origin country is required').optional().not().isEmpty(),
    check('rating', 'Rating must be between 0 and 5').optional().isFloat({ min: 0, max: 5 }),
    check('availableQuantity', 'Available quantity must be a positive number').optional().isInt({ min: 0 }),
  ],
  async (req, res) => {
    const userId = req.header('X-User-ID');
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: No user ID provided' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, image, price, originCountry, rating, availableQuantity } = req.body;

    try {
      const exportItem = await Export.findById(req.params.id);
      if (!exportItem) {
        return res.status(404).json({ message: 'Export not found' });
      }

      if (exportItem.userId !== userId) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      exportItem.name = name || exportItem.name;
      exportItem.image = image || exportItem.image;
      exportItem.price = price || exportItem.price;
      exportItem.originCountry = originCountry || exportItem.originCountry;
      exportItem.rating = rating || exportItem.rating;
      exportItem.availableQuantity = availableQuantity || exportItem.availableQuantity;

      await exportItem.save();
      console.log('Export updated:', exportItem);
      res.json(exportItem);
    } catch (error) {
      console.error('Error updating export:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);
router.delete('/:id', async (req, res) => {
  const userId = req.header('X-User-ID');
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: No user ID provided' });
  }

  try {
    const exportItem = await Export.findById(req.params.id);
    if (!exportItem) {
      return res.status(404).json({ message: 'Export not found' });
    }

    if (exportItem.userId !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await exportItem.deleteOne();
    console.log('Export deleted:', req.params.id);
    res.json({ message: 'Export removed' });
  } catch (error) {
    console.error('Error deleting export:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;