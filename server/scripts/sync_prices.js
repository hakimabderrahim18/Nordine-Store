import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';

dotenv.config();

const sync = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nordinestore');
    console.log('Connected to MongoDB for price synchronization...');

    const products = await Product.find({});
    console.log(`Processing ${products.length} products...`);

    let updatedCount = 0;
    for (const p of products) {
      let changed = false;

      // Sync retail price
      if (p.priceDetail && p.priceDetail !== 0 && (!p.price || p.price === 0 || p.price !== p.priceDetail)) {
        p.price = p.priceDetail;
        changed = true;
      } else if (p.price && p.price !== 0 && (!p.priceDetail || p.priceDetail === 0)) {
        p.priceDetail = p.price;
        changed = true;
      }

      // Sync demi-gros price
      if (p.priceDemiGros && p.priceDemiGros !== 0 && (!p.demiGrosPrice || p.demiGrosPrice !== p.priceDemiGros)) {
        p.demiGrosPrice = p.priceDemiGros;
        changed = true;
      } else if (p.demiGrosPrice && p.demiGrosPrice !== 0 && (!p.priceDemiGros || p.priceDemiGros === 0)) {
        p.priceDemiGros = p.demiGrosPrice;
        changed = true;
      }

      // Sync super-gros price
      if (p.priceSuperGros && p.priceSuperGros !== 0 && (!p.superGrosPrice || p.superGrosPrice !== p.priceSuperGros)) {
        p.superGrosPrice = p.priceSuperGros;
        changed = true;
      } else if (p.superGrosPrice && p.superGrosPrice !== 0 && (!p.priceSuperGros || p.priceSuperGros === 0)) {
        p.priceSuperGros = p.superGrosPrice;
        changed = true;
      }

      // Sync promo/discount price
      if (p.pricePromo && p.pricePromo !== 0 && (!p.discountPrice || p.discountPrice !== p.pricePromo)) {
        p.discountPrice = p.pricePromo;
        changed = true;
      } else if (p.discountPrice && p.discountPrice !== 0 && (!p.pricePromo || p.pricePromo === 0)) {
        p.pricePromo = p.discountPrice;
        changed = true;
      }

      if (changed) {
        await p.save();
        updatedCount++;
      }
    }

    console.log(`Synchronization complete! ${updatedCount} products updated.`);
    mongoose.connection.close();
  } catch (error) {
    console.error('Error during synchronization:', error);
    process.exit(1);
  }
};

sync();
