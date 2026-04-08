import { NextResponse } from 'next/server';
import { google } from 'googleapis';

const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS || '{}');

export async function POST(req: Request) {
  try {
    const { spreadsheetId, updates } = await req.json();

    if (!spreadsheetId || !updates) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const authClient = await auth.getClient() as any;
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    const data: any[] = [];
    
    // updates should be an array of: { rowNum: number, date: string }
    updates.forEach((update: any) => {
      data.push({
        range: `'ENTREVISTAS'!C${update.rowNum}`,
        values: [[update.date]]
      });
    });

    if (data.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: 'USER_ENTERED',
          data,
        },
      });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error guardando entrevistas:', error);
    return NextResponse.json({ error: 'Error al guardar entrevistas', details: error.message }, { status: 500 });
  }
}
