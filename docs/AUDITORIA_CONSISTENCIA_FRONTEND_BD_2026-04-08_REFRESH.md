# Auditoría Exhaustiva de Consistencia Frontend ↔ Backend (DB)

Fecha: 2026-04-08  
Rol aplicado: Senior Software Architect + Database Engineer + QA Automation Specialist  
Skill usada: `supabase-postgres-best-practices` (revisión de contratos SQL/RPC, drift de esquema y riesgos de integridad).

## 1) Resumen general

- **Total de pantallas/rutas auditadas:** 16 (`/`, auth, catálogos, POS, compras, inventario, caja, facturación, reportes, not-found).
- **Pantallas con persistencia o lectura de datos:** 12.
- **Inconsistencias detectadas:** **9**
  - 🔴 Críticos: **3**
  - 🟠 Medios: **4**
  - 🟡 Mejora: **2**

### Principales problemas detectados
1. **Desalineación de modelo en Clientes**: en `customers` conviven dos contratos incompatibles (`first_name/last_name` vs `full_name/tax_regime`) dentro del frontend y POS.
2. **Query de clientes POS incompatible con esquema actual**: `select("id,full_name,tax_id")` sobre `customers` con tipado/migraciones que exponen `first_name`, `last_name`, `business_name`.
3. **Drift de tipos generados Supabase**: `types.ts` no refleja columnas comerciales nuevas en `suppliers` (`payment_terms_days`, `commercial_status`) que sí existen en migraciones y UI.
4. **Dashboard con ordenamiento cronológico frágil**: ordena por fecha formateada (`dd/MMM`) y no por fecha ISO.

---

## 2) Alcance técnico auditado

- Frontend React/TS por pantalla y formularios.
- Repositorios/servicios intermedios (`services`, `infrastructure`, `usecases`).
- Esquema DB vía migraciones SQL (`supabase/migrations`).
- Tipado de contrato DB generado (`src/integrations/supabase/types.ts`).
- Uso de RPCs para operaciones atómicas (`process_sale_payment`, `create_purchase_with_items`, `receive_purchase`, reportes).

---

## 3) Matriz de consistencia por pantalla

