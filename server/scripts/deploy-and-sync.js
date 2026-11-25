import { Client } from 'ssh2';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const vpsConfig = {
  host: process.env.VPS_HOST || '37.60.253.8',
  port: parseInt(process.env.VPS_PORT || '22', 10),
  username: process.env.VPS_USER || 'root',
  password: process.env.VPS_PASSWORD || 'lXFf4nszTgNjy0OjUYC68zVRSkCj',
  readyTimeout: 60000
};

const rootDir = path.resolve(__dirname, '../../');
const clientDist = path.join(rootDir, 'client/dist');
const serverDir = path.join(rootDir, 'server');
const userExcelSource = 'C:/Users/PC/.gemini/antigravity/brain/192b8344-b4f2-483c-9dbf-c5badfccb272/.user_uploaded/media_1795611051776_d374de2d.xlsx';

console.log('⚡ Starting Deploy & Sync to VPS...');

const conn = new Client();

conn.on('error', (err) => {
  console.error('SSH Error:', err);
});

conn.on('ready', () => {
  console.log('✔ Connected via SSH to VPS (37.60.253.8)');
  conn.sftp((err, sftp) => {
    if (err) {
      console.error('SFTP error:', err);
      conn.end();
      return;
    }

    const uploadFile = (local, remote) => {
      return new Promise((resolve, reject) => {
        sftp.fastPut(local, remote, (putErr) => {
          if (putErr) reject(putErr);
          else resolve();
        });
      });
    };

    const uploadDirRecursive = async (localDirPath, remoteDirPath) => {
      const items = fs.readdirSync(localDirPath, { withFileTypes: true });
      try {
        await new Promise((res) => sftp.mkdir(remoteDirPath, () => res()));
      } catch (e) {}

      for (const item of items) {
        const localPath = path.join(localDirPath, item.name);
        const remotePath = `${remoteDirPath}/${item.name}`;
        if (item.isDirectory()) {
          await uploadDirRecursive(localPath, remotePath);
        } else {
          await uploadFile(localPath, remotePath);
        }
      }
    };

    (async () => {
      try {
        console.log('📤 Uploading updated client build dist/...');
        await uploadDirRecursive(clientDist, '/var/www/nordinestore/client/dist');

        console.log('📤 Uploading updated server files...');
        const serverDirs = ['controllers', 'models', 'routes', 'middlewares', 'scripts'];
        for (const dir of serverDirs) {
          const localDir = path.join(serverDir, dir);
          if (fs.existsSync(localDir)) {
            console.log(`Syncing server/${dir}...`);
            await uploadDirRecursive(localDir, `/var/www/nordinestore/server/${dir}`);
          }
        }

        // Upload index.js
        console.log('Syncing server/index.js...');
        await uploadFile(path.join(serverDir, 'index.js'), '/var/www/nordinestore/server/index.js');

        // Upload user's Excel file for server-side sync
        console.log('📤 Uploading user Excel file to VPS server/uploads...');
        try {
          await new Promise((res) => sftp.mkdir('/var/www/nordinestore/server/uploads', () => res()));
        } catch (e) {}
        await uploadFile(userExcelSource, '/var/www/nordinestore/server/uploads/Liste_des_produits_(25-11-2026_à13h30).xlsx');
        console.log('✔ Excel file uploaded to VPS.');

        console.log('🔄 Restarting backend PM2 and executing live sync on VPS...');
        const remoteCmd = 'cd /var/www/nordinestore/server && (pm2 restart nordinestore-backend || pm2 restart 0) && node scripts/run-remote-sync.js';
        conn.exec(remoteCmd, (execErr, stream) => {
          if (execErr) throw execErr;
          stream.on('data', (d) => process.stdout.write(d.toString()));
          stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
          stream.on('close', (code) => {
            console.log(`\n✔ Remote execution finished with exit code ${code}`);
            conn.end();
          });
        });
      } catch (deployErr) {
        console.error('Deploy error:', deployErr);
        conn.end();
      }
    })();
  });
});

conn.connect(vpsConfig);
