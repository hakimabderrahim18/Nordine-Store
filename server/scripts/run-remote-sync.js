import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { syncProducts } from '../controllers/productController.js';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nordinestore';
const filePath = path.join(__dirname, '../uploads/Liste_des_produits_(25-11-2026_à13h30).xlsx');

async function run() {
  console.log('Connecting to VPS MongoDB:', MONGO_URI);
  await mongoose.connect(MONGO_URI);
  console.log('Connected.');

  if (!fs.existsSync(filePath)) {
    console.error('File not found at:', filePath);
    process.exit(1);
  }

  // Find an admin user to attach to sync
  const adminUser = await User.findOne({ role: 'admin' });

  const mockReq = {
    file: {
      path: filePath,
      originalname: 'Liste_des_produits_(25-11-2026_à13h30).xlsx'
    },
    user: adminUser || { _id: new mongoose.Types.ObjectId() }
  };

  let responseData = null;
  let statusCode = 200;

  const mockRes = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    }
  };

  console.log('Executing syncProducts on VPS...');
  const start = Date.now();
  await syncProducts(mockReq, mockRes);
  console.log(`Sync finished in ${((Date.now() - start) / 1000).toFixed(2)}s`);
  console.log('Status code:', statusCode);
  console.log('Result:', responseData);

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Remote sync execution failed:', err);
  process.exit(1);
});
