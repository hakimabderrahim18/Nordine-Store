import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imgSourceDir = 'E:/AFFICHEUR 151026';
const uploadsDir = path.resolve(__dirname, '../uploads');
const productsFile = path.resolve(__dirname, '../db-export/products.json');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

console.log('1. Fixing prices for all products in db-export/products.json...');
const products = JSON.parse(fs.readFileSync(productsFile, 'utf8'));

let fixedPricesCount = 0;
for (const p of products) {
  let changed = false;

  // Sync price <-> priceDetail
  if ((!p.price || p.price === 0) && p.priceDetail > 0) {
    p.price = p.priceDetail;
    changed = true;
  } else if ((!p.priceDetail || p.priceDetail === 0) && p.price > 0) {
    p.priceDetail = p.price;
    changed = true;
  }

  // Sync demiGrosPrice <-> priceDemiGros
  if ((!p.demiGrosPrice || p.demiGrosPrice === 0) && p.priceDemiGros > 0) {
    p.demiGrosPrice = p.priceDemiGros;
    changed = true;
  } else if ((!p.priceDemiGros || p.priceDemiGros === 0) && p.demiGrosPrice > 0) {
    p.priceDemiGros = p.demiGrosPrice;
    changed = true;
  }

  // Sync superGrosPrice <-> priceSuperGros
  if ((!p.superGrosPrice || p.superGrosPrice === 0) && p.priceSuperGros > 0) {
    p.superGrosPrice = p.priceSuperGros;
    changed = true;
  } else if ((!p.priceSuperGros || p.priceSuperGros === 0) && p.superGrosPrice > 0) {
    p.priceSuperGros = p.superGrosPrice;
    changed = true;
  }

  // Sync discountPrice <-> pricePromo
  if ((!p.discountPrice || p.discountPrice === 0) && p.pricePromo > 0) {
    p.discountPrice = p.pricePromo;
    changed = true;
  } else if ((!p.pricePromo || p.pricePromo === 0) && p.discountPrice > 0) {
    p.pricePromo = p.discountPrice;
    changed = true;
  }

  if (changed) {
    p.updatedAt = new Date().toISOString();
    fixedPricesCount++;
  }
}

console.log(`✔ Fixed prices on ${fixedPricesCount} products.`);

