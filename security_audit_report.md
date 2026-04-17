# 🔒 Security Audit Report — Ventuki POS SaaS
**Fecha:** 2026-04-15  
**Auditor:** Agent 1 - DevOps/Security

---

## RESUMEN EJECUTIVO

La auditoría de seguridad al proyecto Ventuki POS SaaS revela múltiples hallazgos críticos que requieren atención inmediata. Se identificaron 16+ tablas sin Row Level Security (RLS) habilitado, incluyendo tablas maestras (`companies`, `branches`, `warehouses`), catálogos (`products`, `categories`, `brands`, `units`) y entidades (`customers`, `suppliers`). Las Edge Functions `onboard-company` e `invoicing` carecen de validación de inputs, rate limiting y audit logs. Adicionalmente, las funciones `process_sale_transaction` y `process_purchase_transaction` son susceptibles a privilege escalation mediante la manipulación del `branch_id`. El sistema en su estado actual NO es seguro para producción y presenta una superficie de ataque expuesta tanto a acceso cruzado de datos entre empresas/sucursales como a inyección de transacciones fraudulentas.

---

## 1. GAPS DE RLS (Row Level Security)

### 🔴 CRÍTICO — Tablas sin RLS habilitado

Las siguientes tablas carecen de políticas RLS, permitiendo que cualquier usuario con acceso al esquema pueda leer/modificar registros de todas las empresas:

- **Tabla:** `companies`
  - **Riesgo:** HIGH
  - **Descripción:** Sin RLS, cualquier usuario authenticated puede leer/modificar TODAS las empresas registradas. Un empleado de una empresa podría extraer datos de empresas competidoras o modificar su configuración raíz.
  - **Corrección sugerida:** Habilitar RLS y crear policy que filtre por `id` matching el `company_id` del usuario (via `auth.jwt()`).

- **Tabla:** `branches`
  - **Riesgo:** HIGH
  - **Descripción:** Permite acceso cross-company a sucursales. Un usuario podría ver o modificar sucursales de empresas ajenas.
  - **Corrección sugerida:** Policy basada en `company_id` join con `auth.jwt()`.

- **Tabla:** `warehouses`
  - **Riesgo:** HIGH
  - **Descripción:** Sin RLS, un usuario puede consultar/modificar inventarios de almacenes de cualquier empresa.
  - **Corrección sugerida:** Filtrar por `company_id` vía relación `branches → company_id`.

- **Tabla:** `products`
  - **Riesgo:** HIGH
  - **Descripción:** Catálogo de productos expuesto globalmente. Un competidor podría extraer toda la base de productos.
  - **Corrección sugerida:** RLS por `company_id` (vía `branches` o relación directa).

- **Tabla:** `categories`
  - **Riesgo:** MEDIUM
  - **Descripción:** Categorías globales sin aislamiento. Aunque son datos de referencia, exponen la estructura de categorización de la empresa.
  - **Corrección sugerida:** RLS por `company_id` o marcar como globals y controlar acceso a nivel de API.

- **Tabla:** `brands`
  - **Riesgo:** MEDIUM
  - **Descripción:** similar a categories — estructura organizacional expuesta.
  - **Corrección sugerida:** RLS por `company_id`.

- **Tabla:** `units`
  - **Riesgo:** LOW
  - **Descripción:** Unidades de medida típicamente globales/estándar, pero por consistencia se debe aplicar RLS.
  - **Corrección sugerida:** RLS por `company_id`.

- **Tabla:** `customers`
  - **Riesgo:** HIGH
  - **Descripción:** Datos personales de clientes (PII) sin aislamiento. GDPR/ protección de datos violada.
  - **Corrección sugerida:** RLS por `company_id` + auditoría de acceso.

- **Tabla:** `suppliers`
  - **Riesgo:** HIGH
  - **Descripción:** Información financiera de proveedores expuesta sin RLS.
  - **Corrección sugerida:** RLS por `company_id`.

- **Tabla:** `inventory_movements`
  - **Riesgo:** HIGH
  - **Descripción:** Movimientos de inventario visibles globalmente — historial completo de entradas/salidas de cualquier empresa.
  - **Corrección sugerida:** RLS por `warehouse_id → branch_id → company_id`.

- **Tabla:** `cash_sessions`
  - **Riesgo:** HIGH
  - **Descripción:** Sesiones de caja contienen información financiera sensitiva expuesta globalmente.
  - **Corrección sugerida:** RLS por `branch_id → company_id`.

- **Tabla:** `sale_lines`
  - **Riesgo:** HIGH
  - **Descripción:** Líneas de detalle de venta sin aislamiento. Información de compra de clientes expuesta.
  - **Corrección sugerida:** RLS por `sale_id → branch_id → company_id`.

- **Tabla:** `purchase_lines`
  - **Riesgo:** HIGH
  - **Descripción:** Detalle de compras a proveedores sin aislamiento.
  - **Corrección sugerida:** RLS por `purchase_id → branch_id → company_id`.

### 🟡 ALTO — RLS incompleto en tablas transaccionales

