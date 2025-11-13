const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Product = require('./models/Product');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Seeding...');
};

const seed = async () => {
  await connectDB();
  const filePath = path.join(__dirname, 'product.json');
  const raw = fs.readFileSync(filePath);
  const products = JSON.parse(raw);

const formatted = products.map(p => ({
  name: p.productName,
  image: p.image,
  price: p.price,
  country: p.originCountry,
  rating: p.rating || 0,
  availableQuantity: p.availableQuantity,
  createdAt: new Date(p.createdAt || Date.now()),
  updatedAt: new Date(p.createdAt || Date.now()),
}));

  await Product.deleteMany({ name: { $in: formatted.map(p => p.name) } });
  const result = await Product.insertMany(formatted);
  console.log(`${result.length} products seeded!`);
  process.exit(0);
};

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});