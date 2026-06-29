import { Client } from 'ssh2';

const VPS_CONFIG = {
  host: '37.60.253.8',
  port: 22,
  username: 'root',
  password: 'lXFf4nszTgNjy0OjUYC68zVRSkCj'
};

const conn = new Client();
conn.on('ready', () => {
  console.log('Connexion SSH établie pour appliquer le correctif...');
  
  const commands = [
    'echo "1. Mise à jour des variables d\'environnement..."',
    `sed -i "s|CLIENT_URL=.*|CLIENT_URL=http://${VPS_CONFIG.host}|g" /var/www/nordinestore/server/.env`,
    'sed -i "s|NODE_ENV=.*|NODE_ENV=production|g" /var/www/nordinestore/server/.env',
    'echo "2. Redémarrage du backend PM2..."',
    'pm2 restart nordinestore-backend',
    'echo "3. Re-compilation du client React avec le bon proxy API..."',
    'cd /var/www/nordinestore/client && VITE_API_URL=/api npm run build',
    'echo "4. Redémarrage de Nginx..."',
    'sudo systemctl restart nginx',
    'echo "CORRECTIF APPLIQUÉ AVEC SUCCÈS !"'
  ].join(' && ');

  conn.exec(commands, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      conn.end();
      console.log('Déconnexion.');
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).on('error', (err) => {
  console.error('Erreur SSH:', err);
}).connect(VPS_CONFIG);
