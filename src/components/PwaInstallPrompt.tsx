
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    'beforeinstallprompt': BeforeInstallPromptEvent;
  }
}

const PwaInstallPrompt = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setInstallPrompt(e);
      
      // Check if user has already dismissed or installed
      const hasPrompted = localStorage.getItem('pwaPromptDismissed');
      if (!hasPrompted) {
        // Show our custom install prompt after a delay
        setTimeout(() => {
          setShowPrompt(true);
        }, 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) {
      return;
    }

    // Show the install prompt
    await installPrompt.prompt();

    // Wait for the user to respond to the prompt
    const choiceResult = await installPrompt.userChoice;
    
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    // We no longer need the prompt. Clear it up.
    setInstallPrompt(null);
    setShowPrompt(false);
  };

  const dismissPrompt = () => {
    localStorage.setItem('pwaPromptDismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-16 left-4 right-4 bg-white p-4 rounded-lg shadow-lg z-50 border border-golf-green-dark">
      <button 
        onClick={dismissPrompt}
        className="absolute top-2 right-2 p-1"
        aria-label="Stäng"
      >
        <X size={18} />
      </button>
      <div className="flex items-center">
        <div className="w-12 h-12 bg-golf-green-dark rounded-full flex items-center justify-center mr-4">
          <span className="text-white text-2xl font-bold">PP</span>
        </div>
        <div>
          <h3 className="font-semibold mb-1">Installera Putt-Pals</h3>
          <p className="text-sm text-gray-600 mb-2">Lägg till på hemskärmen för snabbare åtkomst</p>
        </div>
      </div>
      <Button 
        onClick={handleInstallClick}
        className="w-full mt-2 bg-golf-green-dark hover:bg-golf-green-light"
      >
        Installera
      </Button>
    </div>
  );
};

export default PwaInstallPrompt;
