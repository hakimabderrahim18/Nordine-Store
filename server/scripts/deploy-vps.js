import { Client } from 'ssh2';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VPS_CONFIG = {
  host: '37.60.253.8',
  port: 22,
  username: 'root',
  password: 'lXFf4nszTgNjy0OjUYC68zVRSkCj'
};

const PROJECT_ROOT = path.join(__dirname, '../..');
const SERVER_DIR = path.join(__dirname, '..');

// Fonction pour exécuter des commandes locales sous forme de Promesses
function runLocalCommand(cmd, cwd = PROJECT_ROOT) {
  return new Promise((resolve, reject) => {
    console.log(`[Local] Exécution : ${cmd}`);
    exec(cmd, { cwd }, (error, stdout, stderr) => {
      if (error) {
        console.error(`[Local Erreur] ${error.message}`);
        return reject(error);
      }
      if (stderr && !stderr.includes('warning') && !stderr.includes('npm')) {
        console.warn(`[Local Avertissement] ${stderr}`);
      }
      resolve(stdout);
    });
  });
}

// Étape 1 : Exportation locale de la base de données et de l'archive tar
async function preparePackage() {
  console.log('--- 1. Préparation du package de déploiement ---');
  
  // Exporter la base locale
  console.log('Exportation de la base de données locale...');
  await runLocalCommand('npm run migrate -- --export', SERVER_DIR);
  
  // Exécuter tar pour créer l'archive de manière ultra rapide
  console.log('Compression des fichiers (sans node_modules)...');
  const tarCmd = `tar -czf "${path.join(SERVER_DIR, 'nordinestore.tar.gz')}" --exclude="node_modules" --exclude="client/dist" --exclude="server/nordinestore.zip" --exclude="server/nordinestore.tar.gz" -C "${PROJECT_ROOT}" client server nordinestore.nginx.conf vps-setup.sh`;
  await runLocalCommand(tarCmd, SERVER_DIR);
  console.log('Package nordinestore.tar.gz créé avec succès !');
}

// Étape 2 : Connexion SSH et téléversement SFTP
function uploadFiles(conn) {
  return new Promise((resolve, reject) => {
    console.log('--- 2. Connexion SFTP et téléversement des fichiers ---');
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      
      const localTarPath = path.join(SERVER_DIR, 'nordinestore.tar.gz');
      const remoteTarPath = '/tmp/nordinestore.tar.gz';
      
      const localNginxPath = path.join(PROJECT_ROOT, 'nordinestore.nginx.conf');
      const remoteNginxPath = '/tmp/nordinestore.nginx.conf';
      
      const localSetupPath = path.join(PROJECT_ROOT, 'vps-setup.sh');
      const remoteSetupPath = '/tmp/vps-setup.sh';

      console.log(`Téléversement de nordinestore.tar.gz vers ${remoteTarPath}...`);
      sftp.fastPut(localTarPath, remoteTarPath, {}, (err) => {
        if (err) return reject(err);
        
        console.log(`Téléversement de nordinestore.nginx.conf vers ${remoteNginxPath}...`);
        sftp.fastPut(localNginxPath, remoteNginxPath, {}, (err) => {
          if (err) return reject(err);
          
          console.log(`Téléversement de vps-setup.sh vers ${remoteSetupPath}...`);
          sftp.fastPut(localSetupPath, remoteSetupPath, {}, (err) => {
            if (err) return reject(err);
            
            console.log('Téléversements SFTP terminés !');
            resolve();
          });
        });
      });
    });
  });
}

// Étape 3 : Exécution des commandes SSH à distance
function executeSSHCommands(conn) {
  return new Promise((resolve, reject) => {
    console.log('--- 3. Exécution de la configuration sur le VPS ---');
    
    const remoteCommands = [
      'chmod +x /tmp/vps-setup.sh',
      'sudo /tmp/vps-setup.sh',
      'echo "Extraction du projet..."',
      'sudo tar -xzf /tmp/nordinestore.tar.gz -C /var/www/nordinestore',
      'echo "Configuration des variables d\'environnement..."',
      `sed -i "s|CLIENT_URL=.*|CLIENT_URL=http://${VPS_CONFIG.host}|g" /var/www/nordinestore/server/.env`,
      'sed -i "s|NODE_ENV=.*|NODE_ENV=production|g" /var/www/nordinestore/server/.env',
      'echo "Installation des dépendances Server..."',
      'cd /var/www/nordinestore/server && npm install --omit=dev',
      'echo "Restauration de la base de données..."',
      'cd /var/www/nordinestore/server && npm run migrate -- --import',
      'echo "Démarrage du Server avec PM2..."',
      'cd /var/www/nordinestore/server && (pm2 start ecosystem.config.cjs --env production || pm2 restart nordinestore-backend)',
      'pm2 save',
      'pm2 startup',
      'echo "Installation des dépendances Client & Build..."',
      'cd /var/www/nordinestore/client && npm install && VITE_API_URL=/api npm run build',
      'echo "Nettoyage..."',
      'rm -f /tmp/nordinestore.tar.gz /tmp/nordinestore.nginx.conf /tmp/vps-setup.sh',
      'echo "DÉPLOIEMENT TERMINÉ !"'
    ].join(' && ');

    conn.exec(remoteCommands, (err, stream) => {
      if (err) return reject(err);
      
      stream.on('close', (code, signal) => {
        if (code !== 0) {
          return reject(new Error(`La configuration à distance a échoué avec le code ${code}`));
        }
        resolve();
      }).on('data', (data) => {
        process.stdout.write(data.toString());
      }).stderr.on('data', (data) => {
        process.stderr.write(data.toString());
      });
    });
  });
}

async function main() {
  try {
    // 1. Préparer le package en local
    await preparePackage();
    
    // 2. Connexion SSH
    console.log(`Connexion SSH à ${VPS_CONFIG.host}...`);
    const conn = new Client();
    
    conn.on('ready', async () => {
      console.log('Connexion SSH établie !');
      
      try {
        // Uploader
        await uploadFiles(conn);
        
        // Installer et déployer
        await executeSSHCommands(conn);
        
        // Supprimer le tar local de sécurité
        fs.unlinkSync(path.join(SERVER_DIR, 'nordinestore.tar.gz'));
        
        console.log('\n======================================================');
        console.log(`  Déploiement réussi !`);
        console.log(`  Accédez à votre boutique : http://${VPS_CONFIG.host}/`);
        console.log('======================================================');
        conn.end();
      } catch (err) {
        console.error('Erreur durant le déploiement sur le VPS:', err);
        conn.end();
        process.exit(1);
      }
    }).on('error', (err) => {
      console.error('Erreur de connexion SSH:', err);
      process.exit(1);
    }).connect(VPS_CONFIG);

  } catch (err) {
    console.error('Erreur locale de préparation:', err);
    process.exit(1);
  }
}

main();
