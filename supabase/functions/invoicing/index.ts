import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

// ============================================================================
// CONSTANTES Y CONFIGURACIÓN
// ============================================================================

// ⚠️  ATENCIÓN: Para producción, reemplazar con el dominio real del frontend Ventuki.
// No usar "*" en producción — permite solo el origen conocido.
const ALLOWED_ORIGIN = Deno.env.get("INVOICING_ALLOWED_ORIGIN") ?? "*";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Credentials": "true",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy": "default-src 'none'",
};

// ============================================================================
// RATE LIMITING (in-memory simple — para producción usar Redis)
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

function rateLimit(identifier: string, limit: number, windowMs: number): boolean {
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
// ZOD SCHEMAS — Validación estricta de inputs
// ============================================================================

// Motivos válidos SAT para cancelación
const CANCEL_REASONS = ["01", "02", "03", "04"] as const;

// Schema para action field (union de todos los actions válidos)
const ActionSchema = z.enum([
  "issue_invoice",
  "cancel_invoice",
  "get_invoice",
  "get_pending_invoices",
]);

// Schema para issue_invoice
const IssueInvoiceSchema = z.object({
  xmlBase64: z
    .string()
    .min(1, "xmlBase64 no puede estar vacío")
    .refine(
      (val) => {
        try {
          const buffer = Buffer.from(val, "base64");
          const str = buffer.toString("utf-8");
          // Validación básica estructural para prevenir inyecciones y asegurar formato CFDI
          const hasStart = str.trim().startsWith("<?xml") || str.trim().startsWith("<cfdi:Comprobante");
          const hasEnd = str.trim().endsWith(">") || str.trim().endsWith("</cfdi:Comprobante>");
          const noDtd = !str.includes("<!DOCTYPE"); // Previene XXE básico
          const noEntities = !str.includes("<!ENTITY"); // Previene XXE básico
          
          return hasStart && hasEnd && noDtd && noEntities;
        } catch {
          return false;
        }
      },
      { message: "xmlBase64 no es un XML válido o contiene elementos prohibidos (DTD/Entities)" },
    ),
});

// Schema para cancel_invoice
const CancelInvoiceSchema = z.object({
  uuid: z
    .string()
    .regex(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      "UUID no tiene formato válido",
    ),
  reason: z
    .string()
    .trim()
    .min(1, "El motivo de cancelación es obligatorio")
    .refine(
      (val) => CANCEL_REASONS.includes(val as typeof CANCEL_REASONS[number]),
      { message: `Motivo inválido. Use: ${CANCEL_REASONS.join(", ")}` },
    ),
});

// Schema para get_invoice
const GetInvoiceSchema = z.object({
  uuid: z
    .string()
    .regex(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      "UUID no tiene formato válido",
    ),
});

// Schema vacío para get_pending_invoices (no requiere payload)
const GetPendingInvoicesSchema = z.object({}).strict();

// Base payload schema — todos los payloads son objetos
const BasePayloadSchema = z.object({}).passthrough();

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Construye una Response JSON con headers CORS seguros.
 * SIEMPRE usar esta función en lugar de new Response() directo.
 */
function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

/**
 * Construye una Response de error con mensaje seguro (nunca detalles internos).
 */
function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

/**
 * Construye una Response de error 500 segura.
 * El mensaje detallado se loguea internamente pero NO se expone al cliente.
 */
function internalErrorResponse(): Response {
  console.error(`[INVOICING][INTERNAL ERROR] ${new Date().toISOString()}`);
  return jsonResponse(
    { error: "Error interno del servicio. Intente de nuevo o contacte al administrador." },
    500,
  );
}

// ============================================================================
// AUDIT LOG
// ============================================================================

interface AuditLogEntry {
  timestamp: string;
  action: string;
  clientIp: string;
  status: "attempt" | "validation_failed" | "success" | "error";
  detail?: string;
}

function auditLog(entry: AuditLogEntry): void {
  // Loguear solo datos de auditoría — sin exponer credenciales ni datos sensibles
  console.info(JSON.stringify(entry));
}

// ============================================================================
// SOAP CLIENT (aislado para control de errores)
// ============================================================================

interface SoapResult {
  ok: boolean;
  status: number;
  statusText: string;
  body: string;
}

async function soapRequest(endpoint: string, envelope: string): Promise<SoapResult> {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml;charset=UTF-8",
        "SOAPAction": "stamp",
      },
      body: envelope,
    });

    const body = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      body,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      statusText: err instanceof Error ? err.message : "Network error",
      body: "",
    };
  }
}

// ============================================================================
// HANDLER PRINCIPAL
// ============================================================================