| Pantalla | Campo Frontend | Campo BD | Estado | Problema | Recomendación |
|---|---|---|---|---|---|
| Login / Register / Forgot / Reset | email, password, metadata usuario | Supabase Auth | ✅ | Sin drift detectado en `public` | Mantener separación Auth vs dominio |
| Select Company | company_id, branch_id, role | `company_users`, `branches`, `companies` | ✅ | Mapeo coherente | Añadir smoke test multi-rol |
| Onboarding | company/branch/warehouse | Edge Function `onboard-company` + tablas base | ✅ | Flujo consistente con creación inicial | Validar unicidad/slug antes de submit |
| Dashboard (`/`) | todaySales, todayTransactions, totalProducts, totalCustomers, chart date/total | `sales`, `products`, `customers` | 🟠 | Ordena serie por string formateado, no por fecha real | Ordenar por ISO y formatear sólo para UI |
| Settings (`/settings`) | catálogos: code, name, description, is_active, defaults, tax_rate | `categories`, `brands`, `units`, `payment_methods`, `price_lists`, `tax_profiles`, etc. | ✅ | Contratos generales consistentes | Homologar schemas zod por catálogo |
| Products (`/products`) | sku, name, brand/category/unit, barcode, price/cost/lista, stock opcional | `products`, `product_barcodes`, `product_prices`, `stock_levels` | ✅ | Flujo edición/precio ya sincronizado | Añadir prueba e2e create→edit→read |
| Inventory (`/inventory`) | filtros, ajustes, transferencias, kardex | `stock_levels`, `stock_movements`, `inventory_transfers`, RPC `adjust_stock/transfer_stock` | ✅ | CRUD principal consistente | Consolidar auditoría de transferencias |
| Inventory (panel conteo físico) | folio conteo | **Sin tabla enlazada** (`physical_counts` no implementada) | 🟡 | UI sugiere persistencia sin backend | Implementar tabla + CRUD o marcar "próximamente" |
| Suppliers (`/suppliers`) | code,name,contact,email,tax_id,address,notes,is_active,payment_terms_days,commercial_status | `suppliers` | ⚠️🟠 | UI/migraciones usan columnas comerciales, `types.ts` no las expone | Regenerar tipos Supabase y eliminar `as any` |
| Customers (`/customers`) Form/Hooks | `first_name/last_name/business_name` **y** `full_name/tax_regime` | `customers` (`first_name`,`last_name`,`business_name`, sin `tax_regime` en tipos) | ❌🔴 | Contratos cruzados en la misma pantalla (riesgo runtime/typing) | Definir contrato único (A: `first_name/last_name`; B: vista `full_name`) |
| Customers CRUD service | search/upsert/get | `customers` | ⚠️🟠 | `service` usa contrato A, `page/hook` usa contrato B | Unificar DTO de entrada/salida y adaptadores |
| Purchases (`/purchases`) create/receive/list | supplier, branch, folio, items, tax_rate, warehouse | `purchases`, `purchase_items`, RPC `create_purchase_with_items`, `receive_purchase` | ✅ | Operación crítica ahora atómica por RPC | Mantener validación de tasa (0-100 UI → 0-1 DB) |
| POS (`/pos`) venta y cobro | cart lines, payment, warehouse_id | `sales`, `sale_items`, `sale_payments`, RPC `process_sale_payment` | ✅ | Cobro atómico implementado | Extender métodos de pago dinámicos de catálogo |
| POS búsqueda cliente | query cliente | `customers` | ❌🔴 | Repositorio consulta columna `full_name` no garantizada en esquema actual | Cambiar a `first_name/last_name/business_name` o vista DB estable |
| Cash Register (`/cash-register`) | open/close session, movements | `cash_register_sessions`, `cash_movements`, RPC `calculate_cash_session_totals` | ✅ | Contrato consistente | Añadir pruebas de cierre concurrente |
| Reports (`/reports`) | filtros fecha/sucursal + agregados diarios | RPC `get_daily_sales_report` | ✅ | Usa RPC tipado por contrato único | Mantener pruebas de regresión de columnas |
| Invoicing (`/invoicing`) | CFDI y facturas/notas | `invoices`, `invoice_items`, `credit_notes` | ✅ | Operaciones principales consistentes | Fortalecer validaciones de catálogos SAT |
| NotFound | — | — | ✅ | Sin persistencia | Sin acción |

---

## 4) Validación CRUD y relaciones (hallazgos relevantes)

### Customers (🔴)
- **INSERT/UPDATE:** `saveCustomer` envía `full_name` y `tax_regime`, mientras que el formulario/servicio también usa `first_name`/`last_name`.
- **SELECT:** POS busca `full_name` en `customers`.
- **Riesgo:** queries y payloads incompatibles entre capas.
- **FKs:** `sales.customer_id → customers.id` sí está declarada, pero se degrada el valor funcional si falla búsqueda de clientes.

### Suppliers (🟠)
- **INSERT/UPDATE:** payload incluye columnas comerciales nuevas.
- **SELECT:** listado también las consulta.
- **Riesgo:** el tipado generado no las conoce, aumentando `as any` y ocultando errores.
- **FKs:** `company_id` correcta; riesgo principal es de contrato/tipado, no de relación.

### Dashboard (🟠)
- **READ:** agregado mensual correcto, pero sort final por etiqueta visual.
- **Riesgo:** orden no cronológico al cambiar mes/día.

### Inventory Physical Count (🟡)
- **CREATE/UPDATE:** inexistentes (sin persistencia).
- **Riesgo:** expectativa funcional falsa en operación real de tienda.

---

## 5) Lista de errores críticos

