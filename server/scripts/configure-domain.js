import { Client } from 'ssh2';

const VPS_CONFIG = {
  host: '37.60.253.8',
  port: 22,
  username: 'root',
  password: 'lXFf4nszTgNjy0OjUYC68zVRSkCj'
};

const DOMAIN = 'nounoutelecom.com';
const WWW_DOMAIN = 'www.nounoutelecom.com';

const conn = new Client();
conn.on('ready', () => {
  console.log('Connexion SSH établie pour configuration du nom de domaine...');
  
  const commands = [
    'echo "1. Mise à jour de la configuration Nginx..."',
    `sed -i "s|server_name _;|server_name ${DOMAIN} ${WWW_DOMAIN};|g" /etc/nginx/sites-available/nordinestore`,
    'nginx -t',
    'systemctl reload nginx',
    
    'echo "2. Vérification de la résolution DNS..."',
    `getent hosts ${DOMAIN} || echo "${DOMAIN} unresolved"`,
    `getent hosts ${WWW_DOMAIN} || echo "${WWW_DOMAIN} unresolved"`,
    
    'echo "3. Installation de Certbot..."',
    'apt-get update',
    'apt-get install -y certbot python3-certbot-nginx',
    
    'echo "4. Génération du certificat SSL Let\'s Encrypt..."',
    // On vérifie si les résolutions DNS fonctionnent pour choisir les domaines à certifier
    `if ping -c 1 -W 2 ${DOMAIN} > /dev/null 2>&1; then
      if ping -c 1 -W 2 ${WWW_DOMAIN} > /dev/null 2>&1; then
        echo "Génération de SSL pour ${DOMAIN} et ${WWW_DOMAIN}..."
        certbot --nginx -d ${DOMAIN} -d ${WWW_DOMAIN} --non-interactive --agree-tos --email admin@${DOMAIN} --redirect
      else
        echo "Génération de SSL pour ${DOMAIN} uniquement (www non propagé)..."
        certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos --email admin@${DOMAIN} --redirect
      fi
     else
      echo "Erreur: Les domaines ne pointent pas encore vers ce serveur. Veuillez patienter pour la propagation DNS."
     fi`,
     
     'echo "5. Mise à jour des variables d\'environnement client pour pointer vers le nouveau domaine..."',
     `sed -i "s|CLIENT_URL=.*|CLIENT_URL=https://${DOMAIN}|g" /var/www/nordinestore/server/.env`,
     'pm2 restart nordinestore-backend --update-env',
     
     'echo "Vérification finale du statut PM2 et Nginx..."',
     'pm2 status',
     'systemctl status nginx --no-pager'
  ].join(' && ');

  conn.exec(commands, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      conn.end();
      console.log('Opération terminée.');
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).on('error', (err) => {
  console.error('Erreur SSH:', err);
}).connect(VPS_CONFIG);
