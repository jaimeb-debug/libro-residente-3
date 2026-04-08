import { NextResponse } from 'next/server';
import { google } from 'googleapis';

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
        private_key: credentials.private_key?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const authClient = await auth.getClient() as any;
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "'ITINERARIO'!A1:E50",
    });

    const rows = res.data.values || [];
    
    const itinerarios: any[] = [];
    let currentYear = 'R1'; // default

    rows.forEach((row, index) => {
      const rowNum = index + 1;
      const colA = (row[0] || '').toString().trim();
      const colB = (row[1] || '').toString().trim();
      const colC = (row[2] || '').toString().trim();
      const colD = (row[3] || '').toString().trim();
      const colE = (row[4] || '').toString().trim();

      if (['R1', 'R2', 'R3', 'R4'].includes(colA.toUpperCase())) {
        currentYear = colA.toUpperCase();
      }

      // El encabezado está en las filas 1 y 2. Los datos reales empiezan en la fila 3 (index 2).
      // Solo parseamos a partir del index 2.
      if (index >= 2) {
        if (currentYear) {
          const isAñadir = colB.toLowerCase() === 'añadir' || colB.toLowerCase() === 'añadir ';
          
          itinerarios.push({
            id: `itin_${rowNum}`,
            year: currentYear,
            rotacion: isAñadir ? '' : colB,
            fechaInicial: colC,
            fechaFinal: colD,
            tutor: colE,
            rowNum: rowNum,
            isEmpty: !colB && !colC && !colD && !colE && !colA
          });
        }
      }
    });

    // Omitimos filas basura del final buscando si existe un disclaimer, etc.
    // Filtrar si colA o colB contienen palabras como "haz dos clic"
    const cleanItinerarios = itinerarios.filter(it => !it.rotacion.toLowerCase().includes('haz dos clic') && !it.year.toLowerCase().includes('haz dos clic'));

    return NextResponse.json({ itinerarios: cleanItinerarios });

  } catch (error: any) {
    console.error('Error leyendo itinerario:', error);
    return NextResponse.json({ error: 'Error al leer itinerario', details: error.message }, { status: 500 });
  }
}
