import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PromptLab - Generador de Prompts Profesionales',
  description: 'Transforma descripciones simples en prompts profesionales para IA',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-[#0a0a0f] font-['Outfit',sans-serif]">{children}</body>
    </html>
  );
}
