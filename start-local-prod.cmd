set NODE_ENV=production
rem set NGIVR_SILENT=1
set NGIVR_LOCAL=1
set NGIVR_CLUSTER=1

set TZ=Europe/Budapest
set NGIVR_WORKERS=1
node --inspect server\app.js
