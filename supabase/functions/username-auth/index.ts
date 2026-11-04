import { createClient } from "npm:@supabase/supabase-js@2.118.0";

const siteOrigin = "https://leejongtan.github.io";
const cors = {
  "Access-Control-Allow-Origin": siteOrigin,
  "Access-Control-Allow-Headers": "apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
};
const reply = (status: number, body: object) => Response.json(body, { status, headers: cors });
const url = Deno.env.get("SUPABASE_URL")!;
const publishableKeys = Object.values(JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "{}")) as string[];
const anonKey = publishableKeys[0] || Deno.env.get("SUPABASE_ANON_KEY")!;
const serviceKey = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}").default || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const authOptions = { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } };
const admin = createClient(url, serviceKey, authOptions);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return reply(405, { code: "invalid_request" });
  if (![...publishableKeys, anonKey].includes(req.headers.get("apikey") || "")) {
    return reply(401, { code: "invalid_request" });
  }

  let input;
  try {
    const body = await req.text();
    if (body.length > 2048) return reply(413, { code: "invalid_request" });
    input = JSON.parse(body);
  } catch {
    return reply(400, { code: "invalid_request" });
  }
  const { action, username, password } = input || {};
  if ((action !== "login" && action !== "signup") || typeof username !== "string" ||
      !/^[a-z0-9_]{3,24}$/.test(username)) return reply(400, { code: "invalid_username" });
  const passwordBytes = typeof password === "string" ? new TextEncoder().encode(password).length : 0;
  if (!passwordBytes || passwordBytes > 72 || (action === "signup" && password.length < 8)) {
    return reply(400, { code: "invalid_password" });
  }

  // A project-wide quota also applies if the gateway supplies no client address.
  const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",").pop()?.trim() || "unknown";
  const { data: email, error: limitError } = await admin.rpc("phim_username_auth_request", {
    p_action: action, p_username: username, p_ip: ip,
  });
  if (limitError) return reply(503, { code: "unavailable" });
  if (!email) return reply(429, { code: "rate_limit" });

  if (action === "signup") {
    const { error } = await admin.auth.admin.createUser({
      email, password, email_confirm: true, app_metadata: { phim_username: username },
    });
    if (error) {
      if (error.code === "email_exists" || error.code === "user_already_exists") return reply(409, { code: "username_taken" });
      if (error.code === "weak_password") return reply(400, { code: "weak_password" });
      return reply(503, { code: "unavailable" });
    }
    return reply(201, { created: true });
  }

  // Each request gets its own client so session state cannot cross accounts.
  const { data, error } = await createClient(url, anonKey, authOptions).auth.signInWithPassword({ email, password });
  if (error?.status === 429) return reply(429, { code: "rate_limit" });
  if (error && error.code !== "invalid_credentials") return reply(503, { code: "unavailable" });
  if (!data.session) return reply(401, { code: "invalid_credentials" });
  const { access_token, refresh_token } = data.session;
  return reply(200, { access_token, refresh_token });
});
