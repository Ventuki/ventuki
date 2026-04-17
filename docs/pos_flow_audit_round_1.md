# POS flow audit round 1

## Agente lógico
Auditor de Flujos POS / Operación Retail

## Misión
Contrastar los flujos actuales de Ventuki contra prácticas razonables de operación retail para punto de venta, compras, inventario, stock, caja, apartados y facturación, y notificar al orquestador qué debe corregirse en pantallas y código.

## Referencias externas consultadas

1. WooPOS Support, creación de layaway
   - un apartado debe iniciar desde POS con cliente seleccionado
   - el artículo pasa a estado comprometido/on-hold
   - debe existir flujo posterior para pagos pendientes, edición, cancelación y liquidación

2. RMH POS Docs, políticas de layaway
   - conviene definir fecha de expiración
   - conviene definir depósito mínimo
   - los artículos apartados deben quedar marcados como comprometidos
   - el flujo debe contemplar cancelación y política de devolución

3. RMH POS Docs, políticas de caja
   - caja debe operar con reglas explícitas de apertura/cierre
   - deben existir montos de apertura/cierre
   - roles/permisos para retiros, pagos y reportes
   - límites de sobre/faltante

4. Buenas prácticas de recepción e inventario retail (Shopify/POS retail references)
   - una compra debe separar creación, confirmación y recepción
   - la recepción puede ser parcial o total
   - el inventario no debe ajustarse informalmente cuando la operación corresponde a compra o transferencia
   - conteos físicos y cycle counts deben tener flujo trazable

## Evaluación de Ventuki por flujo

### 1. Productos
### Estado
Existe módulo de productos y validaciones.

### Flujo correcto esperado
- alta con datos mínimos claros
- control de precio, costo, impuestos y código/barcode
- validación de duplicados
- activación/desactivación en vez de borrado agresivo

### Hallazgo
Parece estar contemplado a nivel de módulos, pero aún falta documento funcional que confirme si el flujo completo de producto soporta operación real en tienda, especialmente barcode, variantes, precio vigente y baja segura.

### Prioridad
Media

### Corrección sugerida al orquestador
- revisar formulario de alta/edición
- validar campos operativos mínimos
- definir baja lógica y reglas de duplicado

## 2. Compras y recepción
### Estado
Hay módulo de compras, servicios, validaciones y referencias a recepción parcial/total en QA.

### Flujo correcto esperado
- crear borrador
- confirmar compra
- recibir parcial o totalmente
- impactar inventario solo vía recepción
- permitir cancelación/reapertura con reglas claras

### Hallazgo
La base va en la dirección correcta. El riesgo es que la UI o lógica permita mezclar "compra" con "ajuste de stock" sin distinguir operación contable y operativa.

### Prioridad
Alta

### Corrección sugerida al orquestador
- revisar que compra y recepción sean pasos separados
- validar que el inventario cambie por recepción y no antes
- documentar estados de compra visibles en UI

## 3. Inventario y stock
### Estado
Es uno de los módulos más maduros del proyecto. Tiene dominio, usecases, transferencias, kardex, conteo físico y pruebas.

### Flujo correcto esperado
- consulta por almacén/sucursal
- movimientos trazables
- ajustes controlados con motivo
- transferencias entre almacenes
- reserva/liberación de stock
- conteos físicos con conciliación

### Hallazgo
La base técnica es buena, pero hace falta confirmar que las pantallas expliquen claramente la diferencia entre:
- ajuste
- transferencia
- reserva
- recepción de compra
- conteo físico

Cuando eso no está claro, el usuario termina corrigiendo stock por el flujo equivocado.

### Prioridad
Alta

### Corrección sugerida al orquestador
- revisar nomenclatura y UX de acciones de stock
- agregar ayudas contextuales y validaciones por tipo de movimiento
- impedir que una operación de negocio se resuelva con un ajuste genérico si hay flujo específico

## 4. POS / Venta
### Estado
Existe módulo robusto con dominio, hooks, repositorios, cobro y pruebas.

### Flujo correcto esperado
- búsqueda rápida de producto
- carrito estable
- validación de stock antes del cobro
- selección opcional/obligatoria de cliente según política
- cobro multi-método
- emisión de comprobante/ticket
- impacto correcto en caja, inventario y auditoría

