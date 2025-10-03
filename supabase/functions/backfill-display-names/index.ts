import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    console.log('Starting backfill of display names...');

    // Get all users
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      throw new Error(`Failed to list users: ${usersError.message}`);
    }

    console.log(`Found ${users.length} users to process`);

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const user of users) {
      try {
        // Check if user already has full_name in metadata
        const hasFullName = user.user_metadata?.full_name && 
                           typeof user.user_metadata.full_name === 'string' && 
                           user.user_metadata.full_name.trim().length > 0;

        if (hasFullName) {
          console.log(`Skipping user ${user.email} - already has full_name`);
          skipped++;
          continue;
        }

        // Get profile data
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('display_name, first_name, last_name')
          .eq('user_id', user.id)
          .single();

        if (profileError || !profile) {
          console.log(`No profile found for user ${user.email}`);
          skipped++;
          continue;
        }

        // Determine the full name from profile
        let fullName = '';
        
        if (profile.display_name && profile.display_name.trim().length > 0) {
          fullName = profile.display_name.trim();
        } else if (profile.first_name || profile.last_name) {
          fullName = [profile.first_name, profile.last_name]
            .filter(Boolean)
            .join(' ')
            .trim();
        }

        if (!fullName) {
          console.log(`No name data for user ${user.email}`);
          skipped++;
          continue;
        }

        // Split name for first/last
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Update auth metadata
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          user.id,
          {
            user_metadata: {
              ...user.user_metadata,
              full_name: fullName,
              name: fullName,
              display_name: fullName,
              first_name: firstName,
              last_name: lastName,
            }
          }
        );

        if (updateError) {
          console.error(`Failed to update user ${user.email}:`, updateError.message);
          failed++;
        } else {
          console.log(`Updated user ${user.email} with name: ${fullName}`);
          updated++;
        }
      } catch (err) {
        console.error(`Error processing user ${user.email}:`, err);
        failed++;
      }
    }

    const result = {
      success: true,
      total: users.length,
      updated,
      skipped,
      failed,
      message: `Backfill complete: ${updated} updated, ${skipped} skipped, ${failed} failed`
    };

    console.log('Backfill complete:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Backfill error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
