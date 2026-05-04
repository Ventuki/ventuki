# AGENT CONTEXT - Ventuki

Este archivo es el punto de entrada rapido para cualquier IA/agente.  
Para contexto completo, leer despues: `docs/MEMORIA_PROYECTO_VENTUKI.md`.

## Proyecto en 30 segundos

- Producto: POS SaaS multi-tenant.
- Stack: React + Vite + TypeScript + Supabase (Postgres/RLS/RPC/Edge Functions).
- Contexto operativo minimo por sesion: `user + company + branch`.
- Objetivo actual: convergencia entre estado local (repo/migraciones) y estado cloud (Lovable/Supabase).

## Estado actual

- Analisis E2E de pantallas: COMPLETADO.
- Auditoria operativa por pantalla: COMPLETADO.
- Baseline de DB local: COMPLETADO.
- Auditoria cloud live: COMPLETADO (con alcance de credenciales frontend).
- Matriz de brechas y backlog priorizado: COMPLETADO.
- Memoria viva del proyecto: ACTIVA en `docs/MEMORIA_PROYECTO_VENTUKI.md`.
- Implementacion en repo (2026-05-04): BKL-004 y BKL-005 REALIZADOS (ver memoria y rutas de codigo alli).

## Fuentes de verdad (orden)

1. `docs/MEMORIA_PROYECTO_VENTUKI.md`
2. `docs/MATRIZ_LOCAL_VS_CLOUD_Y_BACKLOG_2026-05-04.md`
3. `docs/AUDITORIA_LOVABLE_CLOUD_LIVE_2026-05-04.md`
4. `docs/BASELINE_DB_LOCAL_2026-05-04.md`
5. `docs/AUDITORIA_OPERATIVA_PANTALLAS_2026-05-04.md`
6. `docs/ANALISIS_PANTALLAS_FLUJOS_E2E_2026-05-04.md`

## Prioridades vigentes (S0 -> S3)

- S0: BKL-001 a BKL-004 (bloqueantes operativos).
- S1: BKL-005 a BKL-008 (consistencia DB/contratos/tests).
- S2: BKL-009 a BKL-011 (seguridad y gobernanza).
- S3: BKL-012 a BKL-014 (UX y calidad operativa).

## Reglas obligatorias para agentes

1. No marcar `REALIZADO (100%)` sin evidencia y validacion funcional.
2. No saltar prioridad S0-S3 sin justificacion escrita en memoria.
3. No asumir alineacion local/cloud; validar con evidencia.
4. Al cerrar trabajo, actualizar `docs/MEMORIA_PROYECTO_VENTUKI.md`:
   - estado de iniciativa,
   - porcentaje,
   - evidencia,
   - bitacora.

## Proximo paso recomendado

Tomar la siguiente iniciativa pendiente de mayor prioridad en memoria  
(BKL-001 a BKL-003, luego BKL-006)  
y ejecutar ciclo completo: implementar -> validar -> documentar -> actualizar memoria.
