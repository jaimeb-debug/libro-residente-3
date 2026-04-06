const { google } = require('googleapis');
const credentials = require('./credentials.json');

async function testDrive() {
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
    console.log("Intentando crear spreadsheet via Drive API...");
    const res = await drive.files.create({
      requestBody: {
        name: "Test Sheet Via Drive",
        mimeType: "application/vnd.google-apps.spreadsheet"
      }
    });
    console.log("Drive API file creation works! ID:", res.data.id);
  } catch (err) {
    console.error("DRIVE CREATION ERROR:", err.message);
  }
}

testDrive();
