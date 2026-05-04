# Baseline de base de datos local

Fecha: 2026-05-04  
Fuente: `supabase/migrations`, `src/integrations/supabase/types.ts`, SQL auxiliares en `src/supabase`

## 1) Resumen tecnico

- Stack DB: Supabase Postgres con RLS.
- Archivos de migracion detectados: 35.
- Objetos relevantes detectados en migraciones:
  - 17 tablas creadas directamente (patron `CREATE TABLE IF NOT EXISTS public.*`).
  - 30 funciones SQL (`CREATE [OR REPLACE] FUNCTION public.*`).
  - 168 politicas RLS (`CREATE POLICY`).
  - 44 habilitaciones RLS (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).

## 2) Entidades principales del modelo local

### Core negocio
- Ventas: `sales`, `sale_items`, `sale_payments`
- Compras: `purchases`, `purchase_items`, `inventory_transfers`
- Caja: `cash_register_sessions`, `cash_movements`
- Inventario: `stock_levels`, `stock_movements`, `physical_counts`, `physical_count_items`
- Apartados: `layaways`, `layaway_items`, `layaway_payments`

### Seguridad y permisos
- `roles`, `permissions`, `role_permissions`, `user_permissions_cache`, `user_roles`

## 3) Funciones/RPC esperadas localmente (extracto)

- `process_sale_transaction`
- `process_sale_payment`
- `create_purchase_with_items`
- `receive_purchase`
- `adjust_stock`
- `transfer_stock`
- `reserve_stock`
- `calculate_cash_session_totals`
- `create_physical_count_with_items`
- `post_physical_count`
- `process_purchase_transaction`
- `get_daily_sales_report`
- `get_pos_products_search`
- `onboard_company`

## 4) Hallazgos de calidad de migraciones

### A. Sentencias SQL potencialmente invalidas (corregidas en repo, 2026-05-04)
Se corrigieron patrones `DROP POLICY ... FOR ...` y se restauraron los `CREATE POLICY` que habian quedado omitidos en:
- `/home/kali/Downloads/ventuki/supabase/migrations/20260415120000_layaways_module.sql`
- `/home/kali/Downloads/ventuki/supabase/migrations/20260408110000_fase2_purchases_transfers_cash.sql`

Nota: en PostgreSQL, `DROP POLICY` solo admite `ON tabla`; la forma valida es `DROP POLICY IF EXISTS "nombre" ON schema.tabla;` seguida del `CREATE POLICY` correspondiente.

La aplicacion de estos cambios en una base ya desplegada corresponde a BKL-006 (migracion nueva o reaplicacion controlada), no solo al archivo historico.

### B. Drift por referencias legacy
En migraciones de hardening aparecen referencias historicas no alineadas con el modelo activo (ejemplos reportados previamente): `sale_lines`, `purchase_lines`, `inventory_stock`, `inventory_movements`, `user_company_roles`.

### C. Drift tipos vs SQL
`types.ts` no refleja todas las entidades declaradas en migraciones de fases avanzadas (especialmente facturacion y apartados), lo que genera uso de cast `as any` en varias capas.

## 5) Riesgo operacional local

- Alto: discrepancia entre SQL de migraciones y tipos/consumo frontend.
- Alto: politicas y funciones con trazabilidad parcial (redefiniciones en varias fases).
- Medio: ausencia de pipeline automatizado de verificacion de drift (migracion/tipos/RPC).

## 6) Recomendaciones inmediatas

1. Corregir migraciones con sintaxis invalida y congelar baseline limpio.
2. Regenerar `types.ts` desde esquema objetivo.
3. Definir lista canonica de RPC y contratos de parametros.
4. Agregar validacion CI para:
   - migraciones aplicables en entorno limpio
   - comparacion de tipos generados contra version en repo
   - smoke test RPC criticas por modulo.
