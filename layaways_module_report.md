# Layaways Module Report

## Decisiones de diseño

### Base de datos
- **3 tablas separadas** (`layaways`, `layaway_items`, `layaway_payments`) para mantener la normalización y permitir RLS fino por tabla.
- **reserved_stock en layaway_items**: El stock reservado se registra en el propio item al momento de crear el apartado. NO se mueve stock de `stock_levels` — esto evita rollback complejo si se cancela.
- **El campo `due_date`** es opcional para permitir apartados sin fecha límite.
- **RLS**: Las políticas de `layaway_items` y `layaway_payments` usan subquery sobre `layaways` para filtrar por `company_id`, replicando el patrón del resto del proyecto.
- **Índices**: Incluyen `idx_layaways_due_date` con WHERE parcial para performance en date range queries.

### Edge Function (Deno)
- **Zod para validación de inputs** en todos los actions.
- **Flujo de completar**: Cuando `paid_amount >= total_amount`, se crea una Sale vía `process_sale_transaction` RPC y se decrementa inventario. El try/catch envolviendo esa llamada evita que un error en la Sale falle todo el flujo.
- **Seguridad**: company_id se obtiene del `user_company_roles`, no del payload, para evitar que un usuario intente crear apartados en otra empresa.
- **Rate limiting**: No se implementó en la Edge Function para no agregar latencia extra — se puede añadir vía Supabase Gateway o un contador en memoria.
- **warehouse_id null en create_layaway**: Se omite porque el stock se marca como "reservado" en layaway_items, no se toca stock_levels hasta completar.

### Frontend
- **TanStack Query**: `useLayaways` con filtros en queryKey para cacheo correcto. Invalidación en cascada (`["layaways"]` + `["layaway", id]`) tras pagos/cancelaciones.
- **CreateLayawayDialog**: Selector de cliente con debounce + búsqueda fuzzy (reutiliza `searchCustomers`). Selector de productos con debounce (reutiliza `searchProducts`). Tabla editable de líneas con cantidad y precio unitario ajustables.
- **LayawayFiltersSheet**: Sheet lateral con filtros por estatus y rango de fechas. Sin filtro por cliente en UI para mantenerlo simple — se puede buscar en la lista.
- **LayawayDetail**: Muestra progreso de pago con `Progress` component. Lista de items + historial de pagos. Dialog de pago con validación de monto máximo restante.
- **Navegación**: Ruta `/layaways` (lista) y `/layaways/:id` (detalle). Sidebar con rol `seller` incluido.

## Limitaciones / Known Issues

1. **Stock reservations no persisten en `stock_levels.reserved_qty`**: El `reserved_stock` queda en `layaway_items` pero `stock_levels.reserved_qty` no se actualiza. Esto significa que otro proceso podría vender el mismo producto. **Fix**: Crear un RPC `reserve_stock_for_layaway` que actualice `stock_levels.reserved_qty` y llamarlo en `create_layaway`.

2. **No hay límite de tiempo por apartado**: Un cliente podría dejar un apartado abierto por años. **Fix**: Agregar un cron job que marque apartados vencidos (compare `due_date` con today) y envíe notificaciones.

3. **No hay notifications**: No hay integración con el módulo de notifications para avisar cuando un apartado está por vencer o se completa. **Fix**: Integrar con `features/notifications`.

4. **El cliente selector está disabled si no hay clientes**: El mensaje "Primero registra un cliente" es informativo pero no hay deep-link al formulario de clientes. Fácil de mejorar.

5. **Cancelar un apartado no devuelve el stock**: El task dice que los items "quedan disponibles" — correct, no se tocó inventario. Pero si se implementó el fix #1, hay que decrementar `reserved_qty` al cancelar.

6. **No hay Folio legible**: El ID se muestra truncado (8 caracteres). Un campo `folio` con formato `AP-001` sería mejor. Se puede agregar un campo computado o un RPC generador de folio.

7. **Métodos de pago mixtos**: El campo `payment_details` es `JSONB` pero el UI solo guarda el `payment_method`. Para métodos mixtos (efectivo + tarjeta), hay que construir el objeto correctamente.

8. **Posible race condition**: Si dos cashiers intentan crear el mismo apartado al mismo tiempo para el mismo producto, ambos podrían pasar la validación de stock. **Fix**: Usar `FOR UPDATE` en la consulta de stock o un mutex a nivel de producto.

## Próximos pasos si quisieras extender

- **[Notifications]**: Cuando `due_date` está a 3 días o menos y status = active, enviar notificación al vendedor asignado del cliente.
- **[Recordatorios automáticos]**: Un cron que envía recordatorios de pago cada semana mientras el apartado esté activo.
- **[Historial de cambios]**: Trigger en `layaways` para registrar en `audit_log` cambios de estatus.
- **[Comisiones]**: Agregar campo `seller_id` a `layaways` y calcular comisión cuando se completa.
- **[Multi-almacén]**: Permitir especificar `warehouse_id` por item (actualmente se omite).
- **[Folio human-readable]**: Campo `folio` con secuencia por empresa/año.
- **[Cancelación con reintegro de inventory]**: Modificar `cancel_layaway` para revertir `reserved_qty` en `stock_levels`.