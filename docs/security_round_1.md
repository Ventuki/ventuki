# Security round 1

## Resumen
Ventuki muestra una base razonable de seguridad para frontend con Supabase, pero todavía depende fuertemente de la correcta configuración de RLS, RPCs y metadatos de sesión. La app no expone claves secretas de backend en el frontend, pero sí necesita endurecer documentación, validaciones de contexto y revisión de superficie de acceso por módulo.

## Hallazgos

### 1. Uso de variables `VITE_*` adecuado, pero requiere disciplina operativa
**Severidad:** media

Se observa uso de:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

Esto es correcto para frontend porque la publishable key no es un secreto de servidor. El riesgo real está en asumir que por no ser secreta ya no hace falta endurecimiento. La seguridad depende de RLS, JWT metadata y RPCs correctamente protegidas.

**Impacto esperado:**
Evitar falsa sensación de seguridad y reducir errores de configuración.

**Siguiente acción recomendada:**
Documentar claramente qué variables son públicas y qué secretos nunca deben entrar al frontend.

### 2. Fuerte dependencia de RLS y claims de sesión
**Severidad:** alta

Se detectan políticas y SQL que dependen de:
- `auth.jwt() -> 'app_metadata' ->> 'role'`
- `company_id`
- `branch_id`

Eso está bien como patrón, pero vuelve crítica la consistencia del onboarding, selección de compañía/sucursal y claims reales del JWT. Si esos metadatos no están alineados, el aislamiento multi-sucursal y multi-compañía se puede romper o comportarse de forma errática.

**Impacto esperado:**
Aislamiento correcto de datos y menor riesgo de acceso indebido.

**Siguiente acción recomendada:**
Auditar el flujo completo de emisión/actualización de claims y validar escenarios de cambio de sucursal y compañía.

### 3. Contexto de compañía y sucursal almacenado en localStorage
**Severidad:** media

`AuthProvider` guarda `pos_company` y `pos_branch` en `localStorage`. Eso sirve para persistencia UX, pero no debe considerarse una fuente confiable de autorización. Si el backend depende indirectamente de ese estado visual sin revalidación en RLS/RPC, habría riesgo de inconsistencias.

**Impacto esperado:**
Reducir riesgo de desalineación entre UI y permisos reales.

**Siguiente acción recomendada:**
Confirmar que todas las operaciones sensibles dependen del backend y no del estado almacenado solo en cliente.

### 4. Amplia superficie de acceso a Supabase desde frontend
**Severidad:** media

Hay acceso directo a múltiples tablas y RPCs desde frontend:
- `products`, `customers`, `suppliers`, `sales`, `purchases`, `stock_levels`, `warehouses`, `audit_logs`, entre otras
- RPCs como `process_sale_transaction`, `process_purchase_transaction`, `adjust_stock`, `receive_purchase`, `process_layaway`, etc.

Esto no es necesariamente malo, pero sí aumenta la necesidad de validar que cada tabla y RPC tenga políticas claras y pruebas de acceso por rol/sucursal.

**Impacto esperado:**
Menor riesgo de huecos de autorización en operaciones críticas.

**Siguiente acción recomendada:**
Crear una matriz tabla/RPC → política/RLS → rol permitido.

### 5. Documentación de seguridad dispersa, pero existente
**Severidad:** baja

Hay señales positivas:
- migraciones de hardening
- pruebas SQL para RLS
- índices y fixes de seguridad

Pero el conocimiento está disperso entre migraciones, SQL suelto y docs históricos. Falta un documento operativo único que explique el modelo de seguridad vigente.

**Impacto esperado:**
Más facilidad para auditoría, onboarding técnico y cambios seguros.

**Siguiente acción recomendada:**
Consolidar un `docs/SECURITY_MODEL.md` en una ronda siguiente.

## Inventario de superficie sensible observada

### Autenticación y sesión
- `src/features/auth/AuthProvider.tsx`
- `src/features/auth/ProtectedRoute.tsx`
- `src/features/auth/pages/*`

### Cliente Supabase
- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/types.ts`

### SQL / RLS / migraciones
- `src/supabase/branch_rls_policies.sql`
- `src/supabase/audit_triggers.sql`
- `supabase/migrations/*`
- `supabase/tests/rls_phase3_checks.sql`

### Funciones críticas
- ventas / POS
- compras
- inventario
- apartados
- facturación

## Priorización

### Alta
- Validar claims reales en JWT y coherencia con compañía/sucursal
- Revisar RLS/RPC de operaciones críticas

### Media
- Confirmar que localStorage no influya en autorización real
- Mapear tabla/RPC vs rol/permisos

### Baja
- Consolidar documentación de seguridad

## Esfuerzo estimado
- Diagnóstico ampliado: medio
- Remediación inicial: media a alta, según calidad actual de RLS/RPC

## Siguiente acción recomendada
Ejecutar una ronda 2 enfocada en:
1. mapa de permisos por tabla/RPC
2. validación del flujo de claims
3. consolidación documental del modelo de seguridad
