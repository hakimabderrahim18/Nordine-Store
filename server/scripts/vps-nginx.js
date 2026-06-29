import { Client } from 'ssh2';

const VPS_CONFIG = {
  host: '37.60.253.8',
  port: 22,
  username: 'root',
  password: 'lXFf4nszTgNjy0OjUYC68zVRSkCj'
};

const conn = new Client();
conn.on('ready', () => {
  console.log('Connexion SSH établie...');
  conn.exec('cat /etc/nginx/sites-available/nordinestore || cat /etc/nginx/sites-available/default', (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).connect(VPS_CONFIG);
