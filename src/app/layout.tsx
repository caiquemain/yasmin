import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Mono, Dancing_Script } from 'next/font/google';
import './globals.css';

const sans  = IBM_Plex_Sans({  subsets:['latin'], weight:['400','500','600'], variable:'--font-plex-sans' });
const serif = Dancing_Script({ subsets:['latin'], weight:['400','500','600','700'], variable:'--font-plex-serif' });
const mono  = IBM_Plex_Mono({  subsets:['latin'], weight:['400','500'], variable:'--font-plex-mono' });

export const metadata: Metadata = {
  title: 'Yasmin',
  description: 'Organização pessoal e gestão de obras',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Yasmin' },
};

export const viewport: Viewport = {
  themeColor: '#C85A7E',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
