const { google } = require('googleapis');
const credentials = require('./credentials.json');

async function cleanupDrive() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  const authClient = await auth.getClient();
  const drive = google.drive({ version: 'v3', auth: authClient });

  try {
    let pageToken = null;
    let deletedCount = 0;
    console.log("Iniciando borrado de archivos en el Service Account Drive...");
    do {
      const res = await drive.files.list({
        pageSize: 100,
        fields: 'nextPageToken, files(id, name)',
        pageToken: pageToken,
      });

      const files = res.data.files;
      if (files && files.length > 0) {
        for (const file of files) {
          try {
            await drive.files.delete({ fileId: file.id });
            console.log(`Borrado: ${file.name} (${file.id})`);
            deletedCount++;
          } catch (deleteErr) {
            console.error(`Fallo al borrar ${file.name}:`, deleteErr.message);
          }
        }
      } else {
        console.log('No se encontraron más archivos.');
      }
      pageToken = res.data.nextPageToken;
    } while (pageToken);

    console.log(`\n¡Limpieza completada! Se borraron ${deletedCount} archivos.`);
  } catch (err) {
    console.error("ERROR DE DRIVE:", err.message);
  }
}

cleanupDrive();
