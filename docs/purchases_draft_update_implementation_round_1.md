# Implementación mínima de update de draft en Compras, ronda 1

## Alcance aplicado
Se implementó el slice mínimo para administrar una compra mientras siga en `draft`.

## Backend / aplicación
Se agregaron:
- `getPurchaseDraftDetailUseCase`
- `updatePurchaseDraftUseCase`
- soporte de repositorio para:
  - leer detalle del draft
  - actualizar encabezado
  - borrar líneas del draft
  - reinsertar líneas

## Estrategia usada
### Reemplazo completo de partidas en estado `draft`
No se implementó diff granular.
Mientras la compra siga en borrador, las líneas se reemplazan completas.

## UI
Se agregó soporte para:
- cargar un `draft` existente al formulario
- editar encabezado y partidas
- cambiar CTA de `Crear draft` a `Actualizar draft`
- cancelar modo edición
- disparar edición desde botón `Editar draft`

## Regla central
Solo se edita si la compra sigue en estado `draft`.

## Beneficio
Esto cierra el hueco funcional más claro de Compras sin convertir el módulo en CRUD libre de órdenes ya confirmadas o recibidas.

## Riesgo remanente
Conviene validar después si el flujo de recompra desde Inventario interactúa bien con el nuevo modo edición y si se quiere agregar auditoría específica para update de draft.
