import type { Metadata } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Serif, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const sans  = IBM_Plex_Sans({  subsets:['latin'], weight:['400','500','600'], variable:'--font-plex-sans' });
const serif = IBM_Plex_Serif({ subsets:['latin'], weight:['500','600'], variable:'--font-plex-serif' });
const mono  = IBM_Plex_Mono({  subsets:['latin'], weight:['400','500'], variable:'--font-plex-mono' });

export const metadata: Metadata = {
  title: 'Yasmin',
  description: 'Organização pessoal e gestão de obras',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
