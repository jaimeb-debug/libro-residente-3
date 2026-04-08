import { NextResponse } from 'next/server';
import { google } from 'googleapis';

const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS || '{}');

export async function POST(req: Request) {
  try {
    const { spreadsheetId, datos, rowMapping } = await req.json();

    if (!spreadsheetId || !datos || !rowMapping) {
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

    // Build the dynamic update array using rowMapping
    const data: any[] = [];
    
    // Helper to safely format updates
    const pushUpdate = (section: string, field: string) => {
      const rowNum = rowMapping[section]?.[field];
      const value = datos[section]?.[field];
      if (rowNum !== undefined && value !== undefined) {
        data.push({ range: `'DATOS'!B${rowNum}`, values: [[value]] });
      }
    };

    pushUpdate('unidadDocente', 'nombre');
    pushUpdate('unidadDocente', 'ccaa');
    pushUpdate('unidadDocente', 'anioInicio');
    pushUpdate('unidadDocente', 'anioFinal');
    pushUpdate('unidadDocente', 'email');
    
    pushUpdate('residente', 'nombre');
    pushUpdate('residente', 'apellido1');
    pushUpdate('residente', 'apellido2');
    pushUpdate('residente', 'email');
    
    pushUpdate('tutor', 'nombre');
    pushUpdate('tutor', 'apellido1');
    pushUpdate('tutor', 'apellido2');
    pushUpdate('tutor', 'email');

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data,
      },
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error guardando datos:', error);
    return NextResponse.json({ error: 'Error al guardar datos', details: error.message }, { status: 500 });
  }
}