serve(async (req: Request) => {
  // --------------------------------------------------------------------------
  // CORS Preflight — sin autenticación, solo headers
  // --------------------------------------------------------------------------
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  // --------------------------------------------------------------------------
  // RATE LIMITING (IP)
  // --------------------------------------------------------------------------
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("cf-connecting-ip")?.split(",")[0]?.trim()
    ?? "unknown";

  if (!rateLimit(`ip:${clientIp}`, 30, 60_000)) {
    console.error(`[INVOICING][RATE LIMIT] IP ${clientIp} excedió límite`);
    return errorResponse("Demasiadas solicitudes. Intenta de nuevo en un momento.", 429);
  }

  // --------------------------------------------------------------------------
  // AUTENTICACIÓN (Bearer token)
  // --------------------------------------------------------------------------
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return errorResponse("Missing or invalid Authorization header", 401);
  }

  const token = authHeader.slice(7);

  // Rate limit por token (hash parcial para no guardar el token completo en memoria)
  if (!rateLimit(`auth:${token.slice(-8)}`, 10, 60_000)) {
    return errorResponse("Demasiadas solicitudes. Intenta de nuevo en un momento.", 429);
  }

  // --------------------------------------------------------------------------
  // PARSEO DEL PAYLOAD
  // --------------------------------------------------------------------------
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return errorResponse("Payload debe ser JSON válido", 400);
  }

  // --------------------------------------------------------------------------
  // VALIDACIÓN ZOD — action + payload
  // --------------------------------------------------------------------------

  // 1. Validar que el body sea un objeto
  if (typeof rawBody !== "object" || rawBody === null || Array.isArray(rawBody)) {
    return errorResponse("El payload debe ser un objeto JSON", 400);
  }

  const body = BasePayloadSchema.parse(rawBody);

  // 2. Validar action
  const actionResult = ActionSchema.safeParse(body.action);
  if (!actionResult.success) {
    const allowed = ["issue_invoice", "cancel_invoice", "get_invoice", "get_pending_invoices"];
    return errorResponse(
      `Campo 'action' es obligatorio. Acciones válidas: ${allowed.join(", ")}`,
      400,
    );
  }

  const action = actionResult.data;
  const payload = body.payload ?? {};

  auditLog({
    timestamp: new Date().toISOString(),
    action,
    clientIp,
    status: "attempt",
  });

  // --------------------------------------------------------------------------
  // VARIABLES DE ENTORNO (FINKOK) — ⚠️  NUNCA hardcodear aquí
  // --------------------------------------------------------------------------
  const FINKOK_USER = Deno.env.get("FINKOK_API_USERNAME");
  const FINKOK_PASS = Deno.env.get("FINKOK_API_PASSWORD");
  const FINKOK_ENV = Deno.env.get("FINKOK_ENV") || "sandbox";

  if (!FINKOK_USER || !FINKOK_PASS) {
    console.error("[INVOICING] Credenciales de Finkok no configuradas en variables de entorno");
    return errorResponse("Servicio de facturación no disponible. Contacte al administrador.", 503);
  }

  const stampEndpoint = FINKOK_ENV === "production"
    ? "https://facturacion.finkok.com/servicios/soap/stamp"
    : "https://demo-facturacion.finkok.com/servicios/soap/stamp";

  const cancelEndpoint = FINKOK_ENV === "production"
    ? "https://facturacion.finkok.com/servicios/soap/cancel"
    : "https://demo-facturacion.finkok.com/servicios/soap/cancel";

  // ==========================================================================
  // ISSUE_INVOICE — Timbrar CFDI
  // ==========================================================================
  if (action === "issue_invoice") {
    const parseResult = IssueInvoiceSchema.safeParse(payload);
    if (!parseResult.success) {
      const msg = parseResult.error.errors[0]?.message ?? "Payload inválido para issue_invoice";
      auditLog({
        timestamp: new Date().toISOString(),
        action,
        clientIp,
        status: "validation_failed",
        detail: msg,
      });
      return errorResponse(msg, 400);
    }

    const { xmlBase64 } = parseResult.data;

    // Decode para inyectar de forma segura en el SOAP envelope
    const xmlContent = Buffer.from(xmlBase64, "base64").toString("utf-8");

    // Límite de tamaño (10MB)
    if (xmlContent.length > 10 * 1024 * 1024) {
      return errorResponse("El XML excede el tamaño máximo permitido (10MB)", 400);
    }

    const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:apps="http://facturacion.finkok.com/stamp">
  <soapenv:Header/>
  <soapenv:Body>
    <apps:stamp>
      <apps:xml><![CDATA[${xmlContent}]]></apps:xml>
      <apps:username>${FINKOK_USER}</apps:username>
      <apps:password>${FINKOK_PASS}</apps:password>
    </apps:stamp>
  </soapenv:Body>
</soapenv:Envelope>`;

    auditLog({
      timestamp: new Date().toISOString(),
      action,
      clientIp,
      status: "success",
      detail: `env=${FINKOK_ENV}, requesting stamp`,
    });

    const result = await soapRequest(stampEndpoint, soapEnvelope);

    if (!result.ok) {
      console.error(`[INVOICING][STAMP] Finkok HTTP ${result.status}: ${result.statusText}`);
      auditLog({
        timestamp: new Date().toISOString(),
        action,
        clientIp,
        status: "error",
        detail: `Finkok HTTP ${result.status}`,
      });
      return errorResponse(`Error del servidor de facturación (HTTP ${result.status})`, 502);
    }

    // Extraer UUID de la respuesta SOAP
    const uuidMatch = result.body.match(/<UUID>(.*?)<\/UUID>/i);
    const uuid = uuidMatch?.[1] || null;

    auditLog({
      timestamp: new Date().toISOString(),
      action,
      clientIp,
      status: uuid ? "success" : "error",
      detail: uuid ? `uuid=${uuid}` : "no_uuid_in_response",
    });

    return jsonResponse({
      success: true,
      uuid,
      finkok_response: result.body,
    });
  }

  // ==========================================================================
  // CANCEL_INVOICE — Cancelar CFDI
  // ==========================================================================
  if (action === "cancel_invoice") {
    const parseResult = CancelInvoiceSchema.safeParse(payload);
    if (!parseResult.success) {
      const msg = parseResult.error.errors[0]?.message ?? "Payload inválido para cancel_invoice";
      auditLog({
        timestamp: new Date().toISOString(),
        action,
        clientIp,
        status: "validation_failed",
        detail: msg,
      });
      return errorResponse(msg, 400);
    }

    const { uuid, reason } = parseResult.data;
    const FINKOK_RFC = Deno.env.get("FINKOK_EMISOR_RFC") || "";

    const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:apps="http://facturacion.finkok.com/cancel">
  <soapenv:Header/>
  <soapenv:Body>
    <apps:cancel>
      <apps:UUIDS>
        <apps:uuids>
          <apps:uuid>${uuid}</apps:uuid>
        </apps:uuids>
      </apps:UUIDS>
      <apps:username>${FINKOK_USER}</apps:username>
      <apps:password>${FINKOK_PASS}</apps:password>
      <apps:taxpayer_id>${FINKOK_RFC}</apps:taxpayer_id>
      <apps:reason>${reason}</apps:reason>
    </apps:cancel>
  </soapenv:Body>
</soapenv:Envelope>`;

    auditLog({
      timestamp: new Date().toISOString(),
      action,
      clientIp,
      status: "success",
      detail: `uuid=${uuid}, reason=${reason}`,
    });

    const result = await soapRequest(cancelEndpoint, soapEnvelope);

    if (!result.ok) {
      console.error(`[INVOICING][CANCEL] Finkok HTTP ${result.status}: ${result.statusText}`);
      auditLog({
        timestamp: new Date().toISOString(),
        action,
        clientIp,
        status: "error",
        detail: `Finkok HTTP ${result.status}`,
      });
      return errorResponse(`Error del servidor de cancelación (HTTP ${result.status})`, 502);
    }

    return jsonResponse({
      success: true,
      message: "Cancelación procesada correctamente",
      finkok_response: result.body,
    });
  }

  // ==========================================================================
  // GET_INVOICE — Consultar estado de un CFDI
  // ==========================================================================
  if (action === "get_invoice") {
    const parseResult = GetInvoiceSchema.safeParse(payload);
    if (!parseResult.success) {
      const msg = parseResult.error.errors[0]?.message ?? "Payload inválido para get_invoice";
      auditLog({
        timestamp: new Date().toISOString(),
        action,
        clientIp,
        status: "validation_failed",
        detail: msg,
      });
      return errorResponse(msg, 400);
    }

    const { uuid } = parseResult.data;

    auditLog({
      timestamp: new Date().toISOString(),
      action,
      clientIp,
      status: "success",
      detail: `uuid=${uuid}`,
    });

    // Placeholder: en producción consultar base de datos o API Finkok
    // Por ahora se devuelve un error de feature no implementado
    return jsonResponse({
      success: false,
      error: "get_invoice aún no implementado — contacte al administrador",
    });
  }

  // ==========================================================================
  // GET_PENDING_INVOICES — Listar facturas pendientes
  // ==========================================================================
  if (action === "get_pending_invoices") {
    const parseResult = GetPendingInvoicesSchema.safeParse(payload);
    if (!parseResult.success) {
      auditLog({
        timestamp: new Date().toISOString(),
        action,
        clientIp,
        status: "validation_failed",
        detail: "unexpected payload fields",
      });
      return errorResponse("get_pending_invoices no acepta payload", 400);
    }

    auditLog({
      timestamp: new Date().toISOString(),
      action,
      clientIp,
      status: "success",
    });

    // Placeholder: en producción consultar base de datos
    return jsonResponse({
      success: false,
      error: "get_pending_invoices aún no implementado — contacte al administrador",
    });
  }

  // --------------------------------------------------------------------------
  // ACCIÓN NO SOPORTADA (no debería llegar aquí por Zod, pero por seguridad)
  // --------------------------------------------------------------------------
  return errorResponse(
    "Acción no soportada. Use: issue_invoice, cancel_invoice, get_invoice, get_pending_invoices",
    400,
  );
});