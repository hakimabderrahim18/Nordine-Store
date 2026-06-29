#!/bin/bash
# Script d'installation automatique pour Contabo VPS Ubuntu (MERN Stack)
# A exécuter en tant que root sur le serveur

# Stopper le script en cas d'erreur
set -e

echo "==========================================="
echo " Début de l'installation du NordineStore   "
echo "==========================================="

# 1. Mise à jour du système
echo "Mise à jour du système..."
apt-get update && apt-get upgrade -y
apt-get install -y curl gnupg build-essential git software-properties-common

# 2. Installation de Node.js (LTS version 20)
echo "Installation de Node.js v20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
echo "Version de Node.js : $(node -v)"
echo "Version de NPM : $(npm -v)"

# 3. Installation de PM2 (Gestionnaire de processus Node.js)
echo "Installation de PM2..."
npm install -g pm2

# 4. Installation de MongoDB (Version 7.0 Community)
echo "Installation de MongoDB 7.0..."
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list

apt-get update
apt-get install -y mongodb-org

# Démarrer et activer MongoDB
systemctl start mongod
systemctl enable mongod
echo "Statut de MongoDB : $(systemctl is-active mongod)"

# 5. Installation de Nginx
echo "Installation de Nginx..."
apt-get install -y nginx

# Créer les répertoires de l'application
mkdir -p /var/www/nordinestore
mkdir -p /var/www/nordinestore/server/uploads
chown -R www-data:www-data /var/www/nordinestore

# 6. Configuration de Nginx
echo "Configuration de Nginx..."
cp /tmp/nordinestore.nginx.conf /etc/nginx/sites-available/nordinestore
ln -sf /etc/nginx/sites-available/nordinestore /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default || true

# Tester et recharger Nginx
nginx -t
systemctl restart nginx

# 7. Configuration du Pare-feu (UFW)
echo "Configuration du pare-feu..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
echo "y" | ufw enable
ufw status

echo "==========================================="
echo " Installation des prérequis terminée !     "
echo "==========================================="
