import { supabase } from "@/integrations/supabase/client";
import { invoiceConfig } from "../config/invoice.config";
import { invoiceLogger } from "./logger";

export interface SATStampResponse {
  uuid: string;
  xml_url: string;
}

/**
 * Llama a la Edge Function `invoicing` de Supabase para timbrar un CFDI.
 * Las credenciales de Finkok NUNCA salen del backend.
 */
async function stampViaEdgeFunction(invoiceId: string): Promise<SATStampResponse> {
  invoiceLogger.info("Iniciando timbrado via Edge Function...", { invoiceId });

  const { data, error } = await supabase.functions.invoke("invoicing", {
    body: {
      action: "STAMP_CFDI",
      payload: {
        xmlBase64: `<!-- XML Sello de la factura ${invoiceId} -->`,
      },
    },
  });

  if (error) {
    invoiceLogger.error("Error al invocar Edge Function de timbrado", { error: error.message });
    throw new Error(`Error de timbrado (Edge Function): ${error.message}`);
  }

  if (!data?.success) {
    const errorMsg = data?.error || "Respuesta inesperada del servidor de facturación";
    invoiceLogger.error("Edge Function retornó fallo", { error: errorMsg });
    throw new Error(`Error de timbrado del PAC: ${errorMsg}`);
  }

  // Parsear UUID y XML URL de la respuesta SOAP/XML de Finkok
  const finkokResponse = data.finkok_response || "";
  const uuidMatch = finkokResponse.match(/<UUID>(.*?)<\/UUID>/i);
  const uuid = uuidMatch?.[1] || data.uuid || null;

  if (!uuid) {
    throw new Error("El PAC respondió pero no regresó un UUID fiscal válido.");
  }

  const xmlUrlMatch = finkokResponse.match(/<xml>(.*?)<\/xml>/i);
  const xmlUrl = xmlUrlMatch?.[1] || data.xml_url || `https://cdn.ventuki.com/cfdis/${uuid}.xml`;

  invoiceLogger.info("Timbrado exitoso via Edge Function", { uuid });

  return { uuid, xml_url: xmlUrl };
}

/**
 * Llama a la Edge Function `invoicing` de Supabase para cancelar un CFDI.
 * Las credenciales de Finkok NUNCA salen del backend.
 */
async function cancelViaEdgeFunction(uuid: string, reason: string): Promise<{ cancelled: boolean }> {
  invoiceLogger.info("Solicitando cancelación via Edge Function...", { uuid, reason });

  const { data, error } = await supabase.functions.invoke("invoicing", {
    body: {
      action: "CANCEL_CFDI",
      payload: { uuid, reason },
    },
  });

  if (error) {
    invoiceLogger.error("Error al invocar Edge Function de cancelación", { error: error.message });
    throw new Error(`Error de cancelación (Edge Function): ${error.message}`);
  }

  if (!data?.success) {
    const errorMsg = data?.error || "Respuesta inesperada del servidor de cancelación";
    throw new Error(`Error del SAT al cancelar: ${errorMsg}`);
  }

  invoiceLogger.info("Cancelación exitosa via Edge Function", { uuid });
  return { cancelled: true };
}

export const satProviderService = {
  async stamp(invoiceId: string): Promise<SATStampResponse> {
    if (!invoiceId) throw new Error("ID de factura inválido para timbrado");
    return stampViaEdgeFunction(invoiceId);
  },

  async cancel(uuid: string, reason: string) {
    if (!uuid) throw new Error("No existe UUID para cancelación");
    if (!reason) throw new Error("Motivo de cancelación requerido");
    return cancelViaEdgeFunction(uuid, reason);
  },

  async withRetry<T>(fn: () => Promise<T>, attempts: number, delayMs: number): Promise<T> {
    let lastError: unknown;
    for (let i = 1; i <= attempts; i += 1) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        invoiceLogger.warn("reintento de operación SAT", { attempt: i, max: attempts });
        if (i < attempts) await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    throw lastError;
  },
};
