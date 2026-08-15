import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.24.2";

const BodySchema = z.object({
  telegram_id: z.number().int().positive(),
  action: z.enum(["deposit", "wallet_verification", "server", "battle_item", "ai_pro", "custom_server"]),
  amount_ton: z.number().positive().max(100000),
  metadata: z.record(z.unknown()).optional().default({}),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const memo = `nova:${crypto.randomUUID()}`;
    const { data, error } = await admin.from("ton_payment_intents").insert({
      telegram_id: parsed.data.telegram_id,
      action: parsed.data.action,
      amount_nano: Math.round(parsed.data.amount_ton * 1_000_000_000),
      memo,
      metadata: parsed.data.metadata,
    }).select("id,memo,expires_at").single();
    if (error) {
      console.error("intent insert failed", error.message);
      return json({ error: "Could not prepare payment" }, 500);
    }
    return json(data);
  } catch (error) {
    console.error("create intent failed", error);
    return json({ error: "Unexpected error" }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}