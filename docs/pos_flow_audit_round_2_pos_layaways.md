# POS flow audit round 2, POS y apartados

## Resumen
Se revisaron los módulos de POS y Apartados comparándolos contra un flujo razonable de operación retail. El resultado es mixto: POS tiene una base fuerte para venta rápida y multipago, mientras que Apartados ya arranca desde una lógica correcta de cliente identificado. Sin embargo, ambos módulos necesitan hacer más visibles varias reglas de negocio para evitar errores operativos en tienda.

## Módulo 1, POS

## Flujo retail correcto esperado
1. identificar sucursal, caja y almacén operativos
2. buscar producto por nombre, SKU o código de barras
3. validar stock antes de vender
4. agregar productos al carrito
5. asociar cliente cuando aplique
6. capturar uno o más métodos de pago
7. validar referencias para métodos no efectivo
8. cerrar venta
9. impactar inventario, caja y auditoría
10. entregar comprobante/ticket y dejar claro que la venta terminó bien

## Hallazgo 1, la base operativa del POS es buena
### Evidencia
- búsqueda de producto
- bloqueo por falta de stock
- multipago
- validación de referencia para pagos no efectivo
- limpieza de ticket al cerrar
- RPC atómica `process_sale_transaction`

### Valor
Esto está bien orientado a operación real y reduce errores en la transacción.

## Hallazgo 2, falta visibilidad explícita del contexto de caja/almacén
### Problema
Aunque el hook sincroniza contexto de empresa, sucursal y almacén activo, la pantalla no lo comunica claramente al cajero.

En operación real es importante saber:
- en qué sucursal está cobrando
- qué almacén respalda el stock
- si la caja está realmente lista para operar

### Impacto
Alto

### Corrección sugerida
- mostrar en POS un encabezado operativo con sucursal, almacén y estado de caja
- impedir cobro si la caja no está abierta, si esa es la política del negocio

## Hallazgo 3, el cierre de venta no deja un post-flujo suficientemente visible
### Evidencia
Al completar venta se muestra toast y se limpia el carrito.

### Problema
Para retail real suele faltar si no queda explícito:
- número o folio de venta
- opción de imprimir o reimprimir ticket
- estado final de la transacción
- posibilidad de iniciar factura post-venta si aplica

### Impacto
Medio alto

### Corrección sugerida
- mostrar resumen final de venta
- exponer ticket o comprobante de cierre
- conectar con facturación cuando el flujo lo requiera

## Hallazgo 4, el cliente es opcional, pero la UI debería explicar cuándo sí conviene seleccionarlo
### Problema
En muchas tiendas cliente puede ser opcional, pero se vuelve necesario para:
- facturación
- apartados
- seguimiento de venta
- historial o crédito

### Impacto
Medio

### Corrección sugerida
- agregar ayuda contextual tipo: "Selecciona cliente si la venta requiere factura o seguimiento"
- facilitar conversión de venta rápida a venta con cliente

## Hallazgo 5, faltan escenarios operativos visibles de excepción
### Problema
La lógica ya valida varias excepciones, pero falta comprobar y comunicar mejor en UI casos como:
- stock insuficiente al momento final
- pérdida de sesión
- métodos de pago mal capturados
- errores del RPC

### Impacto
Alto

### Corrección sugerida
- mejorar mensajes y recuperación de error
- evaluar una pantalla o modal de confirmación final con resumen del pago

## Módulo 2, Apartados

## Flujo retail correcto esperado
1. crear apartado con cliente identificado
2. seleccionar productos apartables
3. registrar anticipo o depósito mínimo
4. definir vencimiento
5. comprometer stock, no venderlo todavía
6. registrar pagos posteriores
7. liquidar o cancelar
8. devolver stock si se cancela según política

## Hallazgo 1, el flujo arranca bien porque exige cliente
### Evidencia
`CreateLayawayDialog` obliga cliente y productos.

### Valor
Eso está alineado con operación retail real. Un apartado sin cliente identificado es mala práctica.

## Hallazgo 2, no se ve una política clara de depósito mínimo
### Problema
Aunque el flujo permite crear apartado, la UI no hace visible una regla de negocio crítica:
- cuánto anticipo mínimo debe pagarse para crear el apartado

Las referencias externas consultadas sugieren que esto debe ser política explícita, no implícita.

### Impacto
Muy alto

### Corrección sugerida
- mostrar depósito mínimo requerido
- impedir creación si no se cumple la política
- reflejarlo en el resumen del apartado

## Hallazgo 3, vencimiento sí existe, pero aún no parece política operativa fuerte
### Evidencia
Existe `due_date`.

### Problema
La fecha está como campo disponible, pero no se comunica como regla viva del negocio:
- cuánto tiempo tiene el cliente
- qué pasa al vencer
- si hay cancelación automática o revisión manual

### Impacto
Alto

### Corrección sugerida
- hacer visible estado de vencimiento
- mostrar alertas de próximos vencimientos
- documentar política de expiración y cancelación

## Hallazgo 4, no se muestra al usuario el concepto de stock comprometido
### Problema
En apartados, una regla clave es que el producto queda comprometido o reservado, pero todavía no vendido definitivamente.

La UI actual muestra productos, pagos y estado, pero no comunica de forma explícita ese efecto de inventario.

### Impacto
Alto

### Corrección sugerida
- mostrar que el stock quedó reservado/comprometido
- conectar detalle del apartado con el impacto inventario

## Hallazgo 5, la creación del apartado no deja claro el primer pago operacional
### Problema
La creación del apartado permite capturar productos, fecha y notas, pero no deja suficientemente claro si:
- se crea con anticipo inicial
- se crea sin pago
- el primer pago es obligatorio

En operación retail eso debería ser clarísimo.

### Impacto
Muy alto

### Corrección sugerida
- decidir política operacional:
  - apartado con anticipo obligatorio
  - o apartado sin anticipo pero con reglas explícitas
- reflejar esa política en la UI y validaciones

## Hallazgo 6, el detalle del apartado está bien orientado para seguimiento
### Evidencia
El detalle muestra:
- resumen
- total, pagado y resto
- progreso
- productos
- pagos
- cancelación
- agregar abono

### Valor
Este detalle está bastante bien encaminado para operación real.

### Mejora sugerida
Agregar:
- vencido / por vencer
- fecha límite más visible
- política de cancelación o devolución
- referencia a stock comprometido

## Backlog concreto para el orquestador

## Prioridad 1
1. Mostrar contexto operativo de POS: sucursal, almacén y estado de caja
2. Agregar cierre de venta más visible con folio/ticket
3. Definir y exponer política de anticipo mínimo en apartados
4. Definir y exponer política de vencimiento en apartados
5. Mostrar que el apartado compromete stock, no lo vende aún

## Prioridad 2
6. Mejorar mensajes de excepción en POS
7. Guiar mejor cuándo seleccionar cliente en venta
8. Aclarar si el apartado nace con pago obligatorio o no

## Prioridad 3
9. Conectar mejor POS con facturación posterior
10. Mejorar alertas y seguimiento de apartados vencidos o próximos a vencer

## Impacto esperado
Estas mejoras reducirían errores reales como:
- ventas hechas sin claridad de caja activa
- cobros cerrados sin comprobante útil
- apartados ambiguos
- inventario comprometido mal entendido
- clientes molestos por reglas no visibles de anticipo o vencimiento

## Esfuerzo estimado
- mejoras de UX en POS: medio
- definición y validación de políticas de apartados: medio
- integración de mensajes y estados: medio

## Siguiente acción recomendada
Continuar con el auditor POS sobre el módulo de Caja para cerrar el núcleo operativo principal del sistema.
