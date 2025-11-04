import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Users, Mail, Phone } from 'lucide-react';
import { ContactData } from '@/hooks/useContactSync';

interface ContactPickerModalProps {
  open: boolean;
  onClose: () => void;
  contacts: ContactData[];
  onToggle: (index: number) => void;
  onToggleAll: (selected: boolean) => void;
  onImport: () => void;
  syncing: boolean;
}

export function ContactPickerModal({
  open,
  onClose,
  contacts,
  onToggle,
  onToggleAll,
  onImport,
  syncing
}: ContactPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContacts = useMemo(() => {
    if (!searchQuery) return contacts;
    const query = searchQuery.toLowerCase();
    return contacts.filter(c => 
      c.name.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query) ||
      c.phone?.includes(query)
    );
  }, [contacts, searchQuery]);

  const selectedCount = contacts.filter(c => c.selected).length;
  const allSelected = contacts.length > 0 && selectedCount === contacts.length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-2xl font-bold">Import Contacts</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Select contacts you want to import
          </p>
        </DialogHeader>

        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="px-6 pb-2 flex items-center justify-between border-b">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={allSelected}
              onCheckedChange={(checked) => onToggleAll(checked as boolean)}
            />
            <span className="text-sm font-medium">
              Select All ({selectedCount}/{contacts.length})
            </span>
          </div>
        </div>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-2 py-4">
            {filteredContacts.map((contact, index) => {
              const originalIndex = contacts.indexOf(contact);
              return (
                <div
                  key={originalIndex}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => onToggle(originalIndex)}
                >
                  <Checkbox
                    checked={contact.selected}
                    onCheckedChange={() => onToggle(originalIndex)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <p className="font-medium truncate">{contact.name}</p>
                    </div>
                    {contact.email && (
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <p className="text-xs text-muted-foreground">{contact.phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {filteredContacts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No contacts found</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t bg-background flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={syncing}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={onImport}
            disabled={syncing || selectedCount === 0}
            className="flex-1"
          >
            {syncing ? 'Importing...' : `Import ${selectedCount} Contact${selectedCount !== 1 ? 's' : ''}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