### Hallazgo
El proyecto ya contempla mucho de esto. El siguiente riesgo funcional es la coherencia entre POS, caja e inventario bajo escenarios reales: cancelación, cambio de cliente, pago mixto, sesión vencida o stock insuficiente.

### Prioridad
Alta

### Corrección sugerida al orquestador
- validar flujos negativos y de excepción del POS
- revisar mensajes y estados durante cobro
- confirmar que el ticket/comprobante sea un cierre natural del flujo

## 5. Apartados
### Estado
Existe módulo específico de apartados con detalle, pagos y servicio.

### Flujo correcto esperado
- apartados solo con cliente identificado
- depósito mínimo configurable
- fecha de vencimiento
- inventario comprometido, no vendido todavía
- pagos posteriores
- cancelación con política clara
- liquidación que convierte el apartado en venta final

### Hallazgo
El proyecto ya tiene módulo, pero no está claro aún si la UX refleja bien reglas de negocio fundamentales como depósito mínimo, vencimiento, cancelación y estado comprometido del stock.

### Prioridad
Alta

### Corrección sugerida al orquestador
- verificar si el flujo exige cliente
- agregar campos visibles de vencimiento, depósito mínimo y estado
- confirmar que el stock quede reservado/comprometido correctamente

## 6. Caja
### Estado
Existe módulo `cash-register` con apertura, cierre y movimientos.

### Flujo correcto esperado
- apertura con monto inicial
- movimientos de entrada/salida controlados
- cierre con conciliación
- límites de sobre/faltante
- permisos por rol
- conexión clara con ventas

### Hallazgo
Está presente el módulo, pero hay que confirmar visualmente si las reglas de apertura/cierre y movimientos están suficientemente explícitas para operación real. En un POS, caja no debe sentirse opcional ni ambigua.

### Prioridad
Alta

### Corrección sugerida al orquestador
- revisar obligatoriedad de apertura antes de vender
- revisar cierre con resumen esperado vs contado
- revisar permisos y razones de movimientos de caja

## 7. Facturación
### Estado
Existe módulo sólido con cancelación, nota de crédito, PDF, email y validaciones.

### Flujo correcto esperado
- emitir factura desde venta válida
- validar datos fiscales
- reintentar timbrado
- cancelar con motivo
- emitir nota de crédito si aplica
- permitir descarga/envío

### Hallazgo
La base técnica es prometedora. El riesgo aquí suele ser de UX y trazabilidad: qué pasa si falla el timbrado, cómo se ve el estado al usuario y cómo se relaciona la factura con la venta original.

### Prioridad
Media alta

### Corrección sugerida al orquestador
- revisar estados visibles del ciclo de facturación
- validar escenarios de error y reintento
- mejorar trazabilidad desde venta hacia factura

## Notificaciones al orquestador, backlog priorizado

### Prioridad 1
1. Asegurar que compras y recepción sean pasos distintos y visibles
2. Asegurar que inventario no se "corrija" por flujo equivocado
3. Revisar POS en escenarios de excepción reales
4. Revisar apartados con depósito mínimo, vencimiento y stock comprometido
5. Revisar caja con apertura/cierre y conciliación obligatoria

### Prioridad 2
6. Validar formulario y ciclo de vida de productos
7. Revisar trazabilidad de facturación y errores de timbrado

### Prioridad 3
8. Uniformar ayuda contextual y lenguaje operativo entre módulos
9. Consolidar reglas del negocio retail en documentos funcionales por flujo

## Impacto esperado
Si estas correcciones se ejecutan, Ventuki se alineará mucho más con una operación real de tienda y reducirá errores típicos de POS:
- stock incorrecto
- compras mal recibidas
- apartados ambiguos
- caja inconsistente
- facturación desconectada de la venta

## Esfuerzo estimado
- diagnóstico funcional detallado por pantallas: medio
- ajustes UX y validaciones: medio
- ajustes de lógica/flujo en operaciones críticas: medio a alto

## Siguiente acción recomendada
Ronda 2 del auditor POS:
1. revisar una por una las pantallas clave
2. convertir hallazgos en checklist por pantalla
3. proponer correcciones concretas de UI y código empezando por compras, inventario, POS, apartados y caja
