import type { Layaway } from "../types";

export interface LayawayRenewalEntry {
  raw: string;
  happenedAt: string;
  note: string;
}

export function isLayawayOverdue(layaway: Pick<Layaway, "status" | "due_date">): boolean {
  if (layaway.status !== "active" || !layaway.due_date) return false;
  const due = new Date(`${layaway.due_date}T23:59:59`);
  return due.getTime() < Date.now();
}

export const STATUS_LABELS: Record<Layaway["status"], string> = {
  active: "Activo",
  completed: "Completado",
  cancelled: "Cancelado",
};

export const STATUS_COLORS: Record<Layaway["status"], string> = {
  active: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  mixed: "Mixto",
};

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
}

export function getRemainingAmount(layaway: Pick<Layaway, "total_amount" | "paid_amount">): number {
  return Math.max(0, layaway.total_amount - layaway.paid_amount);
}

export function getProgressPercent(layaway: Pick<Layaway, "total_amount" | "paid_amount">): number {
  if (layaway.total_amount === 0) return 100;
  return Math.min(100, Math.round((layaway.paid_amount / layaway.total_amount) * 100));
}

export function extractLayawayRenewals(notes: string | null | undefined): LayawayRenewalEntry[] {
  if (!notes) return [];

  return notes
    .split(/\n\n+/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.startsWith("[Renovación "))
    .map((chunk) => {
      const match = chunk.match(/^\[Renovación\s(.+?)\]\s*(.*)$/);
      return {
        raw: chunk,
        happenedAt: match?.[1] || "",
        note: match?.[2] || chunk,
      };
    });
}

export function getLayawayGeneralNotes(notes: string | null | undefined): string {
  if (!notes) return "";
  return notes
    .split(/\n\n+/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk && !chunk.startsWith("[Renovación "))
    .join("\n\n");
}

export function customerDisplayName(customer: Layaway["customer"]): string {
  if (!customer) return "—";
  if (customer.business_name) return customer.business_name;
  return [customer.first_name, customer.last_name].filter(Boolean).join(" ") || "Sin nombre";
}