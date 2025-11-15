const mongoose = require('mongoose');
const Product = require('./models/Product');
const products = require('./products.json');
require('dotenv').config();

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
    await Product.deleteMany({});
    console.log('Existing products removed');
    await Product.insertMany(products);
    console.log('Products seeded successfully');
    mongoose.connection.close();
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDB();