import { supabase } from "@/integrations/supabase/client";
import type {
  CreateLayawayInput,
  Layaway,
  LayawayDetail,
  LayawayFilters,
  AddPaymentInput,
  RenewLayawayInput,
} from "../types";

export async function createLayaway(input: CreateLayawayInput) {
  const { data, error } = await supabase.rpc("process_layaway", {
    action: "create_layaway",
    ...input,
  });
  if (error) throw error;
  return data as { id: string };
}

export async function addLayawayPayment(input: AddPaymentInput) {
  const { data, error } = await supabase.rpc("process_layaway", {
    action: "add_payment",
    ...input,
  });
  if (error) throw error;
  return data;
}

export async function cancelLayaway(layawayId: string) {
  const { data, error } = await supabase.rpc("process_layaway", {
    action: "cancel_layaway",
    layaway_id: layawayId,
  });
  if (error) throw error;
  return data as Layaway;
}

export async function getLayaways(filters: LayawayFilters) {
  const { data, error } = await supabase.rpc("process_layaway", {
    action: "get_layaways",
    ...filters,
  });
  if (error) throw error;
  return (data ?? []) as Layaway[];
}

export async function getLayawayDetail(layawayId: string) {
  const { data, error } = await supabase.rpc("process_layaway", {
    action: "get_layaway_detail",
    layaway_id: layawayId,
  });
  if (error) throw error;
  return data as LayawayDetail;
}

export async function renewLayaway(input: RenewLayawayInput) {
  const current = await getLayawayDetail(input.layaway_id);
  const nextNotes = [
    current.notes?.trim(),
    `[Renovación ${new Date().toLocaleString("es-MX")}] ${input.renewal_note.trim()}`,
  ].filter(Boolean).join("\n\n");

  const { data, error } = await supabase
    .from("layaways" as any)
    .update({
      due_date: input.due_date,
      notes: nextNotes,
      updated_at: new Date().toISOString(),
    } as any)
    .eq("id", input.layaway_id)
    .select("*")
    .single();

  if (error) throw error;
  return data as Layaway;
}
