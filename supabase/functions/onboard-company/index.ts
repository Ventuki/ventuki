import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3";

// ============================================================================
// CONSTANTES Y CONFIGURACIÓN
// ============================================================================

// TODO: Reemplazar con el dominio real del frontend Ventuki
const ALLOWED_ORIGIN = "*";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

// ============================================================================
// RATE LIMITING (in-memory simple — para producción usar Redis o Supabase PG)
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

function checkRateLimit(identifier: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(identifier, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count++;
  return true;
}

// ============================================================================
// ZOD VALIDATION SCHEMA
// ============================================================================

const onboardSchema = z.object({
  company_name: z.string().min(2, "company_name mínimo 2 caracteres").max(100, "company_name máximo 100 caracteres"),
  company_slug: z.string()
    .min(2, "company_slug mínimo 2 caracteres")
    .max(50, "company_slug máximo 50 caracteres")
    .regex(/^[a-z0-9-]+$/, "company_slug solo letras minúsculas, números y guiones"),
  company_email: z.string().email("company_email no es válido").optional().nullable(),
  company_phone: z.string().optional().nullable(),
  branch_name: z.string().optional().nullable(),
  branch_address: z.string().optional().nullable(),
  branch_phone: z.string().optional().nullable(),
  warehouse_name: z.string().optional().nullable(),
});

type OnboardPayload = z.infer<typeof onboardSchema>;

// ============================================================================
// HELPERS
// ============================================================================

function jsonResponse(body: Record<string, unknown>, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extraHeaders },
  });
}

// ============================================================================
// HANDLER PRINCIPAL
// ============================================================================

Deno.serve(async (req: Request) => {
  // --------------------------------------------------------------------------
  // CORS Preflight
  // --------------------------------------------------------------------------
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // --------------------------------------------------------------------------
  // RATE LIMITING por IP
  // --------------------------------------------------------------------------
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("cf-connecting-ip")?.split(",")[0]?.trim()
    ?? "unknown";

  if (!checkRateLimit(`ip:${clientIp}`, 20, 60_000)) {
    console.error(`[RATE LIMIT] IP ${clientIp} excedió límite de requests`);
    return jsonResponse({ error: "Demasiadas solicitudes. Intenta de nuevo en un momento." }, 429);
  }

  // --------------------------------------------------------------------------
  // AUTENTICACIÓN
  // --------------------------------------------------------------------------
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return jsonResponse({ error: "Missing or invalid Authorization header" }, 401);
  }

  // Rate limit por usuario autenticado
  const token = authHeader.slice(7);
  if (!checkRateLimit(`auth:${token.slice(-8)}`, 10, 60_000)) {
    return jsonResponse({ error: "Demasiadas solicitudes. Intenta de nuevo en un momento." }, 429);
  }

  // --------------------------------------------------------------------------
  // PARSEO Y VALIDACIÓN DEL PAYLOAD CON ZOD
  // --------------------------------------------------------------------------
  let rawPayload: unknown;
  try {
    rawPayload = await req.json();
  } catch {
    return jsonResponse({ error: "Payload debe ser JSON válido" }, 400);
  }

  const parsed = onboardSchema.safeParse(rawPayload);
  if (!parsed.success) {
    return jsonResponse({ error: "Datos inválidos", details: parsed.error.flatten() }, 400);
  }

  const payload: OnboardPayload = parsed.data;

  // --------------------------------------------------------------------------
  // CREACIÓN DEL CLIENTE SUPABASE (como service role para onboarding)
  // --------------------------------------------------------------------------
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[ONBOARD] Variables de entorno SUPABASE_URL o SUPABASE_ANON_KEY no están definidas");
    return jsonResponse({ error: "Configuración del servidor incorrecta" }, 500);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: authHeader },
    },
  });

  // --------------------------------------------------------------------------
  // LLAMADA AL PROCEDIMIENTO DE ONBOARDING
  // --------------------------------------------------------------------------
  let result: { data: unknown; error: null } | { data: null; error: Record<string, unknown> };
  try {
    const { data, error } = await supabase.rpc("onboard_company", {
      _company_name: payload.company_name.trim(),
      _company_slug: payload.company_slug.toLowerCase().trim(),
      _company_phone: payload.company_phone?.trim() ?? null,
      _company_email: payload.company_email?.trim() ?? null,
      _branch_name: payload.branch_name?.trim() ?? "Principal",
      _branch_address: payload.branch_address?.trim() ?? null,
      _branch_phone: payload.branch_phone?.trim() ?? null,
      _warehouse_name: payload.warehouse_name?.trim() ?? "Almacén Principal",
    });

    result = { data, error: error as null | Record<string, unknown> };
  } catch (err) {
    console.error("[ONBOARD] Error al invocar onboard_company:", err);
    return jsonResponse({ error: "Error interno del servidor" }, 500);
  }

  if (result.error) {
    console.error("[ONBOARD] Error RPC onboard_company:", result.error);
    return jsonResponse({ error: "Error al crear la compañía" }, 400);
  }

  // --------------------------------------------------------------------------
  // LOG DE AUDITORÍA
  // --------------------------------------------------------------------------
  console.info(JSON.stringify({
    timestamp: new Date().toISOString(),
    action: "onboard_company",
    user: "authenticated",
    company_slug: payload.company_slug,
    status: "success",
  }));

  return jsonResponse({ data: result.data }, 201);
});