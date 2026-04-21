# Implementación de configuración de reabasto, Inventario, ronda 1

## Objetivo
Cerrar la pieza faltante entre:
- mínimos/máximos en datos,
- alertas,
- y sugerencias de recompra.

## Ajustes aplicados

### Backend / aplicación
Se agregó soporte para actualizar:
- `min_stock`
- `max_stock`

sobre `stock_levels`.

Incluye:
- schema de validación
- use case
- command
- hook
- auditoría `inventory.restock_config_updated`

### UI
Se agregó una acción por fila:
- `Configurar reabasto`

Desde ahí se puede definir:
- mínimo
- máximo

sin mezclar esto con ajuste de existencias.

## Decisión de diseño
Se separó explícitamente:
- **stock actual** = operación
- **política de reabasto** = configuración

## Beneficio
- cierra el circuito entre mínimos/máximos y recompra
- hace visible una política que ya existía en datos
- evita tratar esta capacidad como ajuste manual de stock
