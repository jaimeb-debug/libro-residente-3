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

    // Read all data from DATOS sheet
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "'DATOS'!A1:B50",
    });

    const rows = res.data.values || [];

    // Parse the structured data dynamically to avoid misalignments
    const datos = {
      unidadDocente: { nombre: '', ccaa: '', anioInicio: '', anioFinal: '', email: '' },
      residente: { nombre: '', apellido1: '', apellido2: '', email: '' },
      tutor: { nombre: '', apellido1: '', apellido2: '', email: '' },
    };
    
    const rowMapping = {
      unidadDocente: {} as any,
      residente: {} as any,
      tutor: {} as any,
    };

    let currentSection = '';

    const defaults: any = {
      unidadDocente: {
        nombre: 'UDMAFYC sector Zaragoza-III',
        ccaa: 'Aragón',
        anioInicio: '2025',
        anioFinal: '2029',
        email: 'udoc3@salud.aragon.es'
      }
    };

    rows.forEach((row, index) => {
      const rowNum = index + 1;
      const label = (row[0] || '').toString().trim().toUpperCase();
      let value = row[1] || '';

      if (label.includes('UNIDAD DOCENTE')) currentSection = 'unidadDocente';
      else if (label === 'RESIDENTE') currentSection = 'residente';
      else if (label === 'TUTOR') currentSection = 'tutor';
      else if (currentSection && label) {
        if (label === 'NOMBRE:' || label === 'NOMBRE') {
          if (!value && defaults[currentSection]?.nombre) value = defaults[currentSection].nombre;
          (datos as any)[currentSection].nombre = value;
          rowMapping[currentSection as keyof typeof rowMapping].nombre = rowNum;
        } else if (label === 'CCAA:') {
          if (!value && defaults[currentSection]?.ccaa) value = defaults[currentSection].ccaa;
          (datos as any)[currentSection].ccaa = value;
          rowMapping[currentSection as keyof typeof rowMapping].ccaa = rowNum;
        } else if (label.includes('INICIO')) {
          if (!value && defaults[currentSection]?.anioInicio) value = defaults[currentSection].anioInicio;
          (datos as any)[currentSection].anioInicio = value;
          rowMapping[currentSection as keyof typeof rowMapping].anioInicio = rowNum;
        } else if (label.includes('FINAL')) {
          if (!value && defaults[currentSection]?.anioFinal) value = defaults[currentSection].anioFinal;
          (datos as any)[currentSection].anioFinal = value;
          rowMapping[currentSection as keyof typeof rowMapping].anioFinal = rowNum;
        } else if (label === 'EMAIL:' || label === 'EMAIL') {
          if (!value && defaults[currentSection]?.email) value = defaults[currentSection].email;
          (datos as any)[currentSection].email = value;
          rowMapping[currentSection as keyof typeof rowMapping].email = rowNum;
        } else if (label.includes('APELLIDO 1')) {
          (datos as any)[currentSection].apellido1 = value;
          rowMapping[currentSection as keyof typeof rowMapping].apellido1 = rowNum;
        } else if (label.includes('APELLIDO 2')) {
          (datos as any)[currentSection].apellido2 = value;
          rowMapping[currentSection as keyof typeof rowMapping].apellido2 = rowNum;
        }
      }
    });

    return NextResponse.json({ datos, rowMapping });

  } catch (error: any) {
    console.error('Error leyendo datos:', error);
    return NextResponse.json({ error: 'Error al leer datos', details: error.message }, { status: 500 });
  }
}
