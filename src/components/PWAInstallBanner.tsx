import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowBanner(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    // We've used the prompt, and can't use it again
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:bottom-6 md:right-6 md:left-auto md:w-96 bg-beyblade-card border border-beyblade-electricCyan/30 rounded-xl p-4 shadow-neon-cyan z-50 flex items-center justify-between gap-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-beyblade-electricCyan/10 text-beyblade-electricCyan">
          <Download className="h-6 w-6" />
        </div>
        <div>
          <h4 className="font-bold text-sm text-white">Instalar App Oficial</h4>
          <p className="text-xs text-gray-400">Instala Beyblade Uruguay en tu pantalla de inicio.</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleInstallClick}
          className="bg-beyblade-electricCyan hover:bg-beyblade-electricCyan/80 text-beyblade-darker font-bold text-xs py-2 px-3 rounded-lg transition-colors whitespace-nowrap"
        >
          Instalar
        </button>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
