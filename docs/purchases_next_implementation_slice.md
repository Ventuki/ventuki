# Siguiente slice de implementación recomendado, Compras

## Objetivo
Agregar administración mínima de `draft` sin romper el flujo por estados.

## Slice propuesto

### Backend / aplicación
1. `getPurchaseDraftDetail` o equivalente
2. `updatePurchaseDraftUseCase`
3. soporte de repositorio para:
   - actualizar encabezado de `purchases`
   - reemplazar `purchase_items` cuando siga en `draft`

### Restricción
Solo permitir update cuando `status = 'draft'`.

### UI
1. acción `Editar draft`
2. cargar encabezado + partidas al formulario existente
3. cambiar CTA de `Crear draft` a `Actualizar draft` cuando aplique

## Por qué este slice
Porque ataca el hueco funcional más claro del módulo sin abrir edición libre de compras confirmadas, parciales o recibidas.
