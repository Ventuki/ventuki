import { supabase } from "@/integrations/supabase/client";
import type {
  CreateLayawayInput,
  Layaway,
  LayawayDetail,
  LayawayFilters,
  AddPaymentInput,
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