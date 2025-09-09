import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConfirmRequest {
  email: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = (await req.json()) as ConfirmRequest;
    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Missing server configuration" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const adminBase = `${SUPABASE_URL}/auth/v1/admin`;

    // 1) Find user by email
    const findRes = await fetch(`${adminBase}/users?email=${encodeURIComponent(email.trim().toLowerCase())}`, {
      method: "GET",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!findRes.ok) {
      const txt = await findRes.text();
      return new Response(JSON.stringify({ error: `Failed to lookup user: ${txt}` }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const users = (await findRes.json()) as { users: Array<{ id: string; email_confirmed_at?: string | null }> } | Array<{ id: string; email_confirmed_at?: string | null }>;

    const list = Array.isArray(users) ? users : users.users;
    const user = list?.[0];

    if (!user?.id) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // 2) If already confirmed, return success
    if (user.email_confirmed_at) {
      return new Response(JSON.stringify({ ok: true, alreadyConfirmed: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // 3) Confirm the user
    const confirmRes = await fetch(`${adminBase}/users/${user.id}`, {
      method: "PATCH",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email_confirmed_at: new Date().toISOString() }),
    });

    if (!confirmRes.ok) {
      const txt = await confirmRes.text();
      return new Response(JSON.stringify({ error: `Failed to confirm user: ${txt}` }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error?.message ?? "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});