$ErrorActionPreference = "Stop"

$tempDir = Join-Path $env:TEMP "nordinestore-deploy"
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir > $null

# Copier client sans node_modules et dist
Copy-Item -Path "../client" -Destination (Join-Path $tempDir "client") -Recurse -Exclude "node_modules", "dist"

# Copier server sans node_modules et sans l'archive elle-même
Copy-Item -Path "../server" -Destination (Join-Path $tempDir "server") -Recurse -Exclude "node_modules", "nordinestore.zip", "nordinestore.tar.gz"

# Copier les fichiers racines
Copy-Item -Path "../nordinestore.nginx.conf" -Destination $tempDir
Copy-Item -Path "../vps-setup.sh" -Destination $tempDir

# Exécuter tar dans le dossier temporaire
$prevLocation = Get-Location
Set-Location -Path $tempDir
tar -czf "$PSScriptRoot\nordinestore.tar.gz" *
Set-Location -Path $prevLocation

# Nettoyer le dossier temporaire
Remove-Item $tempDir -Recurse -Force
echo "Archive nordinestore.tar.gz créée avec succès."
