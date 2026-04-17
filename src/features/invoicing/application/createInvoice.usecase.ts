import { supabase } from "@/integrations/supabase/client";
import { invoiceCache } from "../cache/invoice.cache";
import { invoiceListCache } from "../cache/invoiceList.cache";
import { invoiceConfig, getSeriesByBranch } from "../config/invoice.config";
import { InvoiceEntity } from "../domain/Invoice.entity";
import { invoiceAuditRepository } from "../infrastructure/audit.repository";
import { invoiceItemRepository } from "../infrastructure/invoiceItem.repository";
import { invoiceRepository } from "../infrastructure/invoice.repository";
import { invoiceLogger } from "../infrastructure/logger";
import { pdfGeneratorService } from "../infrastructure/pdfGenerator.service";
import { satProviderService } from "../infrastructure/satProvider.service";
import type { CreateInvoiceCommand, InvoicePermission } from "../types/invoice.types";
import { invoiceSchema } from "../validations/invoice.schema";
import { ensureInvoicePermission } from "./security/rbac.service";
import { domainEventBus } from "@/lib/events/domainEventBus";

export async function createInvoiceUseCase(command: CreateInvoiceCommand, permissions: InvoicePermission[]) {
  ensureInvoicePermission(permissions, "invoice.create");
  const input = invoiceSchema.parse(command) as any;

  // FIX BUG #19: Validar que si hay sale_id, la venta exista y esté completada
  if (input.sale_id) {
    const { data: sale, error: saleErr } = await supabase
      .from("sales" as any)
      .select("status")
      .eq("id", input.sale_id)
      .eq("company_id", input.company_id)
      .maybeSingle();

    if (saleErr || !sale) throw new Error("La venta especificada para facturar no existe.");
    if ((sale as any).status !== "completed") throw new Error("No se puede facturar una venta que no ha sido completada/pagada.");
  }

  const series = getSeriesByBranch(input.branch_id);
  const folio = await invoiceRepository.getNextFolio(input, series);
  const draft = new InvoiceEntity(input).toRecord({
    id: crypto.randomUUID(),
    series,
    folio,
    created_by: input.created_by,
    created_at: new Date().toISOString(),
  });

  const { data: created, error } = await invoiceRepository.create(draft);
  if (error || !created) throw error || new Error("No se pudo crear factura");

  await invoiceItemRepository.createMany(created.id, input.items);

  try {
    const stamp = await satProviderService.withRetry(
      () => satProviderService.stamp(created.id),
      invoiceConfig.retryStamp.attempts,
      invoiceConfig.retryStamp.delayMs,
    );

    await invoiceRepository.markStamped(created.id, input, stamp);
    const pdf = await pdfGeneratorService.generate(created.id);
    await invoiceRepository.setPdfUrl(created.id, input, pdf.pdf_url);

    const finalInvoice = {
      ...created,
      status: "stamped" as const,
      uuid: stamp.uuid,
      xml_url: stamp.xml_url,
      pdf_url: pdf.pdf_url,
      stamped_at: new Date().toISOString(),
    };

    invoiceCache.set(finalInvoice);
    invoiceListCache.invalidate(input.company_id, input.branch_id);

    await invoiceAuditRepository.record({
      company_id: input.company_id,
      branch_id: input.branch_id,
      actor_user_id: input.created_by,
      action: "invoice.created",
      target_id: created.id,
      payload: { sale_id: input.sale_id ?? null },
    });

    domainEventBus.publish({
      type: "invoice.created",
      payload: finalInvoice,
    });

    return finalInvoice;
  } catch (error) {
    invoiceLogger.error("SAT timeout", { invoiceId: created.id, error });
    throw error;
  }
}

