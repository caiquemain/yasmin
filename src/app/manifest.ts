import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Yasmin - Gestão de Obras',
    short_name: 'Yasmin',
    description: 'Organização pessoal e gestão de projetos estruturais',
    start_url: '/',
    display: 'standalone',
    background_color: '#FDF6F8',
    theme_color: '#C85A7E',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
