import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';

dotenv.config();

const check = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nordinestore');
  const count = await Product.countDocuments();
  console.log(`Total products: ${count}`);
  const first5 = await Product.find({}).limit(5);
  for (const p of first5) {
    console.log(`SKU: ${p.sku}, Name: ${p.name}`);
    console.log(`- priceDetail: ${p.priceDetail}, price: ${p.price}`);
    console.log(`- priceDemiGros: ${p.priceDemiGros}, demiGrosPrice: ${p.demiGrosPrice}`);
    console.log(`- priceSuperGros: ${p.priceSuperGros}, superGrosPrice: ${p.superGrosPrice}`);
  }
  mongoose.connection.close();
};

check();
