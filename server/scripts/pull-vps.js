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
const localDbExport = path.join(rootDir, 'server/db-export');
const localUploads = path.join(rootDir, 'server/uploads');

console.log('⚡ Connecting to VPS to pull data...');

const conn = new Client();

conn.on('ready', () => {
  console.log('✔ Connected via SSH to VPS');

  // Step 1: Export VPS MongoDB to /var/www/nordinestore/server/db-export
  const remoteExportCmd = 'cd /var/www/nordinestore/server && npm run migrate -- --export';
  console.log('📦 Exporting remote MongoDB database...');
  
  conn.exec(remoteExportCmd, (err, stream) => {
    if (err) {
      console.error('Remote export command error:', err);
      conn.end();
      return;
    }

    stream.on('data', (d) => process.stdout.write(d.toString()));
    stream.stderr.on('data', (d) => process.stderr.write(d.toString()));

    stream.on('close', (code) => {
      if (code !== 0) {
        console.error(`Export failed with code ${code}`);
        conn.end();
        return;
      }

      console.log('✔ Remote export completed. Starting SFTP download...');

      conn.sftp((sftpErr, sftp) => {
        if (sftpErr) {
          console.error('SFTP error:', sftpErr);
          conn.end();
          return;
        }

        const downloadDir = (remoteDir, localDir) => {
          return new Promise((resolve, reject) => {
            if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });

            sftp.readdir(remoteDir, async (readdirErr, list) => {
              if (readdirErr) return reject(readdirErr);

              for (const item of list) {
                if (item.filename === '.' || item.filename === '..') continue;
                const rPath = `${remoteDir}/${item.filename}`;
                const lPath = path.join(localDir, item.filename);

                if (item.attrs.isDirectory()) {
                  await downloadDir(rPath, lPath);
                } else {
                  await new Promise((res, rej) => {
                    sftp.fastGet(rPath, lPath, (getErr) => {
                      if (getErr) rej(getErr);
                      else res();
                    });
                  });
                }
              }
              resolve();
            });
          });
        };

        (async () => {
          try {
            console.log('📥 Downloading db-export from VPS...');
            await downloadDir('/var/www/nordinestore/server/db-export', localDbExport);
            console.log('✔ db-export downloaded successfully!');

            console.log('📥 Downloading uploads from VPS...');
            await downloadDir('/var/www/nordinestore/server/uploads', localUploads);
            console.log('✔ uploads downloaded successfully!');

            console.log('✅ PULL COMPLETED SUCCESSFULLY!');
            conn.end();
          } catch (e) {
            console.error('Download error:', e);
            conn.end();
          }
        })();
      });
    });
  });
});

conn.connect(vpsConfig);