- **`sales`**: La policy existente solo filtra por `branch_id`, pero NO valida que el `company_id` del usuario coincida con el de la sucursal. Un atacante podría especificar un `branch_id` de otra empresa (si conhece IDs) para insertar ventas fraudulentas en sucursales ajenas.
  - **Riesgo:** HIGH
  - **Corrección sugerida:** En la policy de `sales`, JOIN con `branches` para verificar que `branches.company_id` match con el `company_id` del token JWT.

- **`purchases`**: Mismo gap que `sales` — policy con filtro parcial por `branch_id`, sin validación de `company_id`.
  - **Riesgo:** HIGH
  - **Corrección sugerida:** Mismo fix: join con `branches` para verificar `company_id`.

- **`inventory_stock`**: No se verificó cobertura completa de RLS. Se requiere auditoría detallada de las policies existentes.
  - **Riesgo:** MEDIUM
  - **Corrección sugerida:** Auditoría completa de todas las policies en `inventory_stock`.

---

## 2. EDGE FUNCTIONS — GAPS DE HARDENING

### 🔴 CRÍTICO

**`onboard-company`**
- **Sin rate limiting:** Un atacante puede enviar múltiples solicitudes de onboarding para crear cuentas masivo (DoS, spam de empresas).
- **Sin validación de inputs con Zod:** No se valida estructura de `req.json()` — campos faltantes, tipos incorrectos, o datos maliciosos pasan sin filtro.
- **Sin audit logs:** No hay registro de quién creó qué empresa, cuándo, ni desde qué IP. Sin trazabilidad para investigación forense.
- **`SECURITY DEFINER` exploitable:** La función corre como `supabase_admin` o rol privilegiado. Si hay un injection point en los inputs, el atacante gana acceso total al esquema.

**`invoicing`**
- **Sin rate limiting:** Un cliente puede generarcfdis ilimitados, consumiendo recursos de facturación y potencialmente generando costos indebidos en FINKOK.
- **Sin validación de inputs:** `req.json()` sin schema validation — campos como `rpc` o `data` pueden contener payloads maliciosos.
- **Credenciales FINKOK hardcoded en comentario:** Se observó en el código fuente credentials de API de facturación electrónica (FINKOK) posiblemente hardcoded o en comentarios sin adecuada protección. Las credenciales de un tercero (FINKOK) deben estar en Vault/ secrets manager, nunca en código.

---

## 3. PRIVILEGE ESCALATION VECTORS

### 🔴 CRÍTICO

**`process_sale_transaction` y `process_purchase_transaction`:**
- **Uso de `SECURITY DEFINER` + `set_search_path = public`:** Esta combinación es conocida por ser vulnerable a session-reuse attacks. Cuando una función corre como `SECURITY DEFINER`, hereda los privilegios del definidor. El `set_search_path = public` evita que funciones search-path poisoning exploten la función, pero la vulnerabilidad raíz (poder especificar `branch_id` arbitrario) sigue presente.
- **Manipulación de `branch_id`:** Un usuario malicioso puede especificar un `branch_id` que no le pertenece para registrar ventas o compras en una sucursal ajena. La función NO valida que el `branch_id` proporcionado pertenezca a la empresa del usuario autenticado.
- **Sin validación de acceso:** No hay check de que `branches.company_id` del `branch_id` elegido coincida con el `company_id` del usuario making the request.

**Vector de ataque estimado:**
1. El atacante se autentica como usuario de empresa A, sucursal 1.
2. El atacante llama `process_sale_transaction` con `branch_id = <id de sucursal 2 de empresa B>`.
3. La venta se registra en la sucursal 2 de empresa B, sin que el atacante tenga relación con esa empresa.
4. Impacto: Fraude fiscal, desvío de ventas, manipulación de reportes.

---

## 4. FALTAN COLUMNAS DE AUDITORÍA

Las siguientes tablas carecen de columnas de trazabilidad (`created_by_user_id`, `updated_by`, `created_at`, `updated_at`):

**Sin timestamps:**
- `companies`, `branches`, `warehouses`, `products`, `categories`, `brands`, `units`
- `customers`, `suppliers`
- `sales`, `purchases`, `sale_lines`, `purchase_lines`
- `inventory_movements`, `inventory_stock`
- `cash_sessions`
- `cash_session_revenues`, `cash_session_expenses`
- `payment_methods`, `iva_rates`
- `users` (crítico — sin `created_at` ni `created_by`)
- `user_branches`, `user_warehouses`

**Sin `created_by_user_id` (trazabilidad de QUIÉN creó/modificó):**
- Prácticamente TODAS las tablas maestras y transaccionales listed above.
- Particularmente crítico: `users`, `companies`, `branches`, `sales`, `purchases`.

---

## 5. INDICES FALTANTES

Tablas que carecen de índices en foreign keys o columnas de búsqueda frecuente, afectando performance en consultas filtradas por RLS:

