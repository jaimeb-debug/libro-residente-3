import { NextResponse } from 'next/server';
import { google } from 'googleapis';

const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS || '{}');

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const spreadsheetId = searchParams.get('id');

    if (!spreadsheetId) {
      return NextResponse.json({ error: 'Falta spreadsheetId' }, { status: 400 });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const authClient = await auth.getClient() as any;
    const token = await authClient.getAccessToken();

    const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx`;
    
    const res = await fetch(exportUrl, {
      headers: {
        Authorization: `Bearer ${token.token}`
      }
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Google Sheets retornó estado: ${res.status}. ${errorText}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Libro_Residente_Export.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('Error descargando Excel:', error);
    return new NextResponse(`Error descargando archivo: ${error.message}`, { status: 500 });
  }
}
