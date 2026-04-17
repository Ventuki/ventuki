-- Security & Performance Indexes Migration
-- Phase: Security Hardening (Agent 1 - DevOps/Security)
-- Fecha: 2026-04-15
-- Propósito: Índices para queries frecuentes del dashboard POS y auditoría

-- ============================================================================
-- DASHBOARD KPIs — Ventas y Compras por periodo/companía/sucursal
-- ============================================================================

-- Ventas por compañía/sucursal/fecha (dashboard principal)
CREATE INDEX IF NOT EXISTS idx_sales_company_branch_created
  ON public.sales(company_id, branch_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Compras por compañía/sucursal/fecha (dashboard principal)
CREATE INDEX IF NOT EXISTS idx_purchases_company_branch_created
  ON public.purchases(company_id, branch_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- POS SEARCH — Búsqueda rápida de productos por nombre (GIN trigram)
-- ============================================================================

-- Búsqueda de productos por nombre con LIKE/ILIKE rápido (POS search bar)
CREATE INDEX IF NOT EXISTS idx_products_company_name_gin
  ON public.products USING gin(company_id, name gin_trgm_ops);

-- Búsqueda por código de barras (productos)
CREATE INDEX IF NOT EXISTS idx_product_barcodes_company_product
  ON public.product_barcodes(company_id, product_id);

-- ============================================================================
-- INVENTARIO — Movimientos de stock para auditoría y reconcile
-- ============================================================================

-- Movimientos de inventario por almacén/producto/fecha
CREATE INDEX IF NOT EXISTS idx_stock_movements_company_warehouse_product_date
  ON public.stock_movements(company_id, warehouse_id, product_id, created_at DESC);

-- Nivel de stock por almacén/producto (lookups frecuentes)
CREATE INDEX IF NOT EXISTS idx_stock_levels_company_warehouse_product
  ON public.stock_levels(company_id, warehouse_id, product_id)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- FINANCIALES — Clientes, sesiones, pagos
-- ============================================================================

-- Clientes por company_id + tax_id (búsqueda RFC)
CREATE INDEX IF NOT EXISTS idx_customers_company_tax_id
  ON public.customers(company_id, tax_id)
  WHERE tax_id IS NOT NULL AND deleted_at IS NULL;

-- Sesiones de caja abiertas (cajero ve su sesión activa)
CREATE INDEX IF NOT EXISTS idx_cash_register_sessions_active
  ON public.cash_register_sessions(branch_id, status, opened_at DESC)
  WHERE status = 'open';

-- Pagos de venta por sale_id (reconstruir transacciones)
CREATE INDEX IF NOT EXISTS idx_sale_payments_sale_id
  ON public.sale_payments(sale_id);

-- Líneas de venta por sale_id
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id
  ON public.sale_items(sale_id);

-- ============================================================================
-- AUDIT LOGS — Consulta eficiente por compañía/módulo/fecha
-- ============================================================================

-- Logs de auditoría por compañía + módulo + fecha
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_module_created
  ON public.audit_logs(company_id, module, created_at DESC);

-- ============================================================================
-- COMPRAS — Recepciones y receipts
-- ============================================================================

-- Purchase receipts por purchase_id (reconstruir órdenes)
CREATE INDEX IF NOT EXISTS idx_purchase_receipts_purchase_id
  ON public.purchase_receipts(purchase_id)
  WHERE deleted_at IS NULL;

-- Líneas de receipt por receipt_id
CREATE INDEX IF NOT EXISTS idx_purchase_receipt_items_receipt_id
  ON public.purchase_receipt_items(receipt_id);

-- ============================================================================
-- INVENTARIO TRANSFERENCIAS — Rastreo de transferencias entre almacenes
-- ============================================================================

-- Transferencias por compañía/sucursal/estado/fecha
CREATE INDEX IF NOT EXISTS idx_inventory_transfers_company_branch_status
  ON public.inventory_transfers(company_id, branch_id, status, created_at DESC)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- INVENTORY COUNTS — Conteos físicos
-- ============================================================================

-- Conteos físicos por compañía/sucursal/estado/fecha
CREATE INDEX IF NOT EXISTS idx_physical_counts_company_branch_status
  ON public.physical_counts(company_id, branch_id, status, created_at DESC)
  WHERE deleted_at IS NULL;

-- Ítems de conteo físico por physical_count_id + producto
CREATE INDEX IF NOT EXISTS idx_physical_count_items_count_product
  ON public.physical_count_items(physical_count_id, product_id);