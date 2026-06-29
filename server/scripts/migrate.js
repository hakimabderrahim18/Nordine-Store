import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXPORT_DIR = path.join(__dirname, '../db-export');
const DEFAULT_MONGO_URI = 'mongodb://localhost:27017/nordinestore';

async function exportDatabase(uri) {
  console.log(`[Export] Connexion à la base de données : ${uri}...`);
  await mongoose.connect(uri);
  
  if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
  }

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  
  for (const colInfo of collections) {
    const name = colInfo.name;
    // Ignorer les collections système et index
    if (name.startsWith('system.')) continue;

    console.log(`[Export] Extraction de la collection : ${name}...`);
    const data = await db.collection(name).find({}).toArray();
    
    const filePath = path.join(EXPORT_DIR, `${name}.json`);
    // Convertir les objets spéciaux comme ObjectId et Date en JSON standard
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`[Export] Collection '${name}' exportée (${data.length} documents) dans ${filePath}`);
  }

  await mongoose.disconnect();
  console.log('[Export] Terminé avec succès !');
}

async function importDatabase(uri) {
  console.log(`[Import] Connexion à la base de données cible : ${uri}...`);
  await mongoose.connect(uri);

  if (!fs.existsSync(EXPORT_DIR)) {
    console.error(`[Erreur] Dossier d'exportation non trouvé : ${EXPORT_DIR}`);
    process.exit(1);
  }

  const db = mongoose.connection.db;
  const files = fs.readdirSync(EXPORT_DIR).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const colName = path.basename(file, '.json');
    const filePath = path.join(EXPORT_DIR, file);
    const rawData = fs.readFileSync(filePath, 'utf8');
    
    // Parser les données et restaurer les types spéciaux
    let docs = JSON.parse(rawData);
    if (!Array.isArray(docs)) continue;

    if (docs.length === 0) {
      console.log(`[Import] Collection '${colName}' vide, passée.`);
      continue;
    }

    console.log(`[Import] Nettoyage de la collection cible : ${colName}...`);
    try {
      await db.collection(colName).drop();
    } catch (e) {
      // Ignorer l'erreur si la collection n'existe pas encore
    }

    // Convertir les chaînes ISO et les ID d'objets sérialisés en types natifs MongoDB
    const parsedDocs = docs.map(doc => deserializeDoc(doc));

    console.log(`[Import] Insertion de ${parsedDocs.length} documents dans '${colName}'...`);
    await db.collection(colName).insertMany(parsedDocs);
    console.log(`[Import] Collection '${colName}' importée avec succès !`);
  }

  await mongoose.disconnect();
  console.log('[Import] Restauration terminée avec succès !');
}

// Fonction utilitaire pour recréer les ObjectId et les Dates natifs de MongoDB
function deserializeDoc(item) {
  if (item === null || item === undefined) return item;
  
  if (Array.isArray(item)) {
    return item.map(i => deserializeDoc(i));
  }
  
  if (typeof item === 'object') {
    // Si c'est un ObjectId sérialisé par le driver mongo
    if (item.$oid && typeof item.$oid === 'string') {
      return new mongoose.Types.ObjectId(item.$oid);
    }
    // Si c'est un ObjectId standard représenté sous forme de chaîne de 24 caractères hexadécimaux pour les clés _id
    if (item._id && typeof item._id === 'string' && /^[0-9a-fA-F]{24}$/.test(item._id)) {
      item._id = new mongoose.Types.ObjectId(item._id);
    }
    
    // Récurser sur tous les attributs de l'objet
    for (const key in item) {
      if (Object.prototype.hasOwnProperty.call(item, key)) {
        const val = item[key];
        
        // Convertir les dates sérialisées
        if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(val)) {
          item[key] = new Date(val);
        } else if (typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(val) && (key.toLowerCase().endsWith('id') || key === '_id')) {
          item[key] = new mongoose.Types.ObjectId(val);
        } else {
          item[key] = deserializeDoc(val);
        }
      }
    }
  }
  return item;
}

const mode = process.argv[2];
const mongoUri = process.argv[3] || DEFAULT_MONGO_URI;

if (mode === '--export') {
  exportDatabase(mongoUri).catch(console.error);
} else if (mode === '--import') {
  importDatabase(mongoUri).catch(console.error);
} else {
  console.log('Usage: node migrate.js <--export|--import> [MONGO_URI]');
  process.exit(1);
}
