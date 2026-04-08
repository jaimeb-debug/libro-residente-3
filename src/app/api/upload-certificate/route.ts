import { NextResponse } from 'next/server';

// Pega aquí la misma URL que tienes en build-sheet/route.ts
const APPS_SCRIPT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwq9iUPNe8l9R54pXjggP6outoLTMAvqxWclfGfOlgX39bNjk4JkiomtTfMD_I0IJDBiQ/exec';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const spreadsheetId = formData.get('spreadsheetId') as string;

    if (!file || !spreadsheetId) {
      return NextResponse.json({ error: 'Faltan datos (archivo o spreadsheetId)' }, { status: 400 });
    }

    // 1. Preparar el archivo en base64 para enviarlo al script
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');

    // 2. Enviar a Google Apps Script
    const response = await fetch(APPS_SCRIPT_WEB_APP_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'uploadFile', // Nueva acción en el script
        fileData: base64,
        fileName: `Certificado_${file.name}`,
        mimeType: file.type,
        spreadsheetId: spreadsheetId
      }),
    });

    const result = await response.json();

    if (result.error) {
      throw new Error(result.error);
    }

    return NextResponse.json({
      success: true,
      url: result.url
    });

  } catch (error: any) {
    console.error('Error al subir certificado vía Script:', error);
    return NextResponse.json({ error: 'Error al subir vía Script', details: error.message }, { status: 500 });
  }
}
