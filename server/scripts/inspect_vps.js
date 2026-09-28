import { Client } from 'ssh2';

const VPS_CONFIG = {
  host: '37.60.253.8',
  port: 22,
  username: 'root',
  password: 'lXFf4nszTgNjy0OjUYC68zVRSkCj'
};

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connection ready, checking disk space usage...');
  
  const commands = [
    'echo "=== Global Disk Usage (df -h /) ==="',
    'df -h /',
    'echo "=== Total App Directory Size (/var/www/nordinestore) ==="',
    'du -sh /var/www/nordinestore',
    'echo "=== Breakdown of App Directory ==="',
    'du -h --max-depth=1 /var/www/nordinestore',
    'echo "=== Uploads Directory Size ==="',
    'du -sh /var/www/nordinestore/server/uploads',
    'echo "=== MongoDB Data Size ==="',
    'du -sh /var/lib/mongodb || echo "MongoDB dir check skipped"'
  ].join(' && ');

  conn.exec(commands, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).on('error', (err) => {
  console.error('SSH Error:', err);
}).connect(VPS_CONFIG);
