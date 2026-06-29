import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Brain artifact folder where images were saved
const artifactDir = 'C:\\Users\\PC\\.gemini\\antigravity\\brain\\375b202b-df83-4a1a-9a5b-ed4d2aee37b4';

// Destination directories
const serverUploadsDir = path.join(__dirname, '..', 'uploads');
const clientPublicUploadsDir = path.join(__dirname, '..', '..', 'client', 'public', 'uploads');

// Create folders if they don't exist
if (!fs.existsSync(serverUploadsDir)) {
  fs.mkdirSync(serverUploadsDir, { recursive: true });
}
if (!fs.existsSync(clientPublicUploadsDir)) {
  fs.mkdirSync(clientPublicUploadsDir, { recursive: true });
}

const mappings = [
  { src: 'screen_1782574186068.png', dest: 'screen.png' },
  { src: 'battery_1782574196201.png', dest: 'battery.png' },
  { src: 'connecteur_1782574208174.png', dest: 'connecteur.png' },
  { src: 'glass_1782574218801.png', dest: 'glass.png' },
  { src: 'pouch_1782574230301.png', dest: 'pouch.png' },
  { src: 'repair_tool_1782574241706.png', dest: 'repair_tool.png' },
  { src: 'spare_part_1782574253267.png', dest: 'spare_part.png' }
];

console.log('Copying generated category images...');

mappings.forEach(({ src, dest }) => {
  const srcPath = path.join(artifactDir, src);
  const serverDestPath = path.join(serverUploadsDir, dest);
  const clientDestPath = path.join(clientPublicUploadsDir, dest);

  if (fs.existsSync(srcPath)) {
    // Copy to server uploads
    fs.copyFileSync(srcPath, serverDestPath);
    console.log(`Copied ${src} -> server/uploads/${dest}`);

    // Copy to client public uploads (optional fallback)
    try {
      fs.copyFileSync(srcPath, clientDestPath);
      console.log(`Copied ${src} -> client/public/uploads/${dest}`);
    } catch (e) {
      console.warn(`Could not copy to client public uploads: ${e.message}`);
    }
  } else {
    console.error(`Source file not found: ${srcPath}`);
  }
});

console.log('All copies done.');
process.exit(0);