### 🔴 CR-1: Contrato dual e incompatible en `customers`
- **Qué está mal:** coexistencia de payloads (`first_name/last_name` vs `full_name/tax_regime`) en la misma feature.
- **Por qué ocurre:** mezcla de refactor parcial + servicios legacy.
- **Cómo corregir:**
  1. Definir contrato canónico (recomendado: `first_name`,`last_name`,`business_name`).
  2. Crear mapper único FE↔DTO↔DB.
  3. Prohibir columnas no canónicas por lint/test.

### 🔴 CR-2: POS query contra columna potencialmente inexistente (`full_name`)
- **Qué está mal:** búsqueda de clientes POS filtra por `full_name` directo.
- **Por qué ocurre:** dependencia de un campo no alineado con tabla base.
- **Cómo corregir:** usar búsqueda compuesta (`first_name`, `last_name`, `business_name`) o crear vista/materialized field soportado oficialmente por migración.

### 🔴 CR-3: Contrato de tipos DB desactualizado en `suppliers`
- **Qué está mal:** migración agrega columnas, `types.ts` no.
- **Por qué ocurre:** no se regeneraron tipos tras migración.
- **Cómo corregir:** generar tipos en CI y bloquear merge si hay drift.

---

## 6) Recomendaciones técnicas (arquitectura y QA)

1. **Estandarización de nombres:**
   - DB en `snake_case` canónico.
   - ViewModel frontend en `camelCase` con mappers explícitos por feature.

2. **DTOs/Schemas compartidos:**
   - Zod por operación (`CreateCustomerInput`, `UpdateCustomerInput`, etc.) y consumo en UI + usecase.

3. **Validación compartida FE/BE:**
   - Reusar reglas de dominio en frontend y en bordes backend (RPC/Edge/DB constraints).

4. **Tipado fuerte y eliminación de `as any`:**
   - Priorizar `customers`, `suppliers`, `pos/customer.repository`.

5. **Automatización de consistencia:**
   - Job CI: regenerar `types.ts` y fallar si `git diff`.
   - Test de contratos: parsear `.select()`/payloads críticos y validar contra metadata de DB.

6. **QA Automation orientado a producción:**
   - E2E por entidad con flujo create→edit→list→search.
   - Smoke tests de RPC críticas (`process_sale_payment`, `create_purchase_with_items`).

---

## 7) Propuesta de solución por fases

### Fase A (1-2 días)
- Resolver contrato único de `customers` y POS customer search.
- Regenerar `src/integrations/supabase/types.ts`.
- Añadir tests de contrato para `customers` y `suppliers`.

### Fase B (2-4 días)
- Introducir capa de mappers + DTOs versionados por feature.
- Agregar guardrails de lint (prohibir selects con columnas no canónicas).

### Fase C (4-7 días)
- Implementar módulo real de conteo físico (`physical_counts` + `physical_count_items`).
- Integrar pruebas e2e de inventario y conciliación.

---

## 8) Extra opcional — scripts de corrección automática

### 8.1 Detectar drift de tipos (CI)
```bash
supabase gen types typescript --project-id "$PROJECT_ID" --schema public > src/integrations/supabase/types.generated.ts
diff -u src/integrations/supabase/types.ts src/integrations/supabase/types.generated.ts
```

### 8.2 Verificador de columnas usadas en frontend (idea)
- Parsear llamadas `.select("...")` en `src/features/**`.
- Contrastar contra metadata exportada de `information_schema.columns`.
- Fallar CI en columnas inexistentes o no permitidas por contrato de dominio.

### 8.3 Compatibilidad temporal para `full_name` (si se decide sostener legado)
```sql
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS full_name TEXT GENERATED ALWAYS AS (
  COALESCE(NULLIF(TRIM(first_name || ' ' || COALESCE(last_name, '')), ''), business_name)
) STORED;
```

> Nota: esta opción es táctica; el objetivo estratégico debe ser contrato de dominio único.
