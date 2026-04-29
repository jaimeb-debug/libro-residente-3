import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';

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
      scopes: ['https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const authClient = await auth.getClient();
    const drive = google.drive({ version: 'v3', auth: authClient as any });

    const res = await drive.files.export(
      {
        fileId: spreadsheetId,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      { responseType: 'arraybuffer' }
    );

    // Use ArrayBuffer directly since the file is < 1MB, avoiding Vercel stream issues
    const buffer = Buffer.from(res.data as ArrayBuffer);

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
