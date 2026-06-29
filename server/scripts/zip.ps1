$ErrorActionPreference = "Stop"

# Définir le chemin temporaire
$tempDir = Join-Path $env:TEMP "nordinestore-deploy"
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir > $null

# Copier le client (sans node_modules et dist)
Copy-Item -Path "../client" -Destination (Join-Path $tempDir "client") -Recurse -Exclude "node_modules", "dist"

# Copier le serveur (sans node_modules)
Copy-Item -Path "../server" -Destination (Join-Path $tempDir "server") -Recurse -Exclude "node_modules", "nordinestore.zip"

# Copier les fichiers à la racine
Copy-Item -Path "../nordinestore.nginx.conf" -Destination $tempDir
Copy-Item -Path "../vps-setup.sh" -Destination $tempDir

# Zipper le dossier temporaire dans le dossier server
Compress-Archive -Path "$tempDir\*" -DestinationPath "nordinestore.zip" -Force

# Nettoyage
Remove-Item $tempDir -Recurse -Force
echo "Archive nordinestore.zip créée avec succès."
