# Refinamiento semántico y de auditoría, ronda 1

## Ajustes aplicados

### Productos
Se corrigió la semántica de auditoría para distinguir:
- `product.deleted`
- `product.deactivated`

Antes, la desactivación por referencias operativas todavía se registraba como `product.deleted`.
Ahora ya refleja mejor lo que realmente ocurrió.

### Compras
Se agregó auditoría mínima para actualización de borradores:
- `purchase.draft_updated`

Esto deja traza cuando se corrige encabezado y partidas de una compra en estado `draft`.

## Beneficio
- mejor coherencia del historial
- menor ambigüedad al revisar acciones de negocio
- base más sólida para futuros reportes o debugging operativo

## Alcance
Es una mejora semántica y de trazabilidad.
No cambia el flujo funcional principal, pero sí mejora la fidelidad del sistema respecto a lo que realmente hizo.
