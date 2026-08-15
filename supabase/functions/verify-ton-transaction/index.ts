import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Address, Cell } from "npm:@ton/core@0.63.1";
import { z } from "npm:zod@3.24.2";

const TREASURY = "UQAp1QxnLJ2z44IooUovvtVShw7hJBEdxCRV3RlbCYC3D8qj";
const BodySchema = z.object({
  intent_id: z.string().uuid(),
  boc: z.string().min(10).max(100000),
  sender: z.string().min(10).max(100).nullable().optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed", verified: false }, 405);

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: "Invalid verification request", verified: false }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const { data: intent, error } = await admin.from("ton_payment_intents")
      .select("id,memo,amount_nano,status,expires_at,wallet_address,tx_hash")
      .eq("id", parsed.data.intent_id).single();

    if (error || !intent) return json({ error: "Payment reference not found", verified: false }, 404);
    if (intent.status === "confirmed") return json({ verified: true, tx_hash: intent.tx_hash });
    if (new Date(intent.expires_at).getTime() < Date.now()) return json({ error: "Payment reference expired", verified: false }, 410);

    const requestedSender = parsed.data.sender ? normalizeAddress(parsed.data.sender) : null;
    await admin.from("ton_payment_intents").update({ boc: parsed.data.boc, wallet_address: parsed.data.sender ?? null, status: "submitted" }).eq("id", intent.id);

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const response = await fetch(`https://toncenter.com/api/v2/getTransactions?address=${encodeURIComponent(TREASURY)}&limit=50&archival=true`);
      const payload = await response.json().catch(() => null);
      if (response.ok && payload?.ok && Array.isArray(payload.result)) {
        const match = payload.result.find((tx: Record<string, unknown>) => matchesIntent(tx, intent.memo, Number(intent.amount_nano), requestedSender));
        if (match) {
          const txHash = String((match.transaction_id as { hash?: string } | undefined)?.hash ?? "");
          const { error: updateError } = await admin.from("ton_payment_intents").update({
            status: "confirmed", tx_hash: txHash, confirmed_at: new Date().toISOString(), failure_reason: null,
          }).eq("id", intent.id).is("tx_hash", null);
          if (updateError) return json({ error: "Payment was already used", verified: false }, 409);
          return json({ verified: true, tx_hash: txHash });
        }
      }
      if (attempt < 11) await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    return json({ verified: false, error: "Payment is still confirming. Try again shortly." }, 202);
  } catch (error) {
    console.error("TON verification failed", error);
    return json({ verified: false, error: "Verification service error" }, 500);
  }
});

function matchesIntent(tx: Record<string, unknown>, memo: string, amountNano: number, sender: string | null) {
  const input = tx.in_msg as Record<string, unknown> | undefined;
  if (!input || Number(input.value) < amountNano) return false;
  if (sender && normalizeAddress(String(input.source ?? "")) !== sender) return false;
  return extractComment(input) === memo;
}

function extractComment(input: Record<string, unknown>) {
  const data = input.msg_data as { text?: string; body?: string } | undefined;
  if (data?.text) {
    try { return new TextDecoder().decode(Uint8Array.from(atob(data.text), (char) => char.charCodeAt(0))); }
    catch { return data.text; }
  }
  if (!data?.body) return "";
  try {
    const slice = Cell.fromBase64(data.body).beginParse();
    if (slice.loadUint(32) !== 0) return "";
    return slice.loadStringTail();
  } catch { return ""; }
}

function normalizeAddress(value: string) {
  try { return Address.parse(value).toRawString(); } catch { return value; }
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}