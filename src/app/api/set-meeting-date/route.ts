import { NextResponse } from 'next/server';
import { google } from 'googleapis';
// import credentials from '../../../../credentials.json';
const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS || '{}');

export async function POST(req: Request) {
  try {
    const { spreadsheetId } = await req.json();

    if (!spreadsheetId) {
      return NextResponse.json({ error: 'spreadsheetId requerido' }, { status: 400 });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const authClient = await auth.getClient() as any;
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    // 1. Verificar si la hoja CONFIG existe
    const ss = await sheets.spreadsheets.get({ spreadsheetId });
    const configSheet = ss.data.sheets?.find(s => s.properties?.title === 'CONFIG');

    if (!configSheet) {
      // Crear la hoja CONFIG
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: { title: 'CONFIG' }
              }
            }
          ]
        }
      });
      
      // Añadir cabecera
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'CONFIG!A1',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [['LAST_MEETING_DATE']] }
      });
    }

    // 2. Actualizar la fecha en B1
    const now = new Date().toISOString();
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'CONFIG!B1',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[now]] }
    });

    return NextResponse.json({ success: true, lastMeetingDate: now });

  } catch (error: any) {
    console.error('Error al establecer fecha de reunión:', error);
    return NextResponse.json({ error: 'Error al actualizar fecha de reunión', details: error.message }, { status: 500 });
  }
}