// Map of image filenames to destination and matcher function
const imageRules = [
  {
    src: 'CITY 100.png',
    dest: 'afficheur_city_100.png',
    matcher: (p, name) => name.includes('CITY 100') && (name.includes('AFFICHEUR') || name.includes('LCD'))
  },
  {
    src: 'HOT 12 PLAY.png',
    dest: 'afficheur_hot_12_play.png',
    matcher: (p, name) => name.includes('HOT 12 PLAY') && (name.includes('AFFICHEUR') || name.includes('LCD'))
  },
  {
    src: 'HOT 50 4G.png',
    dest: 'afficheur_hot_50_4g.png',
    matcher: (p, name) => name.includes('HOT 50 4G') && (name.includes('AFFICHEUR') || name.includes('LCD'))
  },
  {
    src: 'HOT 50 PRO ORIG.png',
    dest: 'afficheur_hot_50_pro_orig.png',
    matcher: (p, name) => name.includes('HOT 50 PRO') && name.includes('ORG') && (name.includes('AFFICHEUR') || name.includes('LCD'))
  },
  {
    src: 'hot 9.png',
    dest: 'afficheur_hot_9.png',
    matcher: (p, name) => (name.includes('HOT 9') || name.includes('HOT9')) && !name.includes('PLAY') && (name.includes('AFFICHEUR') || name.includes('LCD'))
  },
  {
    src: 'ITEL A80.png',
    dest: 'afficheur_itel_a80.png',
    matcher: (p, name) => (name.includes('ITEL A80') || (name.includes('A80') && name.includes('ITEL'))) && (name.includes('AFFICHEUR') || name.includes('LCD'))
  },
  {
    src: 'LCD SMART 7.png',
    dest: 'afficheur_lcd_smart_7.png',
    matcher: (p, name) => name.includes('SMART 7') && (name.includes('AFFICHEUR') || name.includes('LCD'))
  },
  {
    src: 'note 11e.png',
    dest: 'afficheur_note_11e.png',
    matcher: (p, name) => name.includes('NOTE 11E') && (name.includes('AFFICHEUR') || name.includes('LCD'))
  },
  {
    src: 'note 8t.png',
    dest: 'afficheur_note_8t.png',
    matcher: (p, name) => name.includes('NOTE 8T') && (name.includes('AFFICHEUR') || name.includes('LCD'))
  },
  {
    src: 'note 9 pro.png',
    dest: 'afficheur_note_9_pro.png',
    matcher: (p, name) => name.includes('NOTE 9 PRO') && (name.includes('AFFICHEUR') || name.includes('LCD'))
  },
  {
    src: 'REDMI 10C.png',
    dest: 'afficheur_redmi_10c.png',
    matcher: (p, name) => name.includes('REDMI 10C') && (name.includes('AFFICHEUR') || name.includes('LCD'))
  },
  {
    src: 'redmi 12.png',
    dest: 'afficheur_redmi_12.png',
    matcher: (p, name) => name.includes('REDMI 12') && !name.includes('12C') && !name.includes('NOTE 12 ') && !name.includes('NOTE 12/') && !name.includes('NOTE 12P') && (name.includes('AFFICHEUR') || name.includes('LCD'))
  },
  {
    src: 'redmi 13c.png',
    dest: 'afficheur_redmi_13c.png',
    matcher: (p, name) => name.includes('REDMI 13C') && (name.includes('AFFICHEUR') || name.includes('LCD'))
  },
  {
    src: 'REDMI 15C.png',
    dest: 'afficheur_redmi_15c.png',
    matcher: (p, name) => name.includes('REDMI 15C') && (name.includes('AFFICHEUR') || name.includes('LCD'))
  },
  {
    src: 'REDMI 9.png',
    dest: 'afficheur_redmi_9.png',
    matcher: (p, name) => (name.includes('REDMI 9 ') || name.includes('REDMI 9/') || name.includes('REDMI 9 BLINDE')) && !name.includes('9A') && !name.includes('9C') && !name.includes('9T') && !name.includes('NOTE 9') && (name.includes('AFFICHEUR') || name.includes('LCD'))
  },
  {
    src: 'REDMI 9A DJN.png',
    dest: 'afficheur_redmi_9a_djn.png',
    matcher: (p, name) => name.includes('REDMI 9A') && name.includes('DJN') && (name.includes('AFFICHEUR') || name.includes('LCD'))
  },
  {
    src: 'REDMI NOTE 10 5G.png',
    dest: 'afficheur_redmi_note_10_5g.png',
    matcher: (p, name) => name.includes('NOTE 10 5G') && (name.includes('AFFICHEUR') || name.includes('LCD'))
  },
  {
    src: 'REDMI NOTE 7.png',
    dest: 'afficheur_redmi_note_7.png',
    matcher: (p, name) => name.includes('NOTE 7') && !name.includes('NOTE 70') && (name.includes('AFFICHEUR') || name.includes('LCD'))
  },
  {
    src: 'redmi note 9.png',
    dest: 'afficheur_redmi_note_9.png',
    matcher: (p, name) => name.includes('NOTE 9') && !name.includes('NOTE 9 PRO') && !name.includes('NOTE 9S') && !name.includes('NOTE 9T') && !name.includes('NOTE 9 5G') && (name.includes('AFFICHEUR') || name.includes('LCD'))
  },
  {
    src: 'spark 8c.png',
    dest: 'afficheur_spark_8c.png',
    matcher: (p, name) => name.includes('SPARK 8C') && (name.includes('AFFICHEUR') || name.includes('LCD'))
  },
  {
    src: 'Y03 JT.png',
    dest: 'afficheur_y03_jt.png',
    matcher: (p, name) => name.includes('Y03') && (name.includes('AFFICHEUR') || name.includes('LCD'))
  },
  {
    src: 'Y20 JT.png',
    dest: 'afficheur_y20_jt.png',
    matcher: (p, name) => name.includes('Y20') && (name.includes('AFFICHEUR') || name.includes('LCD'))
  }
];

console.log('\n2. Copying images and updating product images...');

let totalProductsUpdated = 0;

for (const rule of imageRules) {
  const srcPath = path.join(imgSourceDir, rule.src);
  const destPath = path.join(uploadsDir, rule.dest);

  if (!fs.existsSync(srcPath)) {
    console.warn(`[Warning] Image not found: ${srcPath}`);
    continue;
  }

  // Copy to server/uploads
  fs.copyFileSync(srcPath, destPath);
  console.log(`Copied: ${rule.src} -> uploads/${rule.dest}`);

  const webPath = `/uploads/${rule.dest}`;

  // Find matching products
  const matched = products.filter(p => {
    const u = (p.name || '').toUpperCase();
    return rule.matcher(p, u);
  });

  console.log(`  Matched ${matched.length} product(s) for ${rule.dest}:`);
  for (const prod of matched) {
    prod.images = [webPath];
    prod.updatedAt = new Date().toISOString();
    console.log(`    - [${prod.sku}] ${prod.name}`);
    totalProductsUpdated++;
  }
}

// Write back updated products.json
fs.writeFileSync(productsFile, JSON.stringify(products, null, 2), 'utf8');
console.log(`\n✔ Saved db-export/products.json successfully! (Total image updates: ${totalProductsUpdated})`);
