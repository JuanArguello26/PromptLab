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
      <body className="min-h-screen bg-[#0a0a0f]">{children}</body>
    </html>
  );
}
