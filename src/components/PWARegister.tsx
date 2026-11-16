'use client';

import { useEffect, useState } from 'react';
import { WifiOff, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWARegister() {
  const [isOffline, setIsOffline] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Service Worker registration
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('SW enregistré avec succès:', reg.scope);
          })
          .catch((err) => {
            console.warn('Échec enregistrement SW:', err);
          });
      });
    }

    // 2. Offline / Online events
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    if (typeof navigator !== 'undefined') {
      setIsOffline(!navigator.onLine);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 3. Install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Check if running in standalone mode (already installed)
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    ) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstalled(true);
    }
  };

  return (
    <>
      {/* Offline Toast Banner */}
      {isOffline && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/90 text-amber-950 font-medium text-xs shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Mode hors-ligne actif • Consultation locale</span>
        </div>
      )}

      {/* Floating PWA Install Prompt (if browser supports install and not yet installed) */}
      {deferredPrompt && !isInstalled && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 z-40 animate-in fade-in slide-in-from-bottom-3">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs shadow-xl shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
            title="Installer l'application sur votre écran d'accueil"
          >
            <Download className="w-4 h-4" />
            <span>Installer l&apos;App SDSI</span>
          </button>
        </div>
      )}
    </>
  );
}
