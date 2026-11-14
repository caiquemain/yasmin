import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Mono, Dancing_Script, IBM_Plex_Serif } from 'next/font/google';
import { PwaRegister } from '@/components/PwaRegister';
import { UpdateToast } from '@/components/ui/UpdateToast';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { OfflineNavGuard } from '@/components/ui/OfflineNavGuard';
import './globals.css';

const sans  = IBM_Plex_Sans({  subsets:['latin'], weight:['400','500','600'], variable:'--font-plex-sans' });
const serif = Dancing_Script({ subsets:['latin'], weight:['400','500','600','700'], variable:'--font-plex-serif' });
const serifLogo = IBM_Plex_Serif({ subsets:['latin'], weight:['500','600'], variable:'--font-plex-serif-logo' });
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
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${serif.variable} ${serifLogo.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            try {
              if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark')
              } else {
                document.documentElement.classList.remove('dark')
              }
            } catch (_) {}
          `
        }} />
      </head>
      <body>
        <PwaRegister />
        <OfflineBanner />
        <OfflineNavGuard />
        <UpdateToast />
        {children}
      </body>
    </html>
  );
}
