import { Client } from 'ssh2';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VPS_CONFIG = {
  host: '37.60.253.8',
  port: 22,
  username: 'root',
  password: 'lXFf4nszTgNjy0OjUYC68zVRSkCj'
};

const LOCAL_ROOT = path.join(__dirname, '../..');
const LOCAL_DB_EXPORT = path.join(__dirname, '../db-export');
const LOCAL_UPLOADS = path.join(__dirname, '../uploads');

// Ensure local directories exist
if (!fs.existsSync(LOCAL_DB_EXPORT)) {
  fs.mkdirSync(LOCAL_DB_EXPORT, { recursive: true });
}
if (!fs.existsSync(LOCAL_UPLOADS)) {
  fs.mkdirSync(LOCAL_UPLOADS, { recursive: true });
}

function runLocalCommand(cmd, cwd = LOCAL_ROOT) {
  return new Promise((resolve, reject) => {
    console.log(`[Local] Exécution : ${cmd}`);
    exec(cmd, { cwd }, (error, stdout, stderr) => {
      if (error) {
        console.error(`[Local Erreur] ${error.message}`);
        return reject(error);
      }
      resolve(stdout);
    });
  });
}

const conn = new Client();

conn.on('ready', () => {
  console.log('Connexion SSH établie avec le VPS...');
  
  // Étape 1 : Exporter la base de données sur le VPS
  console.log('Étape 1 : Exportation de la base de données sur le VPS...');
  conn.exec('cd /var/www/nordinestore/server && npm run migrate -- --export', (err, stream) => {
    if (err) {
      console.error('Erreur lors de l\'exportation distante :', err);
      conn.end();
      process.exit(1);
    }
    
    stream.on('close', (code) => {
      console.log(`Exportation distante terminée avec le code de sortie ${code}.`);
      if (code !== 0) {
        console.error('L\'exportation a échoué.');
        conn.end();
        process.exit(1);
      }
      
      // Étape 2 : Démarrer SFTP pour télécharger les fichiers
      downloadRemoteAssets();
    }).on('data', (data) => {
      process.stdout.write('[Remote OS] ' + data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write('[Remote Err] ' + data.toString());
    });
  });
});

function downloadRemoteAssets() {
  console.log('Étape 2 : Démarrage de la connexion SFTP...');
  conn.sftp((err, sftp) => {
    if (err) {
      console.error('Erreur SFTP :', err);
      conn.end();
      process.exit(1);
    }

    // 2.1 Télécharger les fichiers de la base de données
    const remoteDbExportDir = '/var/www/nordinestore/server/db-export';
    console.log(`Lecture des fichiers dans ${remoteDbExportDir} sur le VPS...`);
    
    sftp.readdir(remoteDbExportDir, async (err, list) => {
      if (err) {
        console.error('Erreur lecture dossier db-export distant :', err);
        conn.end();
        process.exit(1);
      }

      const jsonFiles = list.filter(item => item.filename.endsWith('.json'));
      console.log(`Trouvé ${jsonFiles.length} fichiers JSON à télécharger.`);

      for (const file of jsonFiles) {
        const remoteFilePath = `${remoteDbExportDir}/${file.filename}`;
        const localFilePath = path.join(LOCAL_DB_EXPORT, file.filename);
        
        console.log(`Téléchargement de ${file.filename}...`);
        await new Promise((res, rej) => {
          sftp.fastGet(remoteFilePath, localFilePath, {}, (err) => {
            if (err) rej(err);
            else res();
          });
        });
      }
      
      console.log('Tous les fichiers JSON de la base de données ont été téléchargés.');

      // 2.2 Télécharger les fichiers du dossier uploads
      const remoteUploadsDir = '/var/www/nordinestore/server/uploads';
      console.log(`Lecture des fichiers dans ${remoteUploadsDir} sur le VPS...`);
      
      sftp.readdir(remoteUploadsDir, async (err, uploadList) => {
        if (err) {
          // Si le dossier distant n'existe pas, on passe
          console.log('Dossier uploads distant vide ou inexistant. Passage.');
          finishAndImport();
          return;
        }

        const filesToDownload = uploadList.filter(item => !item.attrs.isDirectory());
        console.log(`Trouvé ${filesToDownload.length} fichiers d'uploads à synchroniser.`);

        for (const file of filesToDownload) {
          const remoteFilePath = `${remoteUploadsDir}/${file.filename}`;
          const localFilePath = path.join(LOCAL_UPLOADS, file.filename);
          
          // Ne télécharger que si le fichier local n'existe pas
          if (!fs.existsSync(localFilePath)) {
            console.log(`Téléchargement de l'upload : ${file.filename}...`);
            await new Promise((res, rej) => {
              sftp.fastGet(remoteFilePath, localFilePath, {}, (err) => {
                if (err) {
                  console.error(`Échec téléchargement de ${file.filename}`, err);
                  res(); // Ne pas bloquer toute la synchro pour une image
                } else {
                  res();
                }
              });
            });
          }
        }

        console.log('Dossier uploads synchronisé.');
        finishAndImport();
      });
    });
  });
}

async function finishAndImport() {
  console.log('Déconnexion du VPS...');
  conn.end();
  
  console.log('Étape 3 : Importation locale des données...');
  try {
    await runLocalCommand('npm run migrate -- --import', path.join(__dirname, '..'));
    console.log('\n======================================================');
    console.log(' SYNCHRONISATION DU VPS VERS LE LOCAL RÉUSSIE !');
    console.log(' Toutes les données et images distantes sont locales.');
    console.log('======================================================');
  } catch (error) {
    console.error('Erreur lors de l\'importation locale :', error);
  }
}

conn.on('error', (err) => {
  console.error('Erreur connexion SSH :', err);
}).connect({ ...VPS_CONFIG, readyTimeout: 45000 });
