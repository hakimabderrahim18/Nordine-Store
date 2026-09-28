import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nordinestore');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const run = async () => {
  await connectDB();
  
  // Define inline schemas
  const Category = mongoose.model('Category', new mongoose.Schema({
    name: String,
    slug: String
  }));
  
  const Product = mongoose.model('Product', new mongoose.Schema({
    name: String,
    sku: String,
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }
  }));
  
  const categories = await Category.find();
  console.log('--- ALL CATEGORIES ---');
  for (const c of categories) {
    const count = await Product.countDocuments({ category: c._id });
    console.log(`ID: ${c._id}, Name: ${c.name}, Slug: ${c.slug}, Product Count: ${count}`);
  }
  
  const productsCount = await Product.countDocuments();
  console.log(`\nTotal products: ${productsCount}`);
  
  const sampleProductsWithCategory = await Product.find({ category: { $ne: null } }).limit(5).populate('category');
  console.log('\n--- SAMPLE PRODUCTS WITH CATEGORY ---');
  sampleProductsWithCategory.forEach(p => {
    console.log(`Name: ${p.name}, SKU: ${p.sku}, Category: ${p.category ? p.category.name : 'None'} (ID: ${p.category ? p.category._id : 'N/A'})`);
  });

  const productsWithoutCategory = await Product.countDocuments({ category: null });
  console.log(`\nProducts without category ID: ${productsWithoutCategory}`);
  
  mongoose.connection.close();
};

run();
