import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nordinestore';

console.log('Connecting to database...');
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('MongoDB Connected successfully!');
    
    // Find all products that have no images, empty images array, or placeholder images
    const products = await Product.find({
      $or: [
        { images: { $exists: false } },
        { images: { $size: 0 } },
        { images: null },
        { images: '' }
      ]
    });

    console.log(`Found ${products.length} products needing image assignments.`);

    let updatedCount = 0;
    const bulkOps = [];

    for (const product of products) {
      const name = (product.name || '').toLowerCase();
      const famille = (product.famille || '').toUpperCase();
      let imagePath = '/uploads/spare_part.png'; // default fallback

      if (famille === 'BAT') {
        imagePath = '/uploads/battery.png';
      } else if (famille === 'GLASS' || famille === 'T GLASS') {
        imagePath = '/uploads/glass.png';
      } else if (famille === 'POCH') {
        imagePath = '/uploads/pouch.png';
      } else if (famille === 'ACC') {
        imagePath = '/uploads/spare_part.png';
      } else if (famille === 'MATERIEL') {
        imagePath = '/uploads/connecteur.png';
      } else {
        // Match based on product name keywords
        if (name.includes('ecran') || name.includes('oled') || name.includes('lcd') || name.includes('display') || name.includes('vitre tactile')) {
          imagePath = '/uploads/screen.png';
        } else if (name.includes('batterie') || name.includes('bat ')) {
          imagePath = '/uploads/battery.png';
        } else if (name.includes('connecteur') || name.includes('charge') || name.includes('con only') || name.includes('charging') || name.includes('nappe')) {
          imagePath = '/uploads/connecteur.png';
        } else if (name.includes('vitre') || name.includes('glass') || name.includes('verre')) {
          imagePath = '/uploads/glass.png';
        } else if (name.includes('pochette') || name.includes('coque') || name.includes('poch') || name.includes('pouch') || name.includes('etui')) {
          imagePath = '/uploads/pouch.png';
        } else if (name.includes('outil') || name.includes('tournevis') || name.includes('separatrice') || name.includes('machine') || name.includes('souder') || name.includes('station') || name.includes('falcon') || name.includes('mechanic') || name.includes('ds01')) {
          imagePath = '/uploads/repair_tool.png';
        }
      }

      bulkOps.push({
        updateOne: {
          filter: { _id: product._id },
          update: { $set: { images: [imagePath] } }
        }
      });

      updatedCount++;

      // Execute bulk write in chunks of 500
      if (bulkOps.length === 500) {
        await Product.bulkWrite(bulkOps);
        console.log(`Executed bulk update for ${updatedCount} products...`);
        bulkOps.length = 0; // clear array
      }
    }

    if (bulkOps.length > 0) {
      await Product.bulkWrite(bulkOps);
      console.log(`Executed final bulk update for ${updatedCount} products.`);
    }

    console.log(`Successfully updated ${updatedCount} products with category-based images.`);
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(err => {
    console.error('Database connection error:', err);
    process.exit(1);
  });
