import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SaveContactButtonProps {
  profile: {
    display_name?: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    user_id: string;
    bio?: string;
    company?: string;
    job_title?: string;
    website_url?: string;
    location?: string;
    avatar_url?: string;
  };
  userEmail: string;
}

export const SaveContactButton = ({ profile, userEmail }: SaveContactButtonProps) => {
  const { toast } = useToast();

  const imageToBase64 = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          // Remove the data:image/...;base64, prefix
          const base64Data = base64.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      return '';
    }
  };

  const saveContact = async () => {
    try {
      // Determine person name (first and last), avoiding display handles
      const toTitleCase = (s: string) =>
        (s || '').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

      const emailLocal = (userEmail || '').split('@')[0];
      const tokensFromEmail = emailLocal.split(/[._-]+/).filter(Boolean);

      let firstName = (profile as any).first_name?.trim() || '';
      let lastName = (profile as any).last_name?.trim() || '';
      let middleName = '';

      const fromFull = ((profile as any).full_name || profile.display_name || '').trim();

      if (!firstName && !lastName && fromFull.includes(' ')) {
        const parts = fromFull.split(/\s+/);
        firstName = parts[0] || '';
        lastName = parts.length > 1 ? parts[parts.length - 1] : '';
        middleName = parts.length > 2 ? parts.slice(1, -1).join(' ') : '';
      } else if (!firstName && !lastName && tokensFromEmail.length >= 2) {
        firstName = tokensFromEmail[0];
        lastName = tokensFromEmail.slice(1).join(' ');
      } else if (!firstName && !lastName && profile.display_name) {
        const m = profile.display_name.match(/^([a-zA-Z])(.*)$/);
        if (m) {
          firstName = m[1];
          lastName = m[2];
        } else {
          firstName = profile.display_name;
        }
      }

      // Title case
      firstName && (firstName = toTitleCase(firstName));
      middleName && (middleName = toTitleCase(middleName));
      lastName && (lastName = toTitleCase(lastName));

      const personName = [firstName, middleName, lastName].filter(Boolean).join(' ').trim() || 'Contact';
      const contactFileName = `contact_name_-_${personName.replace(/\s+/g, '_')}`;
      
      let photoData = '';
      if (profile.avatar_url && !profile.avatar_url.includes('placeholder.svg')) {
        photoData = await imageToBase64(profile.avatar_url);
      }
      // Create comprehensive vCard format with proper person fields
      const esc = (val: string) =>
        (val ?? '')
          .replace(/\\/g, '\\\\')
          .replace(/\n/g, '\\n')
          .replace(/,/g, '\\,')
          .replace(/;/g, '\\;');

      // Build vCard lines and join with CRLF as per spec
      const vCard = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${esc(lastName)};${esc(firstName)};${esc(middleName)};;`,
        `FN:${esc(personName)}`,
        'X-ABShowAs:PERSON',
        profile.job_title ? `TITLE:${esc(profile.job_title)}` : '',
        profile.company ? `ORG:${esc(profile.company)}` : '',
        userEmail ? `EMAIL;TYPE=INTERNET:${esc(userEmail)}` : '',
        profile.phone_number ? `TEL;TYPE=CELL:${esc(profile.phone_number)}` : '',
        profile.website_url ? `URL:${esc(profile.website_url)}` : '',
        profile.location ? `ADR:;;;;;;${esc(profile.location)}` : '',
        profile.bio ? `NOTE:${esc(profile.bio)}` : '',
        photoData ? `PHOTO;ENCODING=BASE64;TYPE=JPEG:${photoData}` : '',
        'END:VCARD',
      ].filter(Boolean).join('\r\n');

      // Create blob and download
      const blob = new Blob([vCard], { type: 'text/vcard' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${contactFileName}.vcf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Contact Saved",
        description: `${personName}'s contact has been saved to your device`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save contact. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Button 
      onClick={saveContact}
      variant="ghost"
      className="bg-transparent border-none text-primary hover:bg-transparent hover:text-primary/80 text-sm font-medium"
    >
      <Download className="w-4 h-4 mr-2" />
      Save Contact
    </Button>
  );
};