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
  password: process.env.VPS_PASSWORD || 'lXFf4nszTgNjy0OjUYC68zVRSkCj'
};

const rootDir = path.resolve(__dirname, '../../');
const clientDist = path.join(rootDir, 'client/dist');
const serverDir = path.join(rootDir, 'server');

console.log('⚡ Starting Fast Deployment to VPS...');

const conn = new Client();

conn.on('ready', () => {
  console.log('✔ Connected via SSH to VPS');
  conn.sftp((err, sftp) => {
    if (err) {
      console.error('SFTP error:', err);
      conn.end();
      return;
    }

    const uploadFile = (local, remote, checkSameSize = false) => {
      return new Promise((resolve, reject) => {
        if (checkSameSize) {
          const localStats = fs.statSync(local);
          sftp.stat(remote, (err, remoteStats) => {
            if (!err && remoteStats && remoteStats.size === localStats.size) {
              return resolve();
            }
            sftp.fastPut(local, remote, (putErr) => {
              if (putErr) reject(putErr);
              else resolve();
            });
          });
        } else {
          sftp.fastPut(local, remote, (putErr) => {
            if (putErr) reject(putErr);
            else resolve();
          });
        }
      });
    };

    const uploadDirRecursive = async (localDirPath, remoteDirPath, checkSameSize = false) => {
      const items = fs.readdirSync(localDirPath, { withFileTypes: true });
      try {
        await new Promise((res) => sftp.mkdir(remoteDirPath, () => res()));
      } catch (e) {}

      for (const item of items) {
        const localPath = path.join(localDirPath, item.name);
        const remotePath = `${remoteDirPath}/${item.name}`;
        if (item.isDirectory()) {
          await uploadDirRecursive(localPath, remotePath, checkSameSize);
        } else {
          await uploadFile(localPath, remotePath, checkSameSize);
        }
      }
    };

    (async () => {
      try {
        console.log('📤 Uploading updated client build dist/...');
        await uploadDirRecursive(clientDist, '/var/www/nordinestore/client/dist', false);

        console.log('📤 Uploading updated server files and DB export...');
        const serverDirsToSync = ['controllers', 'models', 'routes', 'middlewares', 'scripts', 'utils', 'config', 'db-export', 'uploads'];
        for (const dir of serverDirsToSync) {
          const localDir = path.join(serverDir, dir);
          if (fs.existsSync(localDir)) {
            const isUploads = dir === 'uploads';
            console.log(`Syncing server/${dir}...`);
            await uploadDirRecursive(localDir, `/var/www/nordinestore/server/${dir}`, isUploads);
          }
        }
        
        // Root server files
        const rootServerFiles = ['index.js', 'package.json', 'ecosystem.config.cjs'];
        for (const f of rootServerFiles) {
          const localF = path.join(serverDir, f);
          if (fs.existsSync(localF)) {
            await uploadFile(localF, `/var/www/nordinestore/server/${f}`);
          }
        }

        console.log('🔄 Importing database updates & Restarting PM2 process on VPS...');
        const remoteCmd = 'cd /var/www/nordinestore/server && npm run migrate -- --import && (pm2 restart nordinestore-backend || pm2 restart 0)';
        conn.exec(remoteCmd, (err, stream) => {
          if (err) throw err;
          stream.on('data', (d) => process.stdout.write(d.toString()));
          stream.on('close', () => {
            console.log('\n✅ DEPLOYMENT & DB SYNC COMPLETED SUCCESSFULLY!');
            conn.end();
          });
        });
      } catch (e) {
        console.error('Fast deploy error:', e);
        conn.end();
      }
    })();
  });
});

conn.connect(vpsConfig);
