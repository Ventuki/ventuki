# Auditoría CRUD, POS, ronda 1

## Alcance revisado
- `src/features/pos/pages/POSPage.tsx`
- `src/features/pos/hooks/usePOSCart.ts`
- `src/features/pos/components/POSCatalog.tsx`
- `src/features/pos/components/POSCart.tsx`
- `src/features/pos/application/queries/getProducts.query.ts`
- `src/features/pos/application/queries/getCustomers.query.ts`

## Resumen ejecutivo
POS no es CRUD.
Es un flujo operativo transaccional en tiempo real.
La pantalla está diseñada para:
- buscar productos,
- armar ticket,
- capturar pagos,
- y registrar venta.

Si se evalúa con expectativa CRUD, se sentirá “incompleta” por definición.
Pero eso no significa que esté mal diseñada para su propósito base.

## C, Create
### Estado
Sí existe, pero como creación de venta transaccional.

### Evidencia
- El carrito arma una venta temporal.
- `completeSale()` procesa venta vía RPC `process_sale_transaction`.
- Se envían líneas de carrito y pagos.

### Observaciones
El “create” aquí no es alta de registro administrativo editable, sino cierre de transacción de venta.

### Riesgo
Bajo a medio.
Depende más de reglas operativas y consistencia transaccional que de CRUD clásico.

## R, Read
### Estado
Funcional para operación.

### Evidencia
- Búsqueda de productos.
- Búsqueda de clientes.
- Lectura de stock y precio en catálogo.
- Lectura de precondiciones operativas: caja, almacén, pagos.
- Lectura de total, subtotal, impuestos, pagado y cambio.

### Observaciones
La lectura está orientada a vender, no a administrar ventas históricas.
Eso es coherente con una pantalla POS.

### Riesgo
Bajo.

## U, Update
### Estado
Existe solo como manipulación del ticket en curso.

### Qué sí existe
- Agregar producto al ticket.
- Quitar producto del ticket.
- Cambiar líneas de pago.
- Limpiar ticket.
- Reiniciar ticket al cambiar contexto.

### Observaciones
No existe edición de una venta ya cerrada.
Tampoco debería existir aquí como comportamiento normal.

### Riesgo
Bajo si se entiende como flujo operativo.

## D, Delete
### Estado
No aplica como delete clásico.

### Qué sí existe
- Quitar líneas del carrito.
- Limpiar ticket en curso.

### Observaciones
No existe eliminar ventas históricas desde POS, lo cual es correcto.

### Riesgo
Bajo.

## Hallazgos prioritarios

### 1. POS no debe medirse como CRUD
Prioridad: Muy alta de claridad conceptual
- Es flujo transaccional puro.
- Evaluarlo como CRUD produce diagnóstico equivocado.

### 2. El problema relevante en POS no es CRUD, sino precondiciones y reglas operativas
Prioridad: Alta
- caja,
- almacén,
- métodos de pago,
- stock,
- precio,
- referencias,
- cambio.

### 3. Falta distinguir entre pantalla operativa de venta y administración posterior de ventas
Prioridad: Media
- Si el sistema necesita ver/editar/cancelar ventas después, eso probablemente debe vivir en otro módulo, no en POS.

## Veredicto
### POS NO está roto por falta de CRUD,
porque definitivamente no es una pantalla CRUD.

Mi lectura actual sería:
- **Create:** sí, como transacción de venta
- **Read:** bien para operación
- **Update:** sí, pero solo sobre ticket en curso
- **Delete:** no aplica; solo remoción/limpieza del ticket

## Conclusión importante de esta ronda
Con POS queda casi cerrada la hipótesis general:
las pantallas críticas del sistema no comparten una sola naturaleza.

Hay al menos tres familias claras:
1. pantallas CRUD reales,
2. pantallas de flujo operativo,
3. pantallas híbridas.

Una parte del malestar actual probablemente viene de que esa diferencia no está explicitada ni en UX ni en expectativas de producto.

## Siguiente paso recomendado
1. Construir una matriz global comparando:
- Productos
- Compras
- Inventario
- Caja
- POS
2. Marcar para cada una:
- tipo de pantalla,
- nivel de madurez,
- hueco principal,
- prioridad.
