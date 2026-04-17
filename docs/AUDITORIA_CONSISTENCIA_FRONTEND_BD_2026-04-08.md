# Auditoría de Consistencia Frontend ↔ Base de Datos (POS SaaS)

Fecha: 2026-04-08

## Skill aplicada
Se aplicó el enfoque de la skill **supabase-postgres-best-practices** para revisar consistencia de esquema, CRUD y relaciones en tablas Supabase.

## 1) Resumen general

- **Pantallas auditadas:** 16 rutas/pantallas (incluyendo autenticación y NotFound).
- **Pantallas con interacción de datos:** 11.
- **Hallazgos totales:** 24.
  - 🔴 Críticos: 6
  - 🟠 Medios: 11
  - 🟡 Mejora: 7

### Principales problemas detectados
1. **Desalineación crítica en `customers`:** frontend usa `full_name` y `tax_regime`, pero el esquema tipado actual expone `first_name`, `last_name`, `business_name` y no `tax_regime`.
2. **Edición de productos incompleta:** pantalla espera precio/costo/lista en el objeto `product`, pero el servicio devuelve esos datos por separado.
3. **Flujo de compras no atómico:** se inserta cabecera y después partidas en llamadas separadas.
4. **Validación de `tax_rate` inconsistente en compras:** esquema espera [0..1], UI sugiere porcentaje libre (ej. 16).
5. **Tipos de Supabase desactualizados vs migraciones:** `suppliers` en tipos no incluye `payment_terms_days` ni `commercial_status`.
6. **POS limitado a pago en efectivo y `customer_id` fijo en null.**

---

## 2) Inventario de pantallas auditadas

1. `/auth/login` (Login)
2. `/auth/register` (Registro)
3. `/auth/forgot-password` (Recuperación)
4. `/reset-password` (Reset)
5. `/auth/select-company` (Selección empresa/sucursal)
6. `/onboarding` (Alta inicial empresa)
7. `/` (Dashboard)
8. `/settings` (Catálogos)
9. `/products` (Productos)
10. `/inventory` (Inventario)
11. `/suppliers` (Proveedores)
12. `/customers` (Clientes)
13. `/purchases` (Compras)
14. `/pos` (Punto de venta)
15. `*` NotFound
16. `POSScreen` (pantalla composicional interna sin ruta propia)

---

## 3) Hallazgos por pantalla (tabla consolidada)

| Pantalla | Campo Frontend | Campo BD | Estado | Problema | Recomendación |
|---|---|---|---|---|---|
| Login | email/password | Auth (no tabla pública) | ✅ | Usa `supabase.auth.signInWithPassword` | Mantener y auditar políticas de contraseña |
| Register | firstName/lastName | `auth.users.user_metadata` | ✅ | Metadata guardada fuera de `public` | Sincronizar opcionalmente con `user_profiles` |
| Forgot/Reset | email/password | Auth | ✅ | Flujo correcto con Supabase Auth | Agregar métricas de intentos fallidos |
| Select Company | company_id/role/company fields | `company_users`, `companies`, `branches` | ✅ | Mapeo correcto y FKs válidas | Añadir fallback robusto de sucursal por rol |
| Onboarding | company/branch/warehouse fields | RPC `onboard_company` (`companies`, `company_users`, `branches`, `warehouses`) | ✅ | Mapeo correcto por Edge Function | Añadir validación de unicidad de slug previa |
| Dashboard | todaySales, transactions, products, customers | `sales.total`, `products`, `customers` | 🟠 | Orden de gráfica por string formateado puede desordenar cronología | Ordenar por fecha ISO antes de formatear |
| Settings Catálogos | code,name,description,is_active,is_default,tax_rate,sort_order | `categories`,`brands`,`units`,`payment_methods`,`price_lists`,`tax_profiles`,`customer_types`,`supplier_types` | ✅ | Mapeo general correcto | Agregar validaciones Zod por catálogo |
| Products | sku,name,description,brand/category/unit,barcode,price/cost/lista | `products`, `product_barcodes`, `product_prices` | 🟠 | Campos `manage_stock`,`initial_stock`,`warehouse_id` no existen en `products` (son de flujo) | Documentar DTO por capa y distinguir campos transitorios |
| Products (editar) | price/cost/price_list_id en formulario de edición | `product_prices` | 🔴 | `getProductDetails` no retorna precio/costo/lista al caller; formulario rellena en 0/empty | Retornar `price`,`cost`,`price_list_id` y mapearlos correctamente |
| Products (validación) | manage_stock + warehouse_id | `stock_levels`/`adjust_stock` | 🟠 | No hay regla condicional estricta “si manage_stock entonces warehouse requerido” en schema del form UI | Usar refine en schema del formulario |
| Inventory | filtros, ajuste, transferencia, kardex | `stock_levels`,`stock_movements`, RPC `adjust_stock` | ✅ | Flujo principal consistente | Añadir pruebas de concurrencia y bloqueo optimista |
| Inventory (conteo físico) | folio de conteo | tabla inexistente | 🟠 | UI no persiste datos, posible falsa expectativa de usuario | Implementar tabla `physical_counts` + CRUD o marcar “próximamente” |
| Suppliers | code,name,contact,phone,email,tax_id,address,notes,is_active | `suppliers` | ✅ | Mapeo base correcto | Incluir en formulario campos comerciales nuevos |
| Suppliers (tipos) | payment_terms_days/commercial_status | `suppliers` (migración sí), `types.ts` (no) | 🟠 | Tipado generado desactualizado respecto a migración | Regenerar `src/integrations/supabase/types.ts` |
| Customers | full_name,tax_regime | `customers` (`first_name`,`last_name`,`business_name`, sin `tax_regime` en tipos) | 🔴 | Desfase de naming/columnas: selects/inserts usan campos que no aparecen en schema tipado actual | Unificar contrato: usar `first_name`+`last_name` o crear columna/vista `full_name` |
| Customers (CRUD) | search/get/upsert con `full_name` | `customers` | 🔴 | Riesgo de error SQL en runtime por columna inexistente | Corregir repositorio + migración de compatibilidad |
| Purchases | branch,supplier,folio,expected_date,notes,items | `purchases`,`purchase_items` | ✅ | Mapeo base correcto | Encapsular en RPC transaccional |
| Purchases (atomicidad) | create purchase + items | `purchases` + `purchase_items` | 🔴 | Operación no atómica (2 inserts) | Crear RPC `create_purchase_with_items` |
| Purchases (tax_rate) | input tax rate libre | `purchase_items.tax_rate` + schema | 🟠 | Schema exige 0..1; UX no guía % vs fracción | Aceptar 0..100 y normalizar, o renombrar etiqueta “tasa decimal” |
| POS | búsqueda/add cart/pago | `products`,`product_prices`,`stock_levels`,`sales`,`sale_payments` | ✅ | Flujo principal consistente con RPC | Añadir contrato de payment method desde catálogo |
| POS (pago) | método hardcoded `cash` | `sale_payments.method` + `payment_methods` | 🟠 | No aprovecha catálogo de métodos ni validación contra maestro | Cargar métodos activos y seleccionar en UI |
| POS (cliente) | customer_id | `sales.customer_id` | 🟠 | Siempre `null`; desaprovecha relación FK con clientes | Selector opcional de cliente en carrito |
| POS (warehouse fallback) | `warehouse_id || branch.id` | `sales.warehouse_id` FK -> `warehouses.id` | 🔴 | Si no hay warehouse cargado, podría enviar branch_id inválido como warehouse_id | Bloquear cobro sin warehouse válido |
| NotFound / POSScreen | sin campos persistidos | N/A | ✅ | Sin impacto BD | Sin acción |

---

## 4) Errores críticos (detalle)

### 🔴 C1 — Mismatch de columnas en Clientes
- **Qué está mal:** frontend usa `full_name` y `tax_regime` en consultas/mutaciones de `customers`.
- **Por qué ocurre:** el esquema tipado actual de `customers` no define esas columnas; define `first_name`, `last_name`, `business_name`.
- **Cómo corregir:**
  1. Opción A: migrar frontend a `first_name`/`last_name` + `business_name`.
  2. Opción B: agregar columna `full_name` (o vista) y adaptar constraints.
  3. Regenerar tipos Supabase y eliminar `as any` en repositorios.

### 🔴 C2 — Edición de producto pierde precio/costo/lista
- **Qué está mal:** al editar, UI toma `product.price/cost/price_list_id` de un objeto que no trae esos campos.
- **Por qué ocurre:** servicio devuelve precio/costo/lista por separado, pero el hook devuelve solo `product` + `barcode`.
- **Cómo corregir:** retornar y mapear `price`, `cost`, `price_list_id` explícitamente en `getProductDetails`.

### 🔴 C3 — Creación de compras no atómica
- **Qué está mal:** primero inserta compra, luego items.
- **Por qué ocurre:** falta RPC transaccional.
- **Cómo corregir:** mover lógica a función SQL con rollback completo.

### 🔴 C4 — `warehouse_id` potencialmente inválido en POS
- **Qué está mal:** fallback usa `branch.id` cuando no hay almacén.
- **Por qué ocurre:** uso de fallback no tipado semánticamente.
- **Cómo corregir:** exigir warehouse activo; no permitir cobrar sin `warehouse_id` real.

### 🔴 C5 — Contrato de clientes y reportes susceptible a ruptura de runtime
- **Qué está mal:** búsquedas/listados dependen de columna `full_name` no garantizada.
- **Por qué ocurre:** drift entre schema y frontend.
- **Cómo corregir:** contrato único de dominio + pruebas de smoke para queries críticas.

### 🔴 C6 — Cobertura incompleta de catálogos en POS/capturas
- **Qué está mal:** pago solo en efectivo y sin customer link.
- **Por qué ocurre:** implementación inicial sin completar campos relacionales.
- **Cómo corregir:** habilitar selector de cliente y método de pago maestro.

---

## 5) Recomendaciones técnicas

1. **Estandarizar naming:** snake_case en DB, camelCase solo en DTO/view-model, con mapper explícito por feature.
2. **Contratos tipados compartidos:** Zod + inferencias TS para `Create/Update` por entidad.
3. **Validación compartida FE/BE:** reutilizar schemas de dominio en hooks/forms + RPC/Edge.
4. **Eliminar `as any` progresivamente:** priorizar repositorios de `customers`, `suppliers`, `purchases`, `pos`.
5. **Sincronización automática de tipos:** CI que ejecute `supabase gen types` y falle si hay drift.
6. **Pruebas QA de consistencia:** suite que valide columnas consultadas vs metadata real de BD.
7. **Operaciones críticas en RPC transaccionales:** compras, recepción, ventas complejas.

---

## 6) Propuesta de solución (roadmap)

### Fase 1 (rápida, alto impacto)
- Corregir `customers` (modelo + queries + formularios).
- Corregir mapeo edición de productos (precio/costo/lista).
- Bloquear POS si no existe `warehouse_id` válido.

### Fase 2 (estabilidad)
- RPC transaccional para alta de compras con items.
- Normalizar `tax_rate` de compras (% vs fracción).
- Regenerar tipos Supabase y limpiar `any` prioritarios.

### Fase 3 (madurez)
- Selector de cliente y métodos de pago múltiples en POS.
- Implementar módulo real de conteo físico.
- Pipeline QA automático “front-field ↔ db-column” por release.

---

## 7) Extras — scripts/ejemplos sugeridos

### A) Check automático de drift de tipos
```bash
supabase gen types typescript --project-id "$PROJECT_ID" --schema public > src/integrations/supabase/types.generated.ts
```
Comparar con `types.ts` en CI y fallar si hay diferencias.

### B) Guardrail de columnas usadas en frontend
- Parsear selects de Supabase (`.select("...")`) y validar columnas contra metadata en tests.

### C) Migración de compatibilidad para clientes (ejemplo)
```sql
-- Opción de compatibilidad temporal
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS full_name TEXT GENERATED ALWAYS AS (
    COALESCE(NULLIF(TRIM(first_name || ' ' || COALESCE(last_name,'')), ''), business_name)
  ) STORED;
```

> Nota: este workaround no sustituye definir contrato de dominio definitivo.
