# Sprint 0, backlog de implementación real

## Enfoque
Este documento convierte el orden del Sprint 0 en trabajo técnico más cercano a ejecución por archivo y componente.

---

# 1. Dashboard

## Archivos foco
- `src/pages/Index.tsx`
- `src/pages/hooks/useDashboardStats.ts`
- `src/components/layout/AppTopbar.tsx`
- servicios o hooks de dashboard relacionados

## Trabajo técnico
- [ ] Auditar los bloques actuales del dashboard y marcar cuáles son operativos vs decorativos.
- [ ] Definir estructura objetivo del dashboard operativo mínimo.
- [ ] Identificar datos faltantes para estado de caja, alertas y pendientes.
- [ ] Diseñar nueva prioridad visual de tarjetas y paneles.
- [ ] Definir acciones rápidas o links directos desde dashboard.

## Resultado esperado
Tener especificación concreta para refactor del dashboard en Sprint 1.

---

# 2. Caja

## Archivos foco
- `src/features/cash-register/pages/CashRegisterPage.tsx`
- `src/features/cash-register/application/openSession.usecase.ts`
- `src/features/cash-register/application/closeSession.usecase.ts`
- `src/features/cash-register/infrastructure/cash.repository.ts`

## Trabajo técnico
- [ ] Auditar qué información da hoy la pantalla antes de abrir caja.
- [ ] Auditar qué información da con una sesión activa.
- [ ] Definir datos mínimos visibles para sesión actual.
- [ ] Definir estados de error y validaciones visibles.
- [ ] Revisar si el modelo actual soporta estado consumible por POS y dashboard.

## Resultado esperado
Especificación técnica de caja lista para endurecimiento en Sprint 1.

---

# 3. POS

## Archivos foco
- `src/features/pos/pages/POSPage.tsx`
- `src/features/pos/components/POSCatalog.tsx`
- `src/features/pos/components/POSCart.tsx`
- `src/features/pos/hooks/usePOSCart.ts`
- `src/features/pos/hooks/useProductSearch.ts`
- `src/features/pos/hooks/usePayment.ts`
- `src/features/pos/hooks/useCreateSale.ts`

## Trabajo técnico
- [ ] Auditar dependencias del POS para operar correctamente.
- [ ] Identificar si ya existe bloqueo por caja abierta o si falta agregarlo.
- [ ] Revisar flujo de búsqueda y agregación para operación rápida.
- [ ] Revisar acciones faltantes del carrito.
- [ ] Revisar validaciones de pago y multipago.
- [ ] Revisar estado de error y feedback visible al usuario.

## Resultado esperado
Backlog claro del circuito de venta base para endurecer en Sprint 1.

---

# 4. Selección de empresa

> Ver también: `docs/CONTEXTO_Y_ONBOARDING_BACKLOG_TECNICO.md`

## Archivos foco
- `src/features/auth/pages/SelectCompanyPage.tsx`
- `src/features/auth/AuthProvider.tsx`
- `src/features/auth/ProtectedRoute.tsx`

## Trabajo técnico
- [ ] Auditar persistencia del contexto activo.
- [ ] Revisar si el contexto queda disponible de forma consistente para dashboard, caja y POS.
- [ ] Definir qué información visible falta al entrar al sistema.

## Resultado esperado
Contexto multiempresa/multisucursal listo para integrarse al circuito base.

---

# 5. Onboarding

## Archivos foco
- `src/features/auth/pages/OnboardingPage.tsx`
- `src/features/onboarding/pages/OnboardingPage.tsx`
- hooks y schema asociados

## Trabajo técnico
- [ ] Confirmar cuál onboarding es canónico y cuál sobra o está duplicado.
- [ ] Definir salida operativa correcta del onboarding.
- [ ] Documentar qué configuración mínima sigue faltando tras crear empresa.

## Resultado esperado
Ruta de arranque coherente y sin duplicidad conceptual.

---

# 6. QA del circuito base

> Checklist operativo: `docs/QA_CIRCUITO_BASE.md`

## Trabajo técnico
- [ ] Preparar checklist manual del recorrido.
- [ ] Ejecutar login → contexto → caja → POS → cierre.
- [ ] Registrar bloqueos reales por pantalla.
- [ ] Marcar gaps que obligan cambios de Sprint 1.

## Resultado esperado
Lista de bloqueos reales, no hipotéticos.

---

# Cierre de Sprint 0

Sprint 0 queda listo cuando:
- el análisis por archivos está hecho,
- el circuito base está descompuesto en dependencias reales,
- y el proyecto queda listo para empezar correcciones deliberadas en Sprint 1.
