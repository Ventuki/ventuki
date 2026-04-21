# Implementación de agrupación por proveedor en reabasto, ronda 1

## Objetivo
Mejorar el puente Inventario → Compras cuando la sugerencia de reabasto incluye productos que probablemente pertenecen a proveedores distintos.

## Ajuste aplicado
Se reemplazó la lógica de "un solo mejor proveedor global" por una agrupación mínima por proveedor sugerido según historial de compras.

## Cómo funciona ahora
- se intenta sugerir proveedor por producto
- se agrupan ítems por proveedor sugerido
- se crea un draft por cada proveedor identificado
- los productos sin proveedor sugerido no se fuerzan dentro de un draft incorrecto

## Qué mejora
- evita mezclar productos de distintos proveedores en una sola orden solo por mayoría
- mantiene una heurística razonable basada en historial
- conserva revisión humana antes de confirmar compras

## Limitación actual
La agrupación sigue dependiendo de historial de compras, no de una relación maestra producto→proveedor preferido.

## Veredicto
Este era el siguiente paso correcto:
### formalizar mejor el flujo de reabasto sin automatizar decisiones que todavía no tienen fuente maestra confiable.
