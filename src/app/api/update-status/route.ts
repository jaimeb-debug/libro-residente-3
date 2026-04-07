import { NextResponse } from 'next/server';
import { google } from 'googleapis';
// import credentials from '../../../../credentials.json';
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
        private_key: credentials.private_key,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const authClient = await auth.getClient() as any;
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    // Streamlit uses batch_update to minimize API calls:
    // updates is expected to be a list of: { range: 'SHEET!F10', values: [['EN PROGRESO']] }
    // Or we format it from the frontend similarly.

    const now = new Date().toISOString();
    const data: any[] = [];
    
    Object.keys(updates).forEach((key) => {
      // The key is now guaranteed to be in the format "SHEET_NAME::ROW_IDX"
      const [sheetName, rowIdx] = key.split('::');
      const { value, statusCol } = updates[key];
      // statusCol is integer (e.g. 6 for F, 4 for D)
      const colLetter = String.fromCharCode(64 + statusCol); 
      
      // 1. El cambio de estado solicitado
      data.push({
        range: `'${sheetName}'!${colLetter}${rowIdx}`,
        values: [[value]],
      });

      // 2. Marca de tiempo automática en columna L (12ava columna)
      data.push({
        range: `'${sheetName}'!L${rowIdx}`,
        values: [[now]],
      });
    });

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: data,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error al actualizar estado:', error);
    return NextResponse.json({ error: 'Error al actualizar', details: error.message }, { status: 500 });
  }
}
