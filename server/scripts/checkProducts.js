import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nordinestore';

console.log('Connecting to database...');
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('MongoDB Connected successfully!');
    const db = mongoose.connection.db;
    const products = await db.collection('products').find({}).toArray();
    console.log(`Found ${products.length} products.`);

    const families = {};
    products.forEach(p => {
      const f = p.famille || 'SANS FAMILLE';
      if (!families[f]) families[f] = [];
      families[f].push(p.name);
    });

    console.log('\n--- FAMILIES & PRODUCTS ---');
    Object.keys(families).forEach(f => {
      console.log(`\nFamily: ${f} (${families[f].length} products)`);
      families[f].slice(0, 5).forEach(name => {
        console.log(`  - ${name}`);
      });
      if (families[f].length > 5) {
        console.log(`  - ... and ${families[f].length - 5} more`);
      }
    });

    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });
