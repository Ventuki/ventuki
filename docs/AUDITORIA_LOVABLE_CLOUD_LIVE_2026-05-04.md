# Auditoria live de Lovable cloud

Fecha: 2026-05-04  
Proyecto cloud: `mngviqaoyjsbsukxwgau`  
Metodo: consultas HTTP reales a Supabase (`rest/v1` y `functions/v1`) usando credenciales de frontend (rol publico).

## 1) Resultado de conectividad

- Conexion a PostgREST cloud: exitosa.
- Consulta de prueba a `companies`: HTTP 200.
- La app local esta apuntando directamente a nube (no a un contenedor DB local).

## 2) Estado observado de tablas (live)

### Tablas accesibles (HTTP 200)
`audit_logs`, `branches`, `brands`, `cash_movements`, `cash_register_sessions`, `cash_registers`, `categories`, `companies`, `company_users`, `customer_types`, `customers`, `payment_methods`, `permissions`, `price_lists`, `product_barcodes`, `product_prices`, `products`, `purchase_items`, `purchases`, `role_permissions`, `roles`, `sale_items`, `sale_payments`, `sales`, `stock_levels`, `stock_movements`, `supplier_types`, `suppliers`, `tax_profiles`, `units`, `user_profiles`, `warehouses`.

### Tablas reportadas como no encontradas (HTTP 404)
`physical_counts`, `physical_count_items`, `layaways`, `layaway_items`, `layaway_payments`, `invoices`, `invoice_items`, `credit_notes`, `inventory_transfers`, `purchase_receipts`.

Interpretacion:
- Parte del modelo transaccional avanzado esperado localmente no se encuentra disponible en el endpoint cloud con el rol evaluado.
- Esto sugiere drift significativo de despliegue o de grants/politicas para rol publico.

## 3) Estado observado de RPC y Edge Functions

### RPC
- Las RPC criticas probadas (`process_sale_transaction`, `process_layaway`, `receive_purchase`, `adjust_stock`, `get_daily_sales_report`, etc.) respondieron `404 PGRST202`.
- Este codigo indica que PostgREST no encontro la firma invocable con los parametros probados desde rol publico.

### Edge Functions
- Endpoints probados: `onboard-company`, `invoicing`.
- Respuesta en ambos casos: `404 NOT_FOUND`.

Interpretacion:
- No hay evidencia de despliegue activo de estas edge functions en el proyecto cloud evaluado (o no existen con esos nombres en ese proyecto).

## 4) Limites de esta auditoria live

- Con credenciales de frontend no es posible leer directamente:
  - `supabase_migrations.schema_migrations`
  - definicion completa de RLS por tabla
  - catalogo interno de funciones SQL con metadatos completos
- Para auditoria total se requiere token de administracion o rol con privilegios de lectura de metadata.

## 5) Conclusiones del estado cloud

1. El endpoint cloud esta vivo y responde.
2. Hay desalineacion importante entre capacidades esperadas por el codigo y lo observable en cloud.
3. Falta evidencia de despliegue de edge functions criticas.
4. Existen brechas estructurales en tablas y RPC necesarias para flujos (inventario avanzado, apartados, facturacion, conteos fisicos).
