'use client';
import { useEffect, useState } from 'react';

export function SplashScreen() {
  const [show, setShow] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Só mostra uma vez por sessão
    if (sessionStorage.getItem('yasmin_splash_shown')) {
      setShow(false);
      return;
    }

    const fadeTimer = setTimeout(() => setFading(true), 1300);
    const hideTimer = setTimeout(() => {
      setShow(false);
      sessionStorage.setItem('yasmin_splash_shown', 'true');
    }, 1900);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-bg dark:bg-dark-bg flex flex-col items-center justify-center transition-opacity duration-700 ${fading ? 'opacity-0' : 'opacity-100'}`}
      style={{ pointerEvents: fading ? 'none' : 'auto' }}
    >
      <div className="flex flex-col items-center gap-4">
        <h1 className="font-logo text-6xl md:text-7xl text-petrol-deep dark:text-petrol animate-splash-logo leading-none">
          Yasmin<span className="text-terra">.</span>
        </h1>
        <p className="font-mono text-2xs uppercase tracking-[0.35em] text-ink-soft dark:text-dark-inkSoft animate-splash-subtitle">
          Caderno Técnico Digital
        </p>
        <div className="mt-10 w-40 h-[2px] bg-line dark:bg-dark-line overflow-hidden relative">
          <div className="absolute inset-y-0 left-0 bg-petrol animate-splash-bar" />
        </div>
      </div>
    </div>
  );
}
