# Implementación de draft persistido desde reabasto, ronda 1

## Objetivo
Reemplazar el handoff frágil vía `localStorage` por una creación real de draft de compra desde Inventario, manteniendo revisión humana.

## Ajustes aplicados

### Compras
Se agregó:
- `createPurchaseDraftFromReorderUseCase`
- `createDraftPurchaseFromReorder` en `purchaseService`

### Política usada
- se intenta sugerir proveedor con historial
- si no hay proveedor sugerido, no se automatiza el draft
- si sí lo hay, se crea compra real en `draft`
- costos siguen en `0` para revisión humana posterior

### Inventario
`ReorderSuggestionsPanel` ahora:
- deja de depender de `localStorage`
- crea draft persistido directamente
- mantiene la lógica de revisión posterior en Compras

## Decisión de diseño
No se automatizó compra confirmada.
No se eliminó la revisión humana.

Se formalizó solo el siguiente escalón correcto:
### sugerencia de reabasto → draft persistido

## Beneficio
- puente más robusto entre Inventario y Compras
- menos fragilidad local
- mejor trazabilidad funcional
- mantiene control humano antes de confirmar y recibir
