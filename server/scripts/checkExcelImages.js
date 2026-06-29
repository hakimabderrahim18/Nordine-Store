import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const excelFilePath = path.join(__dirname, '..', '..', 'NOUNOUTELECOM27-06-2026-à12h39.xls');

if (!fs.existsSync(excelFilePath)) {
  console.error('File not found');
  process.exit(1);
}

const workbook = xlsx.readFile(excelFilePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const rows = xlsx.utils.sheet_to_json(worksheet);

let rowsWithImageValue = 0;
const samples = [];

for (const row of rows) {
  // Check if any key resembles image
  for (const key of Object.keys(row)) {
    const norm = key.toLowerCase();
    if (norm.includes('image') || norm.includes('photo') || norm.includes('pic')) {
      if (row[key]) {
        rowsWithImageValue++;
        if (samples.length < 10) {
          samples.push({ sku: row['Réf produit'] || row['sku'], key, value: row[key] });
        }
      }
    }
  }
}

console.log('Total rows in Excel:', rows.length);
console.log('Rows containing image/photo values:', rowsWithImageValue);
console.log('Sample image values:', samples);
