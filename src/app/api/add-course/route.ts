import { NextResponse } from 'next/server';
import { google } from 'googleapis';

// 1. ELIMINAMOS la importación de credentials.json que causaba el error

export async function POST(req: Request) {
  try {
    const { spreadsheetId, titulo, fecha, lugar, organizador, certificadoUrl } = await req.json();

    if (!spreadsheetId || !titulo) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    // 2. LEEMOS las credenciales desde la variable de entorno
    // Usamos JSON.parse para convertir el texto en un objeto de JavaScript
    const credentialsEnv = JSON.parse(process.env.GOOGLE_CREDENTIALS || '{}');

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: credentialsEnv.client_email,
        // Reemplazamos los posibles saltos de línea mal formateados en la clave privada
        private_key: credentialsEnv.private_key?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const authClient = await auth.getClient() as any;
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    // 1. Determinar Nº
    const getRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "'OTROS CURSOS'!A:A",
    });

    const rows = getRes.data.values || [];
    const nextNumber = rows.length;
    const now = new Date().toISOString();

    // 2. Append (A: Nº, B: Título, C: Fecha, D: Lugar, E: Organiza, F: Certificado, ..., L: Timestamp)
    const resource = {
      values: [[nextNumber, titulo, fecha, lugar, organizador, certificadoUrl || "", "", "", "", "", "", now]],
    };

    const appendRes = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "'OTROS CURSOS'!A1",
      valueInputOption: 'USER_ENTERED',
      requestBody: resource,
    });

    return NextResponse.json({ success: true, updatedRange: appendRes.data.updates?.updatedRange });

  } catch (error: any) {
    console.error('Error añadiendo curso:', error);
    return NextResponse.json({ error: 'Error al añadir curso', details: error.message }, { status: 500 });
  }
}