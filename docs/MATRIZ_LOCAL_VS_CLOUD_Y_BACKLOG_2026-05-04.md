# Matriz local vs cloud y backlog de convergencia

Fecha: 2026-05-04

## 1) Matriz de diferencias

| Categoria | Local (repo/migraciones) | Cloud (live audit) | Estado |
|---|---|---|---|
| Core catalogos y ventas base | Presente | Presente (200) | OK parcial |
| Conteos fisicos (`physical_counts*`) | Presente en modelo/flujo | No encontrado (404) | `missing_cloud` |
| Apartados (`layaways*`) | Presente en migraciones y frontend | No encontrado (404) | `missing_cloud` |
| Facturacion (`invoices*`, `credit_notes`) | Presente en migraciones fase 5 | No encontrado (404) | `missing_cloud` |
| Transferencias/recepciones avanzadas | Esperadas por migraciones | No encontrado (404) | `missing_cloud` |
| RPC criticas de negocio | Referenciadas por frontend | No invocables (PGRST202/404) | `function_mismatch` |
| Edge Functions (`onboard-company`, `invoicing`) | Codigo presente local | Endpoint cloud 404 | `missing_cloud` |
| Migraciones SQL | Hay scripts con sintaxis invalida detectada | No verificable aplicacion completa con rol frontend | `migration_risk` |
| RLS/policies | Definidas extensamente en SQL | No auditable completo con rol publico | `policy_visibility_gap` |

## 2) Impacto por flujo de negocio

| Flujo | Riesgo | Causa principal |
|---|---|---|
| Arranque (auth + onboarding) | Alto | Edge function no encontrada en cloud |
| Venta (POS + caja) | Alto | RPC transaccionales no verificadas desde cloud |
| Reabasto (compras + inventario) | Alto | funciones/entidades avanzadas no observables |
| Apartados | Critico | tablas y RPC del modulo no visibles en cloud |
| Reportes y facturacion | Alto | RPC y tablas de facturacion no disponibles |

## 3) Backlog priorizado de convergencia

## S0 - Bloqueantes (ejecutar primero)
- BKL-001: Confirmar proyecto cloud objetivo y entorno (dev/stage/prod) para evitar comparar contra instancia incorrecta.
- BKL-002: Desplegar/validar Edge Functions faltantes: `onboard-company`, `invoicing`.
- BKL-003: Publicar y validar RPC criticas usadas por frontend (contratos con parametros reales).
- BKL-004: Resolver inconsistencia de acceso protegido cuando no hay sucursal.

## S1 - Consistencia de datos y operaciones
- BKL-005: Corregir migraciones con sintaxis invalida (`DROP POLICY ... FOR ...`).
- BKL-006: Ejecutar migraciones en entorno limpio y generar evidencia reproducible.
- BKL-007: Regenerar `types.ts` desde cloud objetivo y eliminar `as any` en repositorios clave.
- BKL-008: Incorporar pruebas smoke E2E por flujo critico (onboarding, POS, caja, compras, apartados).

## S2 - Seguridad y gobernanza
- BKL-009: Auditar y normalizar grants/RLS para tablas y funciones por rol.
- BKL-010: Endurecer CORS y manejo de secretos en edge functions.
- BKL-011: Definir checklist release DB + gate en CI (migraciones, tipos, contratos RPC).

## S3 - UX/Calidad operativa
- BKL-012: Completar UI de facturacion con ciclo minimo viable.
- BKL-013: Estandarizar mensajes de error y estados vacios por pantalla.
- BKL-014: Mejorar trazabilidad operativa (eventos, bitacora de intentos, telemetria).

## 4) Roadmap sugerido por sprint

### Sprint A (1 semana)
- BKL-001 a BKL-004
- Resultado esperado: circuito login/onboarding/entrada y base de funciones operativas listo.

### Sprint B (1 semana)
- BKL-005 a BKL-008
- Resultado esperado: schema convergente, contratos tipados y pruebas criticas verdes.

### Sprint C (1 semana)
- BKL-009 a BKL-011
- Resultado esperado: seguridad estable y despliegues DB confiables.

### Sprint D (1 semana)
- BKL-012 a BKL-014
- Resultado esperado: cierre funcional y mejora de experiencia para operadores.

## 5) Criterios de salida

- 100% de flujos criticos con backend disponible en cloud objetivo.
- 0 migraciones con errores de sintaxis.
- Tipos regenerados alineados a esquema desplegado.
- Pruebas smoke de negocio aprobadas en CI.
- Documentacion de contratos y versionado DB actualizados.
