import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Libro del Residente AFyC",
  description: "Programa Oficial de Especialidad Médica",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {/* Script de seguridad: Redirige si se intenta abrir fuera de un iframe, excepto en local */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (window.self === window.top && window.location.hostname !== "localhost") {
                window.location.href = "https://www.udz3c.es/residente.html";
              }
            `,
          }}
        />
        {children}
      </body>
    </html>
  );
}
