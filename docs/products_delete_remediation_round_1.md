# Remediación de delete de Productos, ronda 1

## Problema detectado
`deleteProductUseCase` intentaba borrado duro directo sobre `products`.

Eso era riesgoso porque `product_id` aparece referenciado por múltiples tablas operativas, incluyendo:
- `product_barcodes`
- `product_prices`
- `purchase_items`
- `sale_items`
- `stock_levels`
- `stock_movements`
- `physical_count_items`

## Política aplicada
Se implementó una política segura mínima:

- **si el producto no tiene referencias operativas:** se permite `hard delete`
- **si el producto ya tiene referencias:** se hace **baja lógica** con `is_active = false`

## Objetivo
Evitar que el usuario crea que puede borrar un producto histórico como si fuera un catálogo aislado, cuando en realidad ya está conectado con compras, inventario o ventas.

## Beneficios
- reduce riesgo operativo,
- evita deletes frágiles por foreign keys,
- mantiene coherencia histórica,
- acerca el comportamiento a una regla funcional más razonable.

## Limitación actual
La auditoría sigue registrando acción `product.deleted` incluso cuando la estrategia aplicada es `deactivated`.
Eso es aceptable como parche mínimo, pero después convendría distinguir mejor entre:
- `product.deleted`
- `product.deactivated`

## Siguiente mejora recomendada
1. reflejar en UI que a veces se desactiva en lugar de eliminar
2. filtrar o marcar claramente productos inactivos en listado
3. revisar si `product_barcodes` y `product_prices` deben contarse como referencias suficientes por sí mismas o si solo deben considerarse referencias históricas reales como ventas, compras y stock
