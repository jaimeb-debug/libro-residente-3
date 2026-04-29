const { google } = require('googleapis');
const fs = require('fs');

async function testExport() {
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS || '{}');
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const authClient = await auth.getClient();
  const token = await authClient.getAccessToken();

  // You need a spreadsheet id. I'll pass it from arguments
  const spreadsheetId = process.argv[2];
  if (!spreadsheetId) {
    console.log("Provide spreadsheetId");
    return;
  }

  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token.token}`
    }
  });

  if (!res.ok) {
    console.log("Error:", res.status, await res.text());
    return;
  }

  const buffer = await res.arrayBuffer();
  fs.writeFileSync('test_export.xlsx', Buffer.from(buffer));
  console.log("Success! Saved as test_export.xlsx. Size:", buffer.byteLength);
}

require('dotenv').config({ path: '.env.local' });
testExport();
