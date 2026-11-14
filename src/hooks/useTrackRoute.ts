'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackVisitedRoute } from '@/components/ui/OfflineNavGuard';

export function useTrackRoute() {
  const pathname = usePathname();

  useEffect(() => {
    // Registra a rota sempre que navegada com sucesso (online)
    if (navigator.onLine) {
      trackVisitedRoute(pathname);
    }
  }, [pathname]);
}
