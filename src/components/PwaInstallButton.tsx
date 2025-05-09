
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Download } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";

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

const PwaInstallButton = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if the device is iOS
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);
    
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Check if the PWA is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      // For iOS devices, show instructions to add to home screen
      toast({
        title: "Installera på iOS",
        description: "Tryck på dela-ikonen i webbläsaren och välj 'Lägg till på hemskärmen'",
      });
      return;
    }

    if (!installPrompt) {
      toast({
        title: "Installation",
        description: "Appen kan inte installeras just nu. Försök igen senare.",
      });
      return;
    }

    // Show the install prompt
    await installPrompt.prompt();

    // Wait for the user to respond to the prompt
    const choiceResult = await installPrompt.userChoice;
    
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
      toast({
        title: "Tack!",
        description: "Appen installeras på din enhet.",
      });
      setIsInstallable(false);
    } else {
      console.log('User dismissed the install prompt');
    }
  };

  if (!isInstallable && !isIOS) {
    return null;
  }

  return (
    <Button 
      onClick={handleInstallClick}
      className="fixed bottom-4 right-4 bg-golf-green-dark hover:bg-golf-green-light text-white shadow-lg z-50"
      size="lg"
    >
      <Download className="mr-2" />
      Installera App
    </Button>
  );
};

export default PwaInstallButton;
