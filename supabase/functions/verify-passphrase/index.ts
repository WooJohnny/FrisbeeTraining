import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ ok: false, message: "Not signed in" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const expected = Deno.env.get("CONTRIBUTOR_PASSPHRASE") || "";

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json({ ok: false, message: "Invalid login" }, 401);

    const { passphrase } = await req.json();
    if (!expected || typeof passphrase !== "string" || passphrase !== expected) {
      return json({ ok: false, message: "通關密語錯誤" }, 403);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { error } = await admin
      .from("profiles")
      .update({ role: "contributor", invite_verified: true })
      .eq("id", user.id)
      .eq("role", "viewer");

    if (error) throw error;
    return json({ ok: true });
  } catch (error) {
    return json({ ok: false, message: error?.message || "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
