require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('DB Error:', err);
  });

app.use('/api/products', require('./routes/products'));
app.use('/api/imports', require('./routes/imports'));
app.use('/api/exports', require('./routes/exports'));

app.get('/', (req, res) => {
  res.json({ message: 'Import Export Hub API – Public Access' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});