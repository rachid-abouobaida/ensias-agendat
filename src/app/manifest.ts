import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ENSIAS SDSI - Emploi du Temps',
    short_name: 'SDSI Agenda',
    description: "Emploi du temps & suivi pédagogique Master SDSI ENSIAS (Semestre 1)",
    start_url: '/',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#09090b',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
    shortcuts: [
      {
        name: 'Semaine Actuelle',
        url: '/?tab=week',
        description: 'Voir la semaine en cours',
      },
      {
        name: 'Mes Tâches',
        url: '/?tab=tasks',
        description: 'Suivi pédagogique et tâches',
      },
      {
        name: 'Édition EDT',
        url: '/?tab=edit',
        description: 'Modifier ou ajuster une séance',
      },
    ],
  };
}
