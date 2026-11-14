'use client';
import { useEffect } from 'react';

export function PwaRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.log('Falha ao registrar o Service Worker:', err);
      });
    }
  }, []);

  return null;
}
