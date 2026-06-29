import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nordinestore';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    const total = await Product.countDocuments({});
    const brokenAcc = await Product.countDocuments({ images: '/uploads/accessory.png' });
    const nullImages = await Product.countDocuments({ $or: [{ images: { $size: 0 } }, { images: null }] });
    const uniqueImages = await Product.distinct('images');
    
    console.log('Total products:', total);
    console.log('Products with broken accessory.png:', brokenAcc);
    console.log('Products with empty/null images:', nullImages);
    console.log('Unique image paths in DB:', uniqueImages);
    
    await mongoose.connection.close();
  })
  .catch(err => {
    console.error(err);
  });
