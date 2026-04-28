import { google } from 'googleapis';
import fs from 'fs';

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

const ATENCION_DOMAINS = {
  "1": "Dominio 1. Competencias clínicas para la atención individual (MCPP)",
  "2": "Dominio 2. Competencias clínicas para grupos poblacionales y con FR",
  "3": "Dominio 3. Competencias clínicas para la atención a la familia",
  "4": "Dominio 4. Competencias en gestión clínica poblacional, APOC y promoción",
  "5": "Dominio 5. Competencias en investigación, innovación, formación y docencia"
};

async function test() {
  const spreadsheetId = '1XcOO_JCm7QJGY2TC4k3I1Y6ALQ53F5U-R_DMieHHne8'; // from logs

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });

  const spreadsheetMeta = await sheets.spreadsheets.get({ spreadsheetId });
  const existingSheetNames = (spreadsheetMeta.data.sheets || []).map(s => s.properties?.title).filter(Boolean);

  const validSheets = TARGET_SHEETS.filter(s => existingSheetNames.includes(s));
  const ranges = validSheets.map(s => `'${s}'`);

  const res = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges,
    majorDimension: 'ROWS',
  });

  const allData = {};

  res.data.valueRanges.forEach((rangeObj, sheetIndex) => {
    const sheetName = validSheets[sheetIndex];
    const rows = rangeObj.values || [];
    if (rows.length === 0) return;

    const domains = {};
    let currentDomain = null;
    let compCounter = 0;

    if (sheetName === "CURSOS") {
      // simplified
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
        if (!domains[currentDomain]) domains[currentDomain] = [];
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
        finalRotation = row[4] || ""; 
        certificateUrl = row[5] || ""; 
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
      });
    });

    if (Object.keys(domains).length > 0) {
      allData[sheetName] = domains;
    }
  });

  console.log("Success! Parsed PAPPS:", allData["Promociónprevención (PAPPS)"]);
}

test().catch(console.error);
