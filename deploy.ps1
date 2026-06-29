# Script de Déploiement Automatisé pour NordineStore
# À exécuter sous PowerShell en local sur votre machine

param (
    [string]$vpsIP = "VOTRE_IP_VPS",
    [string]$vpsUser = "root"
)

# Stopper le script en cas d'erreur
$ErrorActionPreference = "Stop"

echo "=========================================================="
echo "  Début du Déploiement NordineStore sur VPS Contabo       "
echo "=========================================================="

if ($vpsIP -eq "VOTRE_IP_VPS") {
    $vpsIP = Read-Host "Entrez l'adresse IP de votre VPS Contabo"
}

# 1. Exportation de la base de données locale
echo "1. Exportation des données MongoDB locales..."
Set-Location -Path "$PSScriptRoot\server"
npm run migrate -- --export
Set-Location -Path $PSScriptRoot

# 2. Création de l'archive du projet (sans les dossiers lourds)
echo "2. Préparation de l'archive du projet..."
$archiveName = "nordinestore.zip"
$tempArchive = Join-Path -Path $env:TEMP -ChildPath $archiveName

if (Test-Path $tempArchive) {
    Remove-Item $tempArchive -Force
}

# Créer un dossier temporaire pour exclure node_modules et builds locaux
$tempBuildDir = Join-Path -Path $env:TEMP -ChildPath "nordinestore-deploy"
if (Test-Path $tempBuildDir) {
    Remove-Item $tempBuildDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempBuildDir > $null

# Copier uniquement les fichiers nécessaires
Copy-Item -Path "$PSScriptRoot\client" -Destination (Join-Path $tempBuildDir "client") -Recurse -Exclude "node_modules", "dist"
Copy-Item -Path "$PSScriptRoot\server" -Destination (Join-Path $tempBuildDir "server") -Recurse -Exclude "node_modules", "db-export"
# Recopier les données exportées de la base de données dans l'archive
Copy-Item -Path "$PSScriptRoot\server\db-export" -Destination (Join-Path $tempBuildDir "server\db-export") -Recurse

Copy-Item -Path "$PSScriptRoot\nordinestore.nginx.conf" -Destination $tempBuildDir
Copy-Item -Path "$PSScriptRoot\vps-setup.sh" -Destination $tempBuildDir

# Zipper le dossier temporaire
Compress-Archive -Path "$tempBuildDir\*" -DestinationPath $tempArchive
Remove-Item $tempBuildDir -Recurse -Force

echo "Archive créée avec succès dans les fichiers temporaires."

# 3. Copier les fichiers sur le VPS
echo "3. Copie de l'archive et de la configuration sur le VPS..."
echo "NOTE: Saisissez le mot de passe du VPS si demandé (mot de passe Contabo)."
scp $tempArchive "${vpsUser}@${vpsIP}:/tmp/${archiveName}"
scp "$PSScriptRoot\nordinestore.nginx.conf" "${vpsUser}@${vpsIP}:/tmp/nordinestore.nginx.conf"
scp "$PSScriptRoot\vps-setup.sh" "${vpsUser}@${vpsIP}:/tmp/vps-setup.sh"

Remove-Item $tempArchive -Force

# 4. Exécuter l'installation sur le VPS
echo "4. Exécution du script d'installation et de restauration sur le VPS..."
$sshCommands = @(
    "chmod +x /tmp/vps-setup.sh",
    "sudo /tmp/vps-setup.sh",
    "echo 'Extraction du projet...'",
    "sudo unzip -o /tmp/nordinestore.zip -d /var/www/nordinestore",
    "echo 'Installation des dépendances Server...'",
    "cd /var/www/nordinestore/server",
    "npm install --omit=dev",
    "echo 'Restauration de la base de données...'",
    "npm run migrate -- --import",
    "echo 'Démarrage du Backend avec PM2...'",
    "pm2 start ecosystem.config.cjs --env production || pm2 restart nordinestore-backend",
    "pm2 save",
    "pm2 startup",
    "echo 'Installation des dépendances Client & Build...'",
    "cd /var/www/nordinestore/client",
    "npm install",
    "npm run build",
    "echo 'Nettoyage des fichiers temporaires...'",
    "rm -f /tmp/nordinestore.zip /tmp/nordinestore.nginx.conf /tmp/vps-setup.sh",
    "echo 'Déploiement terminé avec succès !'"
) -join " && "

ssh "${vpsUser}@${vpsIP}" $sshCommands

echo ""
echo "=========================================================="
echo "  Déploiement Terminé !"
echo "  Votre application est disponible sur : http://${vpsIP}/"
echo "=========================================================="
