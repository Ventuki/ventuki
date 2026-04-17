// ─── Types ──────────────────────────────────────────────────────────────────

export interface Layaway {
  id: string;
  company_id: string;
  branch_id: string;
  customer_id: string;
  status: "active" | "completed" | "cancelled";
  total_amount: number;
  paid_amount: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  due_date: string | null;
  notes: string | null;
  // Joined fields
  customer?: {
    id: string;
    first_name: string;
    last_name: string | null;
    business_name: string | null;
  };
  created_by_user?: {
    id: string;
    full_name: string;
  };
}

export interface LayawayItem {
  id: string;
  layaway_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  reserved_stock: number;
  created_at: string;
  product?: {
    id: string;
    name: string;
    sku: string | null;
  };
}

export interface LayawayPayment {
  id: string;
  layaway_id: string;
  amount: number;
  payment_method: "cash" | "card" | "transfer" | "mixed";
  payment_details: Record<string, unknown> | null;
  created_by: string;
  created_at: string;
  created_by_user?: {
    id: string;
    full_name: string;
  };
}

export interface LayawayDetail extends Layaway {
  items: LayawayItem[];
  payments: LayawayPayment[];
}

export interface CreateLayawayInput {
  branch_id: string;
  customer_id: string;
  items: {
    product_id: string;
    quantity: number;
    unit_price: number;
  }[];
  due_date?: string;
  notes?: string;
}

export interface LayawayFilters {
  status?: "active" | "completed" | "cancelled";
  customer_id?: string;
  from_date?: string;
  to_date?: string;
}

export interface AddPaymentInput {
  layaway_id: string;
  amount: number;
  payment_method: "cash" | "card" | "transfer" | "mixed";
  payment_details?: Record<string, unknown>;
}