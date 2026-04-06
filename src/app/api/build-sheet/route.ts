import { NextResponse } from 'next/server';

// Pega aquí la URL que te dará Google Apps Script al final del paso 2.
const APPS_SCRIPT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwq9iUPNe8l9R54pXjggP6outoLTMAvqxWclfGfOlgX39bNjk4JkiomtTfMD_I0IJDBiQ/exec';

export async function POST(req: Request) {
  try {
    const { name } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
    }

    // @ts-ignore
    if (APPS_SCRIPT_WEB_APP_URL === 'PÉGALA_AQUÍ') {
      return NextResponse.json({
        error: 'Falta configurar la URL de Apps Script en route.ts'
      }, { status: 500 });
    }

    console.log("Pidiendo a Google Apps Script que cree el Excel para:", name);

    const response = await fetch(APPS_SCRIPT_WEB_APP_URL, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });

    const result = await response.json();

    if (result.error) {
      throw new Error(result.error);
    }

    console.log("Excel creado por Apps Script:", result.spreadsheetUrl);

    return NextResponse.json({
      success: true,
      spreadsheetId: result.spreadsheetId,
      spreadsheetUrl: result.spreadsheetUrl,
    });
  } catch (error: any) {
    console.error('Error en proceso global:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud', details: error.message },
      { status: 500 }
    );
  }
}
