import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Zod Schemas ────────────────────────────────────────────────────────────

const CreateLayawayItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().positive("La cantidad debe ser mayor a 0"),
  unit_price: z.number().nonnegative("El precio no puede ser negativo"),
});

const CreateLayawaySchema = z.object({
  branch_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  items: z.array(CreateLayawayItemSchema).min(1, "Al menos un producto es requerido"),
  due_date: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

const AddPaymentSchema = z.object({
  layaway_id: z.string().uuid(),
  amount: z.number().positive("El monto debe ser mayor a 0"),
  payment_method: z.enum(["cash", "card", "transfer", "mixed"]),
  payment_details: z.record(z.unknown()).optional(),
});

const CancelLayawaySchema = z.object({
  layaway_id: z.string().uuid(),
});

const GetLayawaysSchema = z.object({
  status: z.enum(["active", "completed", "cancelled"]).optional(),
  customer_id: z.string().uuid().optional(),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
});

const GetLayawayDetailSchema = z.object({
  layaway_id: z.string().uuid(),
});

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getUserCompanyAndRole(supabase: ReturnType<typeof createClient>, authHeader: string) {
  const { data: { user }, error } = await supabase.auth.getUser(
    authHeader.replace("Bearer ", "")
  );
  if (error || !user) throw new Error("Unauthorized");
  return user;
}

async function getUserBranch(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await supabase
    .from("user_company_roles")
    .select("branch_id, company_id, role")
    .eq("user_id", userId)
    .limit(1)
    .single();
  if (error || !data) throw new Error("No se encontró la relación usuario/empresa");
  return data;
}

function errorResponse(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── Actions ────────────────────────────────────────────────────────────────

async function handleCreateLayaway(
  supabase: ReturnType<typeof createClient>,
  payload: z.infer<typeof CreateLayawaySchema>,
  userId: string,
  companyId: string
) {
  // 1) Validar cliente existe y está activo
  const { data: customer, error: custError } = await supabase
    .from("customers")
    .select("id, is_active, company_id")
    .eq("id", payload.customer_id)
    .single();

  if (custError || !customer) {
    return errorResponse("Cliente no encontrado");
  }
  if (!customer.is_active) {
    return errorResponse("El cliente no está activo");
  }
  if (customer.company_id !== companyId) {
    return errorResponse("El cliente no pertenece a esta empresa");
  }

  // 2) Validar stock disponible para cada producto
  for (const item of payload.items) {
    // Buscar stock_levels del producto (cualquier almacén de la empresa)
    const { data: stock, error: stockError } = await supabase
      .from("stock_levels")
      .select("id, quantity, reserved_qty")
      .eq("company_id", companyId)
      .eq("product_id", item.product_id)
      .limit(1)
      .single();

    const available = stock ? Number(stock.quantity) - Number(stock.reserved_qty || 0) : 0;

    if (Number(stockError?.code === "PGRST116" ? 0 : stock?.quantity ?? 0) < item.quantity) {
      // Intento con o sin reserved_qty
      const { data: stock2 } = await supabase
        .from("stock_levels")
        .select("quantity, reserved_qty")
        .eq("company_id", companyId)
        .eq("product_id", item.product_id)
        .single();

      const available2 = stock2
        ? Number(stock2.quantity) - Number(stock2.reserved_qty || 0)
        : 0;

      if (available2 < item.quantity) {
        return errorResponse(
          `Stock insuficiente para el producto ${item.product_id}. Disponible: ${available2}`
        );
      }
    }
  }

  // 3) Calcular total_amount
  const total_amount = payload.items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );

  // 4) Crear el layaway
  const { data: layaway, error: layawayError } = await supabase
    .from("layaways")
    .insert({
      company_id: companyId,
      branch_id: payload.branch_id,
      customer_id: payload.customer_id,
      status: "active",
      total_amount,
      paid_amount: 0,
      created_by: userId,
      due_date: payload.due_date || null,
      notes: payload.notes || null,
    })
    .select()
    .single();

  if (layawayError) {
    return errorResponse("Error al crear el apartado: " + layawayError.message);
  }

  // 5) Crear los items y reservar stock
  for (const item of payload.items) {
    // Marcar reserved_qty en stock_levels
    await supabase.rpc("reserve_stock", {
      p_product_id: item.product_id,
      p_warehouse_id: null, // se reserva sin warehouse específico; se usa el primero disponible
      p_quantity: item.quantity,
    }).catch(() => {
      // Si no existe la función, se omite (el reserved_stock queda en layaway_items nomás)
    });

    const { error: itemError } = await supabase
      .from("layaway_items")
      .insert({
        layaway_id: layaway.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        reserved_stock: item.quantity,
      });

    if (itemError) {
      // Rollback: eliminar layaway y items
      await supabase.from("layaways").delete().eq("id", layaway.id);
      return errorResponse("Error al guardar los items: " + itemError.message);
    }
  }

  return new Response(JSON.stringify({ data: layaway }), {
    status: 201,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleAddPayment(
  supabase: ReturnType<typeof createClient>,
  payload: z.infer<typeof AddPaymentSchema>,
  userId: string
) {
  // 1) Obtener layaway
  const { data: layaway, error: layawayError } = await supabase
    .from("layaways")
    .select("id, company_id, branch_id, status, total_amount, paid_amount")
    .eq("id", payload.layaway_id)
    .single();

  if (layawayError || !layaway) {
    return errorResponse("Apartado no encontrado");
  }
  if (layaway.status !== "active") {
    return errorResponse(`No se pueden agregar pagos a un apartado con estatus "${layaway.status}"`);
  }

  const remaining = Number(layaway.total_amount) - Number(layaway.paid_amount);
  if (payload.amount > remaining + 0.01) { // pequeña tolerancia float
    return errorResponse(
      `El monto excede lo faltante. Restan $${remaining.toFixed(2)}`
    );
  }

  // 2) Insertar pago
  const { data: payment, error: paymentError } = await supabase
    .from("layaway_payments")
    .insert({
      layaway_id: payload.layaway_id,
      amount: payload.amount,
      payment_method: payload.payment_method,
      payment_details: payload.payment_details || null,
      created_by: userId,
    })
    .select()
    .single();

  if (paymentError) {
    return errorResponse("Error al registrar el pago: " + paymentError.message);
  }

  // 3) Actualizar paid_amount y posiblemente status
  const new_paid = Number(layaway.paid_amount) + payload.amount;
  const is_completed = new_paid >= Number(layaway.total_amount) - 0.01;

  const { data: updated, error: updateError } = await supabase
    .from("layaways")
    .update({
      paid_amount: new_paid,
      status: is_completed ? "completed" : layaway.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payload.layaway_id)
    .select()
    .single();

  if (updateError) {
    return errorResponse("Error al actualizar el apartado: " + updateError.message);
  }

  // 4) Si se completó, crear una Sale y ajustar inventario
  if (is_completed) {
    // Obtener items del layaway
    const { data: items } = await supabase
      .from("layaway_items")
      .select("product_id, quantity, unit_price")
      .eq("layaway_id", payload.layaway_id);

    if (items && items.length > 0) {
      // Llamar al RPC de venta para crear la sale completa
      const salePayload = {
        company_id: layaway.company_id,
        branch_id: layaway.branch_id,
        warehouse_id: null, // se usa default
        customer_id: layaway.customer_id,
        cashier_user_id: userId,
        subtotal: Number(layaway.total_amount),
        total: Number(layaway.total_amount),
        status: "completed",
        notes: `Apartado completado #${payload.layaway_id.slice(0, 8)}`,
      };

      const cartLines = items.map((it: any) => ({
        product_id: it.product_id,
        quantity: Number(it.quantity),
        unit_price: Number(it.unit_price),
      }));

      await supabase.rpc("process_sale_transaction", {
        p_sale_params: salePayload,
        p_cart_lines: cartLines,
        p_payments: [{ method: payload.payment_method, amount: payload.amount }],
      }).catch(() => {
        // Si falla el RPC de venta, no bloqueamos — el apartado ya quedó completado
      });
    }
  }

  return new Response(JSON.stringify({ data: { layaway: updated, payment } }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleCancelLayaway(
  supabase: ReturnType<typeof createClient>,
  payload: z.infer<typeof CancelLayawaySchema>
) {
  const { data: layaway, error: layawayError } = await supabase
    .from("layaways")
    .select("id, company_id, status")
    .eq("id", payload.layaway_id)
    .single();

  if (layawayError || !layaway) {
    return errorResponse("Apartado no encontrado");
  }
  if (layaway.status !== "active") {
    return errorResponse(`No se puede cancelar un apartado con estatus "${layaway.status}"`);
  }

  const { data: cancelled, error: cancelError } = await supabase
    .from("layaways")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", payload.layaway_id)
    .select()
    .single();

  if (cancelError) {
    return errorResponse("Error al cancelar el apartado: " + cancelError.message);
  }

  return new Response(JSON.stringify({ data: cancelled }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleGetLayaways(
  supabase: ReturnType<typeof createClient>,
  params: z.infer<typeof GetLayawaysSchema>,
  companyId: string
) {
  let query = supabase
    .from("layaways")
    .select(`
      id,
      status,
      total_amount,
      paid_amount,
      due_date,
      notes,
      created_at,
      updated_at,
      customer:customers(id, first_name, last_name, business_name),
      created_by_user:users!layaways_created_by_fkey(id, full_name)
    `)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (params.status) {
    query = query.eq("status", params.status);
  }
  if (params.customer_id) {
    query = query.eq("customer_id", params.customer_id);
  }
  if (params.from_date) {
    query = query.gte("created_at", params.from_date);
  }
  if (params.to_date) {
    query = query.lte("created_at", params.to_date + "T23:59:59.999Z");
  }

  const { data, error } = await query;
  if (error) return errorResponse("Error al obtener apartados: " + error.message);

  return new Response(JSON.stringify({ data: data || [] }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleGetLayawayDetail(
  supabase: ReturnType<typeof createClient>,
  params: z.infer<typeof GetLayawayDetailSchema>,
  companyId: string
) {
  const { data: layaway, error: layawayError } = await supabase
    .from("layaways")
    .select(`
      id,
      status,
      total_amount,
      paid_amount,
      due_date,
      notes,
      created_at,
      updated_at,
      customer:customers(id, first_name, last_name, business_name, email, phone),
      created_by_user:users!layaways_created_by_fkey(id, full_name),
      branch_id
    `)
    .eq("id", params.layaway_id)
    .eq("company_id", companyId)
    .single();

  if (layawayError || !layaway) {
    return errorResponse("Apartado no encontrado");
  }

  const { data: items } = await supabase
    .from("layaway_items")
    .select(`
      id,
      product_id,
      quantity,
      unit_price,
      reserved_stock,
      created_at,
      product:products(id, name, sku)
    `)
    .eq("layaway_id", params.layaway_id);

  const { data: payments } = await supabase
    .from("layaway_payments")
    .select(`
      id,
      amount,
      payment_method,
      payment_details,
      created_at,
      created_by_user:users!layaway_payments_created_by_fkey(id, full_name)
    `)
    .eq("layaway_id", params.layaway_id)
    .order("created_at", { ascending: true });

  return new Response(JSON.stringify({
    data: { ...layaway, items: items || [], payments: payments || [] }
  }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── Main Handler ────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return errorResponse("Missing authorization header", 401);
    }

    const body = await req.json();
    const { action, ...payload } = body;

    if (!action) {
      return errorResponse("Se requiere el campo 'action'");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    const user = await getUserCompanyAndRole(supabase, authHeader);
    const branchData = await getUserBranch(supabase, user.id);
    const { company_id } = branchData;

    switch (action) {
      case "create_layaway": {
        const parsed = CreateLayawaySchema.safeParse(payload);
        if (!parsed.success) {
          return errorResponse("Datos inválidos: " + parsed.error.message);
        }
        return handleCreateLayaway(supabase, parsed.data, user.id, company_id);
      }
      case "add_payment": {
        const parsed = AddPaymentSchema.safeParse(payload);
        if (!parsed.success) {
          return errorResponse("Datos inválidos: " + parsed.error.message);
        }
        return handleAddPayment(supabase, parsed.data, user.id);
      }
      case "cancel_layaway": {
        const parsed = CancelLayawaySchema.safeParse(payload);
        if (!parsed.success) {
          return errorResponse("Datos inválidos: " + parsed.error.message);
        }
        return handleCancelLayaway(supabase, parsed.data);
      }
      case "get_layaways": {
        const parsed = GetLayawaysSchema.safeParse(payload);
        if (!parsed.success) {
          return errorResponse("Datos inválidos: " + parsed.error.message);
        }
        return handleGetLayaways(supabase, parsed.data, company_id);
      }
      case "get_layaway_detail": {
        const parsed = GetLayawayDetailSchema.safeParse(payload);
        if (!parsed.success) {
          return errorResponse("Datos inválidos: " + parsed.error.message);
        }
        return handleGetLayawayDetail(supabase, parsed.data, company_id);
      }
      default:
        return errorResponse(`Acción desconocida: ${action}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return errorResponse(message, 500);
  }
});