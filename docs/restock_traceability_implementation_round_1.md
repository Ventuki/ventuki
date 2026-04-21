# Implementación de trazabilidad mínima de reabasto, ronda 1

## Objetivo
Dejar rastro útil entre la sugerencia de reabasto nacida en Inventario y los drafts de compra creados en Compras.

## Estrategia aplicada
Se aprovechó la auditoría existente en lugar de abrir tablas nuevas o migraciones.

## Qué se registra ahora

### Desde Inventario
Al disparar creación de draft desde sugerencias de reabasto, se registra el origen con:
- fuente
- cantidad de ítems
- productos y cantidades sugeridas

### Desde Compras
Por cada draft creado desde reabasto se registra:
- acción `purchase.draft_created_from_restock`
- proveedor sugerido usado
- cantidad de ítems
- productos incluidos
- fuente `inventory.restock_suggestion`

## Beneficio
- deja un rastro mínimo entre sugerencia y draft generado
- mejora trazabilidad sin meter migraciones nuevas
- prepara el terreno para después ligar drafts, confirmaciones y recepciones

## Limitación actual
La relación todavía vive en payloads de auditoría, no en una entidad relacional dedicada.

## Veredicto
Este era el siguiente paso correcto:
### primero trazabilidad útil y barata, luego formalización relacional si el flujo lo justifica.
