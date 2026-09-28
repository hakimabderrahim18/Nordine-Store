import { Client } from 'ssh2';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const VPS_CONFIG = {
  host: '37.60.253.8',
  port: 22,
  username: 'root',
  password: process.env.SSH_PASSWORD || 'lXFf4nszTgNjy0OjUYC68zVRSkCj',
  readyTimeout: 45000
};

const conn = new Client();
conn.on('ready', () => {
  console.log('Connexion SSH établie.');
  conn.exec('systemctl status postfix || netstat -tulpn | grep :25 || ss -tulpn | grep :25', (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      conn.end();
    }).on('data', (data) => {
      console.log('--- VPS .env ---');
      console.log(data.toString());
      console.log('----------------');
    });
  });
}).on('error', (err) => {
  console.error('Erreur SSH:', err);
}).connect(VPS_CONFIG);
