# Sprint de claridad operativa, Inventario, ronda 1

## Ajustes aplicados

### 1. Alertas más legibles
Se enriquecieron las alertas de inventario para mostrar:
- nombre de producto,
- SKU,
- nombre de almacén,
- mínimo y máximo cuando aplique.

Esto reduce la exposición de ids crudos y hace la lectura más útil para operación.

### 2. Copy más explícito en la pantalla
`InventoryPage` ahora comunica mejor que Inventario es:
- un centro operativo,
- para consulta,
- alertas,
- y movimientos controlados,
no un CRUD clásico de registros de stock.

## Beneficio
- más claridad de producto
- mejor legibilidad operativa
- menor sensación de módulo ambiguo o demasiado técnico

## Lo que sigue pendiente
La siguiente decisión importante ya no es de copy, sino de producto:
- si min/max y parámetros finos del stock deben administrarse aquí
- o en una capa/pantalla separada.
