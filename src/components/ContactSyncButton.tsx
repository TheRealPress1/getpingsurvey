import { useState, useEffect } from 'react';
import { Users, Share2, AlertCircle } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useContactSync } from '@/hooks/useContactSync';

export function ContactSyncButton() {
  const [isPWA, setIsPWA] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { triggerFileUpload, syncing } = useContactSync();

  useEffect(() => {
    // Check if running as PWA
    const isPWAMode = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');
    
    setIsPWA(isPWAMode);
  }, []);

  useEffect(() => {
    // Handle redirect messages
    const error = searchParams?.get('error');
    const synced = searchParams?.get('synced');

    if (synced) {
      const count = parseInt(synced);
      toast({
        title: "Contacts Synced!",
        description: `Successfully synced ${count} contact${count !== 1 ? 's' : ''}.`,
      });
      // Clean URL
      navigate('/profile', { replace: true });
    } else if (error) {
      let errorMessage = 'Failed to sync contacts. Please try again.';
      if (error === 'no-file') errorMessage = 'No contacts file received.';
      if (error === 'no-contacts') errorMessage = 'No valid contacts found in file.';
      
      toast({
        title: "Sync Failed",
        description: errorMessage,
        variant: "destructive"
      });
      navigate('/profile', { replace: true });
    }
  }, [searchParams, toast, navigate]);

  const handleSyncClick = () => {
    if (!isPWA) {
      setShowInstructions(true);
      return;
    }

    // Show iOS share instructions for PWA users
    toast({
      title: "Sync Your Contacts",
      description: `To sync contacts:

1. Open your Contacts app
2. Select contacts or tap "Select All"
3. Tap the share icon (⬆)
4. Choose "Ping!" from share menu
5. Contacts sync automatically

Or tap below to manually upload a vCard file.`,
    });
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={isPWA ? handleSyncClick : triggerFileUpload}
        disabled={syncing}
        className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-600 transition-all shadow-lg flex items-center justify-center gap-2"
      >
        <Users className="w-5 h-5" />
        {syncing ? 'Syncing...' : isPWA ? 'Sync Phone Contacts' : 'Import Phone Contacts'}
      </Button>

      {!isPWA && showInstructions && (
        <div className="p-4 bg-card rounded-lg border border-primary/30 animate-in slide-in-from-top">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-foreground">
                Install Ping! for one-tap sync
              </p>
              <ol className="space-y-1.5 text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-primary">1.</span>
                  Tap the <Share2 className="w-4 h-4 inline" /> share button in Safari
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">2.</span>
                  Scroll and tap "Add to Home Screen"
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">3.</span>
                  Open Ping! from your home screen
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">4.</span>
                  Come back here and sync contacts
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {isPWA && (
        <Button
          onClick={triggerFileUpload}
          disabled={syncing}
          variant="outline"
          className="w-full text-sm"
        >
          Or manually upload vCard file
        </Button>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Your contacts stay private and secure
      </p>
    </div>
  );
}
