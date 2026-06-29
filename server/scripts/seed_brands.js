import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import Brand from '../models/Brand.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nordinestore');
    console.log('MongoDB Connected for seeding brands...');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const makeCircularSvg = (logoContent) => {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <circle cx="50" cy="50" r="45" fill="#ffffff" stroke="#000000" stroke-width="4.5"/>
    ${logoContent}
  </svg>`;
};

const brandLogos = {
  apple: makeCircularSvg(`
    <path d="M50 76.5c-2.8 4.2-5.8 8.2-10.4 8.3-4.5.1-6-2.6-11.2-2.6-5.2 0-6.8 2.6-11.1 2.8-4.5.2-7.8-4.4-10.6-8.5C18.9 70 14.5 54.7 20.5 44.3c2.9-5.2 8.3-8.4 14-8.5 4.4-.1 8.5 2.9 11.2 2.9 2.6 0 7.6-.4 12.9.7 5.1 1 9.1 5 11.3 8.3-10.5 6.1-8.7 19.5 1.7 23.8-2.1 5.2-4.7 10.5-7.6 13.8zM65.9 30.2c2.4-2.8 3.9-6.8 3.5-10.7-3.4.1-7.6 2.3-10 5.1-2.2 2.5-4.1 6.5-3.5 10.4 3.7.3 7.7-2 10-4.8z" fill="#000000" transform="translate(11, 4) scale(0.85)"/>
    <text x="50" y="80" font-family="sans-serif" font-weight="900" font-size="7" fill="#000000" text-anchor="middle" letter-spacing="1">APPLE</text>
  `),
  samsung: makeCircularSvg(`
    <text x="50" y="53" font-family="'Arial Black', sans-serif" font-size="11" font-weight="900" letter-spacing="0.5" fill="#000000" text-anchor="middle">SAMSUNG</text>
    <text x="50" y="76" font-family="sans-serif" font-weight="900" font-size="7" fill="#000000" text-anchor="middle" letter-spacing="1">SAMSUNG</text>
  `),
  oppo: makeCircularSvg(`
    <path d="M 28 50 A 10 10 0 1 1 48 50 A 10 10 0 1 1 28 50 Z M 52 50 A 10 10 0 1 1 72 50 A 10 10 0 1 1 52 50 Z" stroke="#008a24" stroke-width="4.5" fill="none"/>
    <text x="50" y="78" font-family="sans-serif" font-weight="900" font-size="7" fill="#008a24" text-anchor="middle" letter-spacing="1">OPPO</text>
  `),
  xiaomi: makeCircularSvg(`
    <rect x="32" y="26" width="36" height="36" rx="8" fill="#ff6700"/>
    <path d="M38 48v-8c0-2 1.5-3.5 3.5-3.5s3.5 1.5 3.5 3.5v8m0-8c0-2 1.5-3.5 3.5-3.5s3.5 1.5 3.5 3.5v8m5-10v10m0-13v1" stroke="#ffffff" stroke-width="3" stroke-linecap="round" fill="none"/>
    <text x="50" y="78" font-family="sans-serif" font-weight="900" font-size="7" fill="#ff6700" text-anchor="middle" letter-spacing="1">XIAOMI</text>
  `),
  poco: makeCircularSvg(`
    <text x="50" y="52" font-family="'Arial Black', sans-serif" font-size="15" font-weight="900" fill="#000000" text-anchor="middle">POCO</text>
    <text x="50" y="76" font-family="sans-serif" font-weight="900" font-size="7" fill="#000000" text-anchor="middle" letter-spacing="1">POCO</text>
  `),
  realme: makeCircularSvg(`
    <rect x="22" y="32" width="56" height="22" rx="4" fill="#ffc800"/>
    <text x="50" y="47" font-family="sans-serif" font-size="10.5" font-weight="900" fill="#000000" text-anchor="middle">realme</text>
    <text x="50" y="76" font-family="sans-serif" font-weight="900" font-size="7" fill="#000000" text-anchor="middle" letter-spacing="1">REALME</text>
  `),
  huawei: makeCircularSvg(`
    <g fill="#ff0000" transform="translate(50,42) scale(0.55)">
      <path d="M0,0 C-10,-20 -20,-30 0,-50 C20,-30 10,-20 0,0 Z"/>
      <path d="M0,0 C-22,-5 -32,-12 -25,-38 C-18,-26 -10,-18 0,0 Z" transform="rotate(28)"/>
      <path d="M0,0 C-22,-5 -32,-12 -25,-38 C-18,-26 -10,-18 0,0 Z" transform="rotate(-28) scale(-1, 1)"/>
      <path d="M0,0 C-22,-5 -32,-12 -25,-38 C-18,-26 -10,-18 0,0 Z" transform="rotate(56)"/>
      <path d="M0,0 C-22,-5 -32,-12 -25,-38 C-18,-26 -10,-18 0,0 Z" transform="rotate(-56) scale(-1, 1)"/>
      <path d="M0,0 C-22,-5 -32,-12 -25,-38 C-18,-26 -10,-18 0,0 Z" transform="rotate(84)"/>
      <path d="M0,0 C-22,-5 -32,-12 -25,-38 C-18,-26 -10,-18 0,0 Z" transform="rotate(-84) scale(-1, 1)"/>
    </g>
    <text x="50" y="76" font-family="sans-serif" font-weight="900" font-size="7" fill="#000000" text-anchor="middle" letter-spacing="0.5">HUAWEI</text>
  `),
  honor: makeCircularSvg(`
    <text x="50" y="52" font-family="sans-serif" font-size="13" font-weight="900" letter-spacing="0.8" fill="#000000" text-anchor="middle">HONOR</text>
    <text x="50" y="76" font-family="sans-serif" font-weight="900" font-size="7" fill="#000000" text-anchor="middle" letter-spacing="1">HONOR</text>
  `),
  ace: makeCircularSvg(`
    <path d="M50 25 L65 57 C67 61, 62 63, 50 55 C38 63, 33 61, 35 57 Z" fill="none" stroke="black" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"/>
    <text x="50" y="78" font-family="sans-serif" font-weight="950" font-size="9" fill="#000000" text-anchor="middle">ACE</text>
  `),
  condor: makeCircularSvg(`
    <g stroke="#0c2340" fill="none" stroke-width="1.8" stroke-linecap="round" transform="translate(10, 0)">
       <path d="M 16 43 C 21 39, 28 41, 31 46 C 26 42, 19 44, 18 49"/>
       <path d="M 18 48 C 22 44, 28 46, 30 51 C 25 47, 20 49, 19 54"/>
       <path d="M 20 53 C 23 49, 27 51, 29 56 C 24 52, 22 54, 21 59"/>
     </g>
     <text x="50" y="50" font-family="sans-serif" font-size="9.5" font-weight="900" fill="#0c2340">Condor</text>
     <text x="50" y="76" font-family="sans-serif" font-weight="900" font-size="7" fill="#0c2340" text-anchor="middle" letter-spacing="1">CONDOR</text>
  `),
  tecno: makeCircularSvg(`
    <text x="50" y="50" font-family="sans-serif" font-size="12" font-weight="900" fill="#00529b" text-anchor="middle">TECNO</text>
    <text x="50" y="76" font-family="sans-serif" font-weight="900" font-size="7" fill="#00529b" text-anchor="middle" letter-spacing="1">TECNO</text>
  `),
  infinix: makeCircularSvg(`
    <text x="50" y="46" font-family="sans-serif" font-size="12.5" font-weight="900" fill="#000000" text-anchor="middle">Infinix</text>
    <line x1="32" y1="52" x2="68" y2="52" stroke="#00ff00" stroke-width="2"/>
    <text x="50" y="57" font-family="sans-serif" font-size="2.8" font-weight="bold" fill="#000000" text-anchor="middle">The future is Now!</text>
    <text x="50" y="76" font-family="sans-serif" font-weight="900" font-size="7" fill="#000000" text-anchor="middle" letter-spacing="1">INFINIX</text>
  `),
  itel: makeCircularSvg(`
    <text x="50" y="49" font-family="Georgia, serif" font-style="italic" font-size="18" font-weight="bold" fill="#ff0000" text-anchor="middle">itel</text>
    <path d="M 28 53 Q 50 63 72 53" stroke="#ff0000" stroke-width="2" fill="none"/>
    <text x="50" y="76" font-family="sans-serif" font-weight="900" font-size="7" fill="#000000" text-anchor="middle" letter-spacing="1">ITEL</text>
  `),
  lg: makeCircularSvg(`
    <circle cx="36" cy="45" r="12" fill="#a50034"/>
    <path d="M 36 37 A 8 8 0 1 0 44 45 M 36 41 L 36 45 L 40 45" stroke="white" stroke-width="2" stroke-linecap="round" fill="none"/>
    <circle cx="32" cy="42" r="1" fill="white"/>
    <text x="59" y="50" font-family="sans-serif" font-size="13" font-weight="900" fill="#707070">LG</text>
    <text x="50" y="76" font-family="sans-serif" font-weight="900" font-size="7" fill="#000000" text-anchor="middle" letter-spacing="1">LG</text>
  `),
  google: makeCircularSvg(`
    <path d="M50 43.3v8.5h16.2c-.7 3.5-3.3 6.5-6.9 7.8v5.5h11.1C76.9 59 80 50.3 80 40c0-1.2-.1-2.4-.3-3.4H50z" fill="#4285f4"/>
    <path d="M50 26c6.5 0 12.3 2.2 16.9 6.6l6.3-6.3C69.4 22.8 60.4 20 50 20c-11.6 0-21.5 6.6-26.3 16.3l7.2 5.6C32.7 33 40.7 26 50 26z" fill="#ea4335"/>
    <path d="M23.7 36.3C22.6 39.6 22 43.1 22 46.7s.6 7.1 1.7 10.4l7.2-5.6c-.3-1.5-.5-3.1-.5-4.8s.2-3.3.5-4.8l-7.2-5.6z" fill="#fbbc05"/>
    <path d="M50 67.4c-9.3 0-17.3-7-20.9-15.9l-7.2 5.6C26.8 66.8 36.7 73.4 50 73.4c10.4 0 19.1-3.4 25.5-9.3l-6.9-5.5c-4.4 2.9-10 4.8-18.6 4.8z" fill="#34a853"/>
    <text x="50" y="81" font-family="sans-serif" font-weight="900" font-size="7" fill="#000000" text-anchor="middle" letter-spacing="1">GOOGLE</text>
  `),
  nokia: makeCircularSvg(`
    <text x="50" y="52" font-family="'Arial Black', sans-serif" font-size="11.5" font-weight="900" fill="#124191" text-anchor="middle" letter-spacing="0.5">NOKIA</text>
    <text x="50" y="76" font-family="sans-serif" font-weight="900" font-size="7" fill="#124191" text-anchor="middle" letter-spacing="1">NOKIA</text>
  `),
  oneplus: makeCircularSvg(`
    <rect x="36" y="26" width="28" height="28" rx="4" fill="#f50014"/>
    <text x="46" y="47" font-family="sans-serif" font-size="20" font-weight="bold" fill="white" text-anchor="middle">1</text>
    <path d="M 52 35 h 6 M 55 32 v 6" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
    <text x="50" y="76" font-family="sans-serif" font-weight="900" font-size="7" fill="#f50014" text-anchor="middle" letter-spacing="1">ONEPLUS</text>
  `),
  motorola: makeCircularSvg(`
    <circle cx="50" cy="42" r="18" fill="#000000"/>
    <path d="M38 48 c0-8, 5-11, 7-6 C49 37, 54 40, 54 48 M42 48 L45 38 L48 43 L51 38 L54 48" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <text x="50" y="76" font-family="sans-serif" font-weight="900" font-size="7" fill="#000000" text-anchor="middle" letter-spacing="1">MOTOROLA</text>
  `),
  vivo: makeCircularSvg(`
    <text x="50" y="52" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="16" font-weight="bold" font-style="italic" fill="#415fff" text-anchor="middle">vivo</text>
    <text x="50" y="76" font-family="sans-serif" font-weight="900" font-size="7" fill="#415fff" text-anchor="middle" letter-spacing="1">VIVO</text>
  `),
  accessoires: makeCircularSvg(`
    <path d="M36 45 A 14 14 0 0 1 64 45 M34 45 h 4 M62 45 h 4 M34 45 v 6 h 4 v -6 M62 45 v 6 h 4 v -6" stroke="#000000" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <rect x="44" y="38" width="12" height="18" rx="2" stroke="#000000" stroke-width="2" fill="none"/>
    <circle cx="50" cy="47" r="2" fill="#000000"/>
    <text x="50" y="76" font-family="sans-serif" font-weight="900" font-size="7" fill="#000000" text-anchor="middle" letter-spacing="1">ACCESSOIRES</text>
  `),
  outillage: makeCircularSvg(`
    <path d="M35 55 L55 35 M55 35 L62 42" stroke="#000000" stroke-width="2.5" fill="none"/>
    <path d="M30 60 L26 64 L28 66 L32 62 Z" fill="#000000"/>
    <rect x="52" y="28" width="12" height="12" rx="2" stroke="#000000" stroke-width="2" fill="none"/>
    <text x="50" y="76" font-family="sans-serif" font-weight="900" font-size="7" fill="#000000" text-anchor="middle" letter-spacing="1">OUTILLAGE</text>
  `)
};

const seedBrands = async () => {
  await connectDB();

  const uploadDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Create SVGs
  console.log('Generating brand logo SVG files in uploads...');
  for (const [key, svgContent] of Object.entries(brandLogos)) {
    const filePath = path.join(uploadDir, `brand_${key}.svg`);
    fs.writeFileSync(filePath, svgContent.trim());
    console.log(`- Created ${filePath}`);
  }

  // Database updates
  console.log('Seeding brands collection in MongoDB...');
  const brandData = [
    { name: 'Apple', description: 'Composants de rechange certifiés et Service Pack pour iPhone et iPad', logo: '/uploads/brand_apple.svg' },
    { name: 'Samsung', description: 'Écrans Super AMOLED originaux et batteries d\'origine Samsung Service Pack', logo: '/uploads/brand_samsung.svg' },
    { name: 'Oppo', description: 'Composants de rechange et Service Pack d\'origine pour terminaux Oppo', logo: '/uploads/brand_oppo.svg' },
    { name: 'Xiaomi', description: 'Pièces détachées d\'origine pour Redmi, Poco et gammes Mi', logo: '/uploads/brand_xiaomi.svg' },
    { name: 'Poco', description: 'Pièces de rechange et Service Pack pour smartphones de marque Poco', logo: '/uploads/brand_poco.svg' },
    { name: 'Realme', description: 'Pièces détachées d\'origine pour les gammes Realme et Narzo', logo: '/uploads/brand_realme.svg' },
    { name: 'Huawei', description: 'Composants officiels pour réparation d\'appareils Huawei et Honor', logo: '/uploads/brand_huawei.svg' },
    { name: 'Honor', description: 'Pièces détachées d\'origine pour smartphones de marque Honor', logo: '/uploads/brand_honor.svg' },
    { name: 'Ace', description: 'Pièces détachées et batteries de rechange de marque Ace Mobile', logo: '/uploads/brand_ace.svg' },
    { name: 'Condor', description: 'Composants officiels et d\'origine pour téléphones Condor Algérie', logo: '/uploads/brand_condor.svg' },
    { name: 'Tecno', description: 'Pièces de rechange d\'origine pour la gamme Tecno Mobile', logo: '/uploads/brand_tecno.svg' },
    { name: 'Infinix', description: 'Nappes de charge, batteries et pièces détachées pour Infinix', logo: '/uploads/brand_infinix.svg' },
    { name: 'Itel', description: 'Composants et dalles tactiles de remplacement pour téléphones Itel', logo: '/uploads/brand_itel.svg' },
    { name: 'LG', description: 'Pièces détachées, batteries et vitres tactiles pour smartphones LG', logo: '/uploads/brand_lg.svg' },
    { name: 'Google', description: 'Pièces d\'origine et écrans OLED pour smartphones Google Pixel', logo: '/uploads/brand_google.svg' },
    { name: 'Nokia', description: 'Composants de rechange et écrans d\'affichage de marque Nokia', logo: '/uploads/brand_nokia.svg' },
    { name: 'OnePlus', description: 'Modules d\'affichage fluides et batteries pour la gamme OnePlus', logo: '/uploads/brand_oneplus.svg' },
    { name: 'Motorola', description: 'Dalles d\'affichage et pièces de rechange de marque Motorola', logo: '/uploads/brand_motorola.svg' },
    { name: 'Vivo', description: 'Composants de rechange et Service Pack d\'origine pour terminaux Vivo', logo: '/uploads/brand_vivo.svg' },
    { name: 'Accessoires', description: 'Écouteurs, verres trempés, coques de protection et chargeurs', logo: '/uploads/brand_accessoires.svg' },
    { name: 'Outillage', description: 'Stations de soudage, fers à souder et tournevis de précision', logo: '/uploads/brand_outillage.svg' }
  ];

  for (const data of brandData) {
    const existing = await Brand.findOne({ name: { $regex: new RegExp(`^${data.name}$`, 'i') } });
    if (existing) {
      existing.logo = data.logo;
      existing.description = data.description;
      existing.status = 'active';
      await existing.save();
      console.log(`Updated brand: ${data.name}`);
    } else {
      await Brand.create(data);
      console.log(`Created brand: ${data.name}`);
    }
  }

  console.log('Brands seeded successfully!');
  mongoose.connection.close();
};

seedBrands();
