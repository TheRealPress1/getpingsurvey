import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Contact {
  name: string[];
  tel?: string[];
  email?: string[];
}

export const useContactSync = () => {
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const syncContacts = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to sync contacts.",
        variant: "destructive"
      });
      return;
    }

    // Check if Contact Picker API is supported
    if (!('contacts' in navigator && 'ContactsManager' in window)) {
      toast({
        title: "Not Supported",
        description: "Contact sync is only available on iOS Safari and some Android browsers.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSyncing(true);

      // Request contacts with name, phone, and email
      const props = ['name', 'tel', 'email'];
      const opts = { multiple: true };
      
      // @ts-ignore - Contact Picker API types not in TS yet
      const contacts: Contact[] = await navigator.contacts.select(props, opts);

      if (!contacts || contacts.length === 0) {
        toast({
          title: "No Contacts Selected",
          description: "You didn't select any contacts to sync.",
        });
        return;
      }

      // Process and insert contacts
      let successCount = 0;
      let errorCount = 0;

      for (const contact of contacts) {
        try {
          const name = contact.name?.[0] || 'Unknown';
          const phone = contact.tel?.[0];
          const email = contact.email?.[0];

          // Skip if no phone or email
          if (!phone && !email) continue;

          // Insert into contacts table
          const { error } = await (supabase as any)
            .from('contacts')
            .insert({
              user_id: user.id,
              name,
              phone,
              email,
              source: 'phone_sync',
              first_contact_date: new Date().toISOString().split('T')[0],
            });

          if (error) {
            console.error('Error inserting contact:', error);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (err) {
          console.error('Error processing contact:', err);
          errorCount++;
        }
      }

      toast({
        title: "Contacts Synced!",
        description: `Successfully imported ${successCount} contact${successCount !== 1 ? 's' : ''}${errorCount > 0 ? `. ${errorCount} failed.` : '.'}`,
      });

    } catch (error: any) {
      console.error('Contact sync error:', error);
      
      if (error.name === 'AbortError') {
        // User cancelled
        return;
      }

      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync contacts. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  return { syncContacts, syncing };
};
