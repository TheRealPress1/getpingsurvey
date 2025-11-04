import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Contact {
  name: string;
  phone?: string;
  email?: string;
}

function parseVCard(vcfText: string): Contact[] {
  const contacts: Contact[] = [];
  const vCards = vcfText.split(/BEGIN:VCARD/i);

  vCards.forEach(card => {
    if (!card.trim()) return;

    const lines = card.split(/\r?\n/);
    let name = '';
    let phone = '';
    let email = '';

    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      if (/^FN:/i.test(trimmedLine)) {
        name = trimmedLine.substring(3).trim();
      } else if (/^N:/i.test(trimmedLine) && !name) {
        // Fallback to N field if FN is not present
        const parts = trimmedLine.substring(2).split(';');
        name = `${parts[1] || ''} ${parts[0] || ''}`.trim();
      } else if (/^TEL/i.test(trimmedLine)) {
        const phoneMatch = trimmedLine.match(/:([\d\s\-\+\(\)]+)/);
        if (phoneMatch) phone = phoneMatch[1].trim().replace(/\s/g, '');
      } else if (/^EMAIL/i.test(trimmedLine)) {
        const emailMatch = trimmedLine.match(/:(.+)/);
        if (emailMatch) email = emailMatch[1].trim();
      }
    });

    if (name) {
      contacts.push({ 
        name, 
        phone: phone || undefined, 
        email: email || undefined 
      });
    }
  });

  return contacts;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Share contacts endpoint called');
    
    const formData = await req.formData();
    const file = formData.get('contacts') as File;

    if (!file) {
      console.error('No file provided');
      return new Response(
        null,
        { 
          status: 303,
          headers: {
            ...corsHeaders,
            'Location': '/profile?error=no-file'
          }
        }
      );
    }

    console.log('File received:', file.name, file.type);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(
        null,
        { 
          status: 303,
          headers: {
            ...corsHeaders,
            'Location': '/auth?redirect=/profile'
          }
        }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        null,
        { 
          status: 303,
          headers: {
            ...corsHeaders,
            'Location': '/auth?redirect=/profile'
          }
        }
      );
    }

    console.log('User authenticated:', user.id);

    // Parse vCard file
    const text = await file.text();
    const contacts = parseVCard(text);

    console.log('Parsed contacts:', contacts.length);

    if (contacts.length === 0) {
      return new Response(
        null,
        { 
          status: 303,
          headers: {
            ...corsHeaders,
            'Location': '/profile?error=no-contacts'
          }
        }
      );
    }

    // Insert contacts into database
    let successCount = 0;
    let errorCount = 0;

    for (const contact of contacts) {
      try {
        const { error } = await supabase
          .from('contacts')
          .insert({
            user_id: user.id,
            name: contact.name,
            phone: contact.phone || null,
            email: contact.email || null,
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

    console.log(`Sync complete: ${successCount} success, ${errorCount} errors`);

    // Redirect to contacts tab with success
    return new Response(
      null,
      { 
        status: 303,
        headers: {
          ...corsHeaders,
          'Location': `/contacts?synced=${successCount}`
        }
      }
    );
  } catch (error) {
    console.error('Share contacts error:', error);
    return new Response(
      null,
      { 
        status: 303,
        headers: {
          ...corsHeaders,
          'Location': '/profile?error=unexpected'
        }
      }
    );
  }
});
