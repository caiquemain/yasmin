'use client';
import { useEffect } from 'react';
import { driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

export function PageTour({
  storageKey,
  steps,
  delay = 800,
}: {
  storageKey: string;
  steps: DriveStep[];
  delay?: number;
}) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(storageKey) === 'true') return;

    // Só dispara se os elementos existirem
    const hasElements = steps.every(s => 
      s.element === 'body' || document.querySelector(s.element as string)
    );
    if (!hasElements) return;

    const timer = setTimeout(() => {
      const driverObj = driver({
        showProgress: true,
        allowClose: true,
        nextBtnText: 'Próximo',
        prevBtnText: 'Voltar',
        doneBtnText: 'Entendi',
        progressText: '{{current}} de {{total}}',
        popoverClass: 'yasmin-tour-theme',
        steps,
        onDestroyed: () => {
          localStorage.setItem(storageKey, 'true');
        },
      });
      driverObj.drive();
    }, delay);

    return () => clearTimeout(timer);
  }, [storageKey, steps, delay]);

  return null;
}
