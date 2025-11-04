import { useEffect } from 'react';
import { Users } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useContactSync } from '@/hooks/useContactSync';
import { ContactPickerModal } from '@/components/ContactPickerModal';
import { GoogleContactsButton } from '@/components/GoogleContactsButton';

export function ContactSyncButton() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    pickContacts, 
    syncing, 
    contacts, 
    showContactPicker, 
    setShowContactPicker,
    importSelectedContacts,
    toggleContact,
    toggleAll
  } = useContactSync();

  useEffect(() => {
    const error = searchParams?.get('error');
    const synced = searchParams?.get('synced');
    const imported = searchParams?.get('imported');

    if (imported) {
      const count = parseInt(imported);
      toast({
        title: "Contacts Imported!",
        description: `Successfully imported ${count} contact${count !== 1 ? 's' : ''} from Google.`,
      });
      navigate('/contacts', { replace: true });
    } else if (synced) {
      const count = parseInt(synced);
      toast({
        title: "Contacts Synced!",
        description: `Successfully synced ${count} contact${count !== 1 ? 's' : ''}.`,
      });
      navigate('/contacts', { replace: true });
    } else if (error) {
      let errorMessage = 'Failed to sync contacts. Please try again.';
      if (error === 'no-file') errorMessage = 'No contacts file received.';
      if (error === 'no-contacts') errorMessage = 'No valid contacts found in file.';
      if (error === 'oauth_cancelled') errorMessage = 'Google import was cancelled.';
      if (error === 'contacts_fetch_failed') errorMessage = 'Failed to fetch contacts from Google.';
      if (error === 'user_not_found') errorMessage = 'Please sign in again to import contacts.';
      
      toast({
        title: "Import Failed",
        description: errorMessage,
        variant: "destructive"
      });
      navigate('/contacts', { replace: true });
    }
  }, [searchParams, toast, navigate]);

  const handleImport = async () => {
    const selectedContacts = contacts.filter(c => c.selected);
    await importSelectedContacts(selectedContacts);
  };

  return (
    <>
      <div className="space-y-3">
        <GoogleContactsButton />
        
        <p className="text-xs text-muted-foreground text-center">
          Works on iPhone, Android & Desktop
        </p>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <Button
          onClick={pickContacts}
          disabled={syncing}
          variant="outline"
          className="w-full py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
        >
          <Users className="w-5 h-5" />
          {syncing ? 'Syncing...' : 'Import Phone Contacts'}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Select contacts directly from your device
        </p>
      </div>

      <ContactPickerModal
        open={showContactPicker}
        onClose={() => setShowContactPicker(false)}
        contacts={contacts}
        onToggle={toggleContact}
        onToggleAll={toggleAll}
        onImport={handleImport}
        syncing={syncing}
      />
    </>
  );
}
