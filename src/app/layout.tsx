import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: 'PromptLab - Generador Profesional de Prompts para IA',
  description: 'Transforma descripciones simples en prompts profesionales para inteligencia artificial. Groq, OpenAI, Anthropic.',
  keywords: 'IA, AI, prompts, generator, groq, openai, anthropic, chatgpt, claude',
  authors: [{ name: 'Masta Dev' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.png',
    apple: '/icon-192.png',
  },
  openGraph: {
    title: 'PromptLab - Genera Prompts Profesionales para IA',
    description: 'Transforma descripciones simples en prompts profesionales para inteligencia artificial',
    url: 'https://promptlab.vercel.app',
    siteName: 'PromptLab',
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PromptLab',
    description: 'Generador profesional de prompts para IA',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={outfit.variable}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#06b6d4" />
      </head>
      <body className="min-h-screen bg-[#0a0a0f] font-['Outfit',sans-serif]">{children}</body>
    </html>
  );
}