-- =====================================================
-- Performance Indexes — Ventuki POS SaaS
-- Date: 2026-04-15
-- Author: Agent 1 - DevOps/Security
-- Purpose: Optimize frequently queried columns and foreign keys
-- =====================================================

-- TABLAS TRANSACCIONALES

-- sales: búsqueda por fecha + empresa + sucursal (dashboard KPIs)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_company_branch_created 
ON sales(company_id, branch_id, created_at DESC);

-- sales: búsqueda por cliente
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_customer 
ON sales(customer_id) WHERE customer_id IS NOT NULL;

-- sales: búsqueda por status (corte de caja)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_status 
ON sales(status) WHERE status IS NOT NULL;

-- sale_lines: búsqueda por sale_id (detalle de venta)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sale_lines_sale 
ON sale_lines(sale_id);

-- sale_lines: búsqueda por producto (devoluciones, reportes)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sale_lines_product 
ON sale_lines(product_id);

-- purchases: búsqueda por fecha + empresa + sucursal
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_purchases_company_branch_created 
ON purchases(company_id, branch_id, created_at DESC);

-- purchase_lines: búsqueda por purchase_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_purchase_lines_purchase 
ON purchase_lines(purchase_id);

-- purchase_lines: búsqueda por producto
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_purchase_lines_product 
ON purchase_lines(product_id);

-- INVENTARIO

-- inventory_movements: búsqueda por almacén + fecha (reporte de movimientos)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_movements_warehouse_created 
ON inventory_movements(warehouse_id, created_at DESC);

-- inventory_movements: búsqueda por producto + tipo (kardex)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_movements_product_type 
ON inventory_movements(product_id, movement_type);

-- inventory_stock: búsqueda por almacén + producto (stock actual)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_stock_warehouse_product 
ON inventory_stock(warehouse_id, product_id);

-- inventory_stock: búsqueda por empresa + almacén (sumario)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_stock_company_warehouse 
ON inventory_stock(company_id, warehouse_id);

-- CAJA

-- cash_sessions: búsqueda por sucursal + status (corte de caja)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cash_sessions_branch_status 
ON cash_sessions(branch_id, status) WHERE status IS NOT NULL;

-- cash_sessions: búsqueda por fecha de apertura
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cash_sessions_opened_at 
ON cash_sessions(opened_at DESC);

-- CATÁLOGOS (solo si tienen company_id — verificar)

-- products: búsqueda por empresa + nombre (POS search)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_company_name 
ON products(company_id, name) WHERE name IS NOT NULL;

-- products: búsqueda por código de barras
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_barcode 
ON products(barcode) WHERE barcode IS NOT NULL;

-- customers: búsqueda por empresa + nombre
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_company_name 
ON customers(company_id, name) WHERE name IS NOT NULL;

-- customers: búsqueda por email
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_email 
ON customers(email) WHERE email IS NOT NULL;

-- AUDIT LOGS (high volume — partition-ready)

-- system_audit_logs: búsqueda por empresa + fecha (logs de auditoría)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_audit_logs_company_created 
ON system_audit_logs(company_id, created_at DESC);

-- system_audit_logs: búsqueda por usuario
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_audit_logs_user 
ON system_audit_logs(user_id) WHERE user_id IS NOT NULL;

-- system_audit_logs: búsqueda por acción + tabla
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_audit_logs_action_table 
ON system_audit_logs(action, table_name) WHERE action IS NOT NULL;

-- NOTES:
-- 1. CONCURRENTLY avoids locking tables during index creation
-- 2. Partial indexes (WHERE clause) reduce index size for sparse columns
-- 3. For high-volume tables (system_audit_logs), consider partitioning by date
-- 4. Run ANALYZE after index creation to update statistics