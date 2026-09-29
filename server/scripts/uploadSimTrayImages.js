import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_DIR = 'E:\\NEW';
const SERVER_UPLOADS_DIR = path.join(__dirname, '../uploads');
const DB_EXPORT_PRODUCTS = path.join(__dirname, '../db-export/products.json');

if (!fs.existsSync(SERVER_UPLOADS_DIR)) {
  fs.mkdirSync(SERVER_UPLOADS_DIR, { recursive: true });
}

// Map each image file in E:\NEW to the matching product names in the database
const imageProductMappings = [
  {
    file: 'M30.png',
    destName: 'sim_tray_sam_m30.png',
    matchNames: ['SIM TRAY SAM M30']
  },
  {
    file: 'OPPO RENO 5.png',
    destName: 'sim_tray_oppo_reno_5.png',
    matchNames: ['SIM TRAY OPPO RENO 5']
  },
  {
    file: 'REDMI 8  8A.png',
    destName: 'sim_tray_redmi_8_8a.png',
    matchNames: ['SIM TRAY REDMI 8/8A']
  },
  {
    file: 'REDMI 9T.png',
    destName: 'sim_tray_redmi_9t_poco_m3.png',
    matchNames: ['SIM TRAY REDMI 9T/POCO M3', 'SIM TRAY REDMI 9T/POCO M3 ORG']
  },
  {
    file: 'a10s m16.png',
    destName: 'sim_tray_sam_a10s_m16.png',
    matchNames: ['SIM TRAY SAM A10S']
  },
  {
    file: 'note 11 4g.png',
    destName: 'sim_tray_redmi_note_11_4g.png',
    matchNames: ['SIM TRAY REDMI NOTE 11 4G', 'SIM TRAY REDMI NOTE 11.4G ORG']
  },
  {
    file: 'note 9 pro.png',
    destName: 'sim_tray_redmi_note_9s_note_9_pro.png',
    matchNames: ['SIM TRAY REDMI NOTE 9S/NOTE 9 PRO', 'SIM TRAY REDMI NOTE 9S/NOTE 9 PRO ORG']
  },
  {
    file: 'oppo a11k a5s.png',
    destName: 'sim_tray_oppo_a11k_a5s.png',
    matchNames: ['SIM TRAY OPPO A11K/A5S', 'SIM TRAY OPPO A12']
  },
  {
    file: 'oppo a15.png',
    destName: 'sim_tray_oppo_a15.png',
    matchNames: ['SIM TRAY OPPO A15']
  },
  {
    file: 'oppo a16.png',
    destName: 'sim_tray_oppo_a16.png',
    matchNames: ['SIM TRAY OPPO A16']
  },
  {
    file: 'oppo a58 (5g).png',
    destName: 'sim_tray_oppo_a58_5g.png',
    matchNames: ['SIM TRAY OPPO A58 5G']
  },
  {
    file: 'oppo a60.png',
    destName: 'sim_tray_oppo_a60.png',
    matchNames: ['SIM TRAY OPPO A60']
  },
  {
    file: 'oppo reno 6.png',
    destName: 'sim_tray_oppo_reno_6.png',
    matchNames: ['SIM TRAY OPPO RENO 6']
  },
  {
    file: 'oppo reno 7 4g.png',
    destName: 'sim_tray_oppo_reno_7_4g.png',
    matchNames: ['SIM TRAY OPPO RENO 7 4G']
  },
  {
    file: 'oppo reno 8.png',
    destName: 'sim_tray_oppo_reno_8.png',
    matchNames: ['SIM TRAY OPPO RENO 8 4G/5G']
  },
  {
    file: 'redmi 10 4g.png',
    destName: 'sim_tray_redmi_10_4g.png',
    matchNames: ['SIM TRAY REDMI 10 4G', 'SIM TRAY REDMI 10 ORG']
  },
  {
    file: 'redmi 10 5g.png',
    destName: 'sim_tray_redmi_10_5g.png',
    matchNames: ['SIM TRAY REDMI 10 5G']
  },
  {
    file: 'redmi 9.png',
    destName: 'sim_tray_redmi_9.png',
    matchNames: ['SIM TRAY REDMI 9']
  }
];

async function run() {
  console.log('🚀 Starting SIM Tray Images Upload & Product Matching...');

  // 1. Copy images to server/uploads/
  let copiedCount = 0;
  for (const m of imageProductMappings) {
    const srcPath = path.join(SOURCE_DIR, m.file);
    const destPath = path.join(SERVER_UPLOADS_DIR, m.destName);

    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      copiedCount++;
      console.log(`✔ Copied: ${m.file} -> server/uploads/${m.destName}`);
    } else {
      console.warn(`⚠ Source file not found: ${srcPath}`);
    }
  }
  console.log(`📁 Total ${copiedCount}/${imageProductMappings.length} images copied to server/uploads/.`);

  // 2. Update server/db-export/products.json
  if (fs.existsSync(DB_EXPORT_PRODUCTS)) {
    const prods = JSON.parse(fs.readFileSync(DB_EXPORT_PRODUCTS, 'utf8'));
    let matchedProductCount = 0;

    for (const m of imageProductMappings) {
      const relativeImagePath = `/uploads/${m.destName}`;
      for (const p of prods) {
        if (m.matchNames.includes(p.name)) {
          p.images = [relativeImagePath];
          matchedProductCount++;
          console.log(`  🔗 Updated product [${p.name}] -> images: ['${relativeImagePath}']`);
        }
      }
    }

    fs.writeFileSync(DB_EXPORT_PRODUCTS, JSON.stringify(prods, null, 2), 'utf8');
    console.log(`💾 Updated ${matchedProductCount} products in db-export/products.json`);
  }

  // 3. Update local MongoDB if available
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/nordinestore';
  try {
    console.log('Connecting to local MongoDB...');
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    const Product = mongoose.model('Product', new mongoose.Schema({
      name: String,
      images: [String]
    }));

    for (const m of imageProductMappings) {
      const relativeImagePath = `/uploads/${m.destName}`;
      await Product.updateMany(
        { name: { $in: m.matchNames } },
        { $set: { images: [relativeImagePath] } }
      );
    }
    console.log('✔ Local MongoDB updated successfully.');
    await mongoose.disconnect();
  } catch (err) {
    console.log('ℹ Local MongoDB not active (db-export JSON will be used for VPS import).');
  }

  console.log('🎉 Image processing completed successfully!');
}

run().catch(console.error);
