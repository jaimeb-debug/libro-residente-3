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
      range: "'ENTREVISTAS'!A1:C30",
    });

    const rows = res.data.values || [];
    
    const entrevistas: any[] = [];
    let currentYear = '';

    rows.forEach((row, index) => {
      const rowNum = index + 1;
      const colA = (row[0] || '').toString().trim();
      const colB = (row[1] || '').toString().trim();
      const colC = (row[2] || '').toString().trim();

      if (colA && colA.includes('año')) {
        currentYear = colA;
      }

      if (colB.toLowerCase().includes('fecha tutoria') || colB.toLowerCase().includes('fecha tutoría')) {
        entrevistas.push({
          id: `entrevista_${rowNum}`,
          year: currentYear,
          title: colB,
          date: colC,
          rowNum: rowNum
        });
      }
    });

    return NextResponse.json({ entrevistas });

  } catch (error: any) {
    console.error('Error leyendo entrevistas:', error);
    return NextResponse.json({ error: 'Error al leer entrevistas', details: error.message }, { status: 500 });
  }
}
