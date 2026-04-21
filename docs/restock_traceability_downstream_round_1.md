# Extensión de trazabilidad de reabasto aguas abajo, ronda 1

## Objetivo
Evitar que la trazabilidad del flujo de reabasto se corte en la creación del draft.

## Ajuste aplicado
Se extendió la auditoría de Compras para marcar si una compra proviene de reabasto también en transiciones posteriores.

## Qué se registra ahora
- `purchase.confirmed`
- `purchase.cancelled`
- `purchase.reopened`
- `purchase.received`

Y cada una conserva una marca de origen:
- `inventory.restock_suggestion`
- o `manual_or_other`

## Cómo se resolvió
No se abrió una tabla relacional nueva.
Se reutilizó la auditoría existente y se infiere origen revisando si el draft había sido creado desde reabasto.

## Beneficio
- el rastro ya no muere al crear draft
- ahora puede seguirse mejor el ciclo:
  sugerencia → draft → confirmación/cancelación/reapertura/recepción

## Limitación actual
La inferencia sigue dependiendo de auditoría previa, no de un campo maestro dedicado en la compra.

## Veredicto
Buen siguiente paso para esta etapa:
### extender trazabilidad útil antes de formalizar una relación estructural más pesada.
