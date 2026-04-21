# Cierre del flujo de reabasto, ronda 1

## Objetivo
Consolidar en un solo cierre lo que ya quedó resuelto entre Inventario y Compras durante esta ronda.

## Estado inicial
El sistema solo tenía un handoff manual asistido:
- sugerencia en Inventario
- precarga temporal vía `localStorage`
- revisión posterior en Compras

## Lo que quedó implementado

### 1. Configuración explícita de reabasto en Inventario
- edición de `min/max`
- separación entre operación y política de stock

### 2. Draft persistido desde Inventario
- las sugerencias ya pueden crear draft real en Compras
- se mantiene revisión humana

### 3. Agrupación mínima por proveedor
- se sugiere proveedor por producto usando historial
- se crea un draft por proveedor cuando aplica
- productos sin proveedor sugerido no se fuerzan

### 4. Trazabilidad mínima
- rastro desde sugerencia de reabasto hasta draft creado
- extensión de origen hacia confirmación, cancelación, reapertura y recepción

## Estado final del flujo
### mínimo detectado
→ sugerencia operativa
→ agrupación mínima por proveedor
→ draft(s) persistidos
→ revisión humana
→ confirmación / recepción con trazabilidad de origen

## Qué no se hizo todavía
- relación estructural explícita entre sugerencia y compra
- entidad dedicada de reabasto
- proveedor maestro por producto
- automatización completa de orden

## Veredicto
Para una ronda 1, el flujo quedó bastante bien cerrado.
Ya no es solo una sugerencia visual ni un handoff frágil.

Ahora existe un puente funcional y trazable entre Inventario y Compras.

## Siguiente paso estructural recomendado
Si se abre otra ronda sobre este frente, el siguiente salto correcto sería:
### formalizar una relación explícita de dominio para reabasto

en vez de seguir creciendo solo sobre payloads de auditoría.
