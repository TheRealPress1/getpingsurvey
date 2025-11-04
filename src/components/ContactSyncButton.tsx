import { useEffect } from 'react';
import { Users } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useContactSync } from '@/hooks/useContactSync';
import { ContactPickerModal } from '@/components/ContactPickerModal';

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

    if (synced) {
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
      
      toast({
        title: "Sync Failed",
        description: errorMessage,
        variant: "destructive"
      });
      navigate('/profile', { replace: true });
    }
  }, [searchParams, toast, navigate]);

  const handleImport = async () => {
    const selectedContacts = contacts.filter(c => c.selected);
    await importSelectedContacts(selectedContacts);
  };

  return (
    <>
      <div className="space-y-3">
        <Button
          onClick={pickContacts}
          disabled={syncing}
          className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-600 transition-all shadow-lg flex items-center justify-center gap-2"
        >
          <Users className="w-5 h-5" />
          {syncing ? 'Syncing...' : 'Import Phone Contacts'}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Select contacts directly from your phone
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
