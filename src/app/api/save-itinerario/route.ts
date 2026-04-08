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
    
    // updates should be an array of:
    // { rowNum: number, rotacion: string, fechaInicial: string, fechaFinal: string, tutor: string }
    updates.forEach((update: any) => {
      // Restore "Añadir" keyword so it looks nice if they clear it (optional, but empty is usually fine too)
      const rotacionVal = update.rotacion.trim() === '' ? 'Añadir' : update.rotacion;
      
      data.push({ range: `'ITINERARIO'!B${update.rowNum}`, values: [[rotacionVal]] });
      data.push({ range: `'ITINERARIO'!C${update.rowNum}`, values: [[update.fechaInicial]] });
      data.push({ range: `'ITINERARIO'!D${update.rowNum}`, values: [[update.fechaFinal]] });
      data.push({ range: `'ITINERARIO'!E${update.rowNum}`, values: [[update.tutor]] });
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
    console.error('Error guardando itinerario:', error);
    return NextResponse.json({ error: 'Error al guardar itinerario', details: error.message }, { status: 500 });
  }
}
