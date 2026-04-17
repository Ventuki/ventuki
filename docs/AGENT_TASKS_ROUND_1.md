# Agent tasks, round 1

Primera ronda de trabajo incremental para Ventuki. Estas tareas están pensadas para ejecutarse en paralelo por perfil, con entregables pequeños y verificables.

## Agente Seguridad

### Meta de la ronda
Reducir exposición y aclarar el modelo de seguridad operativo.

### Tareas
1. Revisar el uso actual de variables `VITE_*` y confirmar que no se dependa de secretos privados en frontend.
2. Inventariar puntos del frontend que llaman a Supabase.
3. Detectar riesgos de autorización, validación o exposición accidental de datos.
4. Revisar documentación SQL disponible y listar piezas que dependen de RLS o políticas de sucursal.
5. Entregar un reporte breve con severidad: alta, media, baja.

### Entregables esperados
- `docs/security_round_1.md`
- checklist de riesgos priorizados

## Agente QA Funcional

### Meta de la ronda
Tener una matriz mínima de validación funcional para módulos críticos.

### Tareas
1. Mapear flujos críticos desde rutas y pantallas existentes.
2. Convertir esos flujos en checklist manual ejecutable.
3. Identificar qué pruebas actuales cubren lógica, pero no validan experiencia real.
4. Priorizar módulos a revisar primero: login, dashboard, productos, inventario, POS, compras, facturación y apartados.
5. Documentar huecos de cobertura funcional.

### Entregables esperados
- `docs/qa_round_1.md`
- matriz manual de smoke tests

## Agente Arquitectura Frontend

### Meta de la ronda
Detectar deuda técnica y oportunidades de mejora de performance sin romper flujos.

### Tareas
1. Auditar el árbol de rutas del `App.tsx`.
2. Identificar páginas candidatas para lazy loading.
3. Detectar features con demasiadas responsabilidades mezcladas.
4. Revisar el tamaño del bundle actual y proponer primeras acciones de code splitting.
5. Entregar un backlog corto de refactors de bajo riesgo y alto impacto.

### Entregables esperados
- `docs/frontend_arch_round_1.md`
- backlog priorizado de refactor

## Regla de integración

Cada entregable debe cerrar con:
- hallazgos
- impacto esperado
- esfuerzo estimado
- siguiente acción recomendada