- **`branches`:** Missing index on `company_id` — cada consulta RLS por company requerirá full table scan.
- **`warehouses`:** Missing index on `branch_id`.
- **`products`:** Missing index on `company_id` (si se implementa RLS por company).
- **`customers`:** Missing index on `company_id`.
- **`suppliers`:** Missing index on `company_id`.
- **`sales`:** Missing index on `branch_id` + `company_id` (compound recommended).
- **`purchases`:** Missing index on `branch_id` + `company_id`.
- **`sale_lines`:** Missing index on `sale_id`.
- **`purchase_lines`:** Missing index on `purchase_id`.
- **`inventory_movements`:** Missing index on `warehouse_id` + `product_id` (compound para búsqueda de movimientos por producto/almacén).
- **`inventory_stock`:** Missing index on `warehouse_id` + `product_id`.
- **`cash_sessions`:** Missing index on `branch_id` + `status` (sesiones abiertas/cerradas).
- **`user_branches`:** Missing index on `user_id` + `branch_id` (compound unique index recomendado para evitar duplicados).
- **`users`:** Missing index on `company_id`.

**Índices recomendados (diseño base):**
```sql
-- Branches por company (crítico para RLS)
CREATE INDEX idx_branches_company_id ON branches(company_id);

-- Warehouses por branch
CREATE INDEX idx_warehouses_branch_id ON warehouses(branch_id);

-- Sales por branch (RLS + performance)
CREATE INDEX idx_sales_branch_company ON sales(branch_id, company_id);

-- Purchases por branch
CREATE INDEX idx_purchases_branch_company ON purchases(branch_id, company_id);

-- Inventory movements por warehouse + product
CREATE INDEX idx_inventory_movements_warehouse_product ON inventory_movements(warehouse_id, product_id);

-- Inventory stock por warehouse + product
CREATE INDEX idx_inventory_stock_warehouse_product ON inventory_stock(warehouse_id, product_id);

-- Customers/Suppliers por company
CREATE INDEX idx_customers_company_id ON customers(company_id);
CREATE INDEX idx_suppliers_company_id ON suppliers(company_id);

-- User branches compound
CREATE UNIQUE INDEX idx_user_branches_user_branch ON user_branches(user_id, branch_id);
```

---

## 6. RECOMENDACIONES DE PRIORIDAD

| Prioridad | Acción | Esfuerzo | Timeline Sugerido |
|---|---|---|---|
| P0 - CRÍTICO | Habilitar RLS en todas las tablas listadas en sección 1 | Alto | Inmediato (1-2 sprints) |
| P0 - CRÍTICO | Fix privilege escalation en `process_sale_transaction` y `process_purchase_transaction` | Medio | Inmediato (< 1 sprint) |
| P1 - ALTO | Hardening completo de Edge Functions (`onboard-company` + `invoicing`): Zod validation + rate limiting + audit logs | Medio | 1 sprint |
| P1 - ALTO | Agregar columnas de auditoría faltantes (`created_by_user_id`, `updated_by`, `created_at`, `updated_at`) | Alto | 1-2 sprints |
| P2 - MEDIO | Crear índices recomendados en sección 5 | Bajo | 1 sprint |
| P2 - MEDIO | Mover credenciales FINKOK de `invoicing` a Vault/env vars | Bajo | < 1 sprint |
| P2 - MEDIO | Auditoría completa de `inventory_stock` RLS coverage | Medio | 1 sprint |

---

## 7. ENTREGABLES REQUERIDOS DEL EQUIPO

- [ ] Implementar RLS en TODAS las tablas listadas en sección 1 (companies, branches, warehouses, products, categories, brands, units, customers, suppliers, inventory_movements, cash_sessions, sale_lines, purchase_lines)
- [ ] Revisar y fixear policies de `sales` y `purchases` para validar `company_id` además de `branch_id`
- [ ] Validar inputs con Zod en `onboard-company`: schema para req.json() con tipos y required fields
- [ ] Validar inputs con Zod en `invoicing`: schema para `rpc` y `data`
- [ ] Agregar rate limiting a ambas Edge Functions (usar Supabase Edge Function middleware o middleware personalizado con contador Redis/in-memory)
- [ ] Agregar audit logs a `onboard-company` (registrar company_name, created_by, timestamp, IP, request_id)
- [ ] Mover credenciales FINKOK de `invoicing` a `env` / Vault (no hardcoded)
- [ ] Crear índices recomendados en sección 5 (priorizar idx_branches_company_id, idx_sales_branch_company)
- [ ] Agregar columnas de auditoría (`created_at`, `updated_at`, `created_by_user_id`, `updated_by`) a TODAS las tablas que faltan listadas en sección 4
- [ ] Implementar auditoría de acceso: trigger/log en tablas sensitivas (sales, purchases, cash_sessions) que registre quién leyó/modificó qué y cuándo
- [ ] Validar que `process_sale_transaction` y `process_purchase_transaction` verifican que el `branch_id` belongs al `company_id` del usuario autenticado antes de insertar
- [ ] Considerar migrar de `SECURITY DEFINER` a `SECURITY INVOKER` con grants explícitos por rol

---

*Reporte generado por Agent 1 - DevOps/Security*  
*Proyecto: Ventuki POS SaaS — `/home/kali/Downloads/ventuki/`*  
*Fecha de auditoría: 2026-04-15*