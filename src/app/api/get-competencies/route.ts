import { NextResponse } from 'next/server';
import { google } from 'googleapis';
// import credentials from '../../../../credentials.json';
const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS || '{}');


const TARGET_SHEETS = [
  "TRANSVERSALES",
  "ATENCIÓN PERSONA-PERSONAS",
  "HABILIDADES",
  "Promociónprevención (PAPPS)",
  "FAMILIAR",
  "GESTION CLINICA",
  "COMUNITARIA",
  "INVESTIGACIONINNOVACION",
  "CURSOS",
  "DOCENCIA",
  "SESIONES OBLIGATORIAS",
  "SESIONES IMPARTIDAS",
  "OTROS CURSOS",
  "CONFIG"
];

const ATENCION_DOMAINS: Record<string, string> = {
  "1": "Dominio 1. Competencias clínicas para la atención individual (MCPP)",
  "2": "Dominio 2. Competencias clínicas para grupos poblacionales y con FR",
  "3": "Dominio 3. Competencias clínicas para la atención a la familia",
  "4": "Dominio 4. Competencias en gestión clínica poblacional, APOC y promoción",
  "5": "Dominio 5. Competencias en investigación, innovación, formación y docencia"
};

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

    // 1. Primero consultar qué hojas existen realmente para no dar error 400 (Bad Request)
    const spreadsheetMeta = await sheets.spreadsheets.get({ spreadsheetId });
    const existingSheetNames = (spreadsheetMeta.data.sheets || []).map(s => s.properties?.title).filter(Boolean);

    // 2. Filtrar TARGET_SHEETS para pedir solo las que existan
    const validSheets = TARGET_SHEETS.filter(s => existingSheetNames.includes(s));
    const ranges = validSheets.map(s => `'${s}'`);

    const res = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges,
      majorDimension: 'ROWS',
    });

    if (!res.data.valueRanges) {
      return NextResponse.json({ error: 'No se encontraron datos' }, { status: 404 });
    }

    const allData: any = {};

    res.data.valueRanges.forEach((rangeObj, sheetIndex) => {
      const sheetName = validSheets[sheetIndex];
      const rows = rangeObj.values || [];
      if (rows.length === 0) return;

      const domains: any = {};
      let currentDomain: string | null = null;
      let compCounter = 0;

      if (sheetName === "CURSOS") {
        domains["Cursos y Formación"] = [];
        rows.forEach((row, i) => {
          const rowIdx = i + 1;
          const a = (row[0] || '').trim();
          const d = (row[3] || '').trim();

          if (!a || a.includes("Actividades formativas")) return;

          compCounter++;
          domains["Cursos y Formación"].push({
            rowIdx,
            number: compCounter,
            competencia: a,
            actividad: "",
            recomendaciones: "",
            situacion: d,
            lastModified: row[11] || null, // Col L
            statusCol: 4
          });
        });
        if (domains["Cursos y Formación"].length > 0) {
          allData[sheetName] = domains;
        }
        return;
      }

      rows.forEach((row, i) => {
        const rowIdx = i + 1;
        if (row.length < 2) return;

        const a = (row[0] || '').trim();
        const b = (row[1] || '').trim();
        const c = (row[2] || '').trim();
        const d = (row[3] || '').trim();
        const f = (row[5] || '').trim();
        const j = (row[9] || '').trim();

        let isDomain = false;

        if (sheetName === "TRANSVERSALES") {
          isDomain = a.includes("Dominio") && !b;
          if (isDomain) currentDomain = a;
        } else if (sheetName === "ATENCIÓN PERSONA-PERSONAS") {
          if (a && ATENCION_DOMAINS[a[0]]) {
            currentDomain = ATENCION_DOMAINS[a[0]];
          }
          isDomain = false;
        } else {
          isDomain = Boolean(a) && !b && isNaN(Number(a.replace(/\./g, ''))) && a.length > 3;
          if (isDomain) currentDomain = a;
        }

        if (isDomain) {
          if (!domains[currentDomain as string]) domains[currentDomain as string] = [];
          compCounter = 0;
          return;
        }

        if (!currentDomain && b && !["COMPETENCIAS ESPECÍFICAS", "COMPETENCIAS TRANSVERSALES", "COMPETENCIAS", "COMPETENCIAS "].includes(b.toUpperCase())) {
          if (sheetName === "ATENCIÓN PERSONA-PERSONAS") {
            currentDomain = ATENCION_DOMAINS["1"];
          } else {
            currentDomain = "Competencias Generales";
          }
        }

        if (currentDomain && !domains[currentDomain]) {
          domains[currentDomain] = [];
        }

        if (!currentDomain) return;
        if (["N.º", "Nº", "DOMINIO"].includes(a) || b.toUpperCase().includes("COMPETENCIAS")) return;

        const cValue = (c.toLowerCase() !== "none") ? c : "";
        const isCompetencySheet = !["SESIONES OBLIGATORIAS", "SESIONES IMPARTIDAS", "OTROS CURSOS", "CURSOS", "CONFIG"].includes(sheetName);

        if (isCompetencySheet) {
          if (!b && !cValue) return;
          if (a && a.length > 20 && !b && !cValue) return;
        } else {
          if (!b) return;
          if (a && a.length > 20 && !b) return;
        }

        compCounter++;
        
        let finalRotation = (j.toLowerCase() !== "none") ? j : "";
        let certificateUrl = "";
        
        if (sheetName === "OTROS CURSOS") {
          // Mapeo: A: Nº, B: Título, C: Fecha, D: Lugar, E: Organizador, F: Certificado
          finalRotation = row[4] || ""; // Col E
          certificateUrl = row[5] || ""; // Col F
        }

        let displayCompetencia = b;
        let displayActividad = cValue;

        if (isCompetencySheet && !b && cValue) {
          displayCompetencia = "↳ " + cValue;
          displayActividad = "";
        }

        domains[currentDomain].push({
          rowIdx,
          number: compCounter,
          competencia: displayCompetencia,
          actividad: displayActividad,
          recomendaciones: (d.toLowerCase() !== "none") ? d : "",
          situacion: (f.toLowerCase() !== "none") ? f : "",
          rotacion: finalRotation,
          certificateUrl: certificateUrl,
          lastModified: row[11] || null, // Col L
          statusCol: 6
        });
      });

      if (Object.keys(domains).length > 0) {
        allData[sheetName] = domains;
      }
    });

    // 3. Extraer Last Meeting Date de la hoja CONFIG
    let lastMeetingDate = null;
    const configRange = res.data.valueRanges.find((rv, idx) => validSheets[idx] === "CONFIG");
    if (configRange && configRange.values && configRange.values[0]) {
      lastMeetingDate = configRange.values[0][1] || null; // B1
    }

    return NextResponse.json({ ...allData, lastMeetingDate });

  } catch (error: any) {
    console.error('Error procesando hojas:', error);
    return NextResponse.json({ error: 'Error al leer', details: error.message }, { status: 500 });
  }
}
