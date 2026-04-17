# POS flow audit round 2, caja

## Resumen
Se revisó el módulo de Caja comparándolo contra un flujo razonable de operación retail. La base técnica no está mal: hay apertura, cierre, arqueo, validaciones, movimientos y cálculo de diferencias. El problema es que la pantalla actual es demasiado mínima para una caja operativa real. Hoy el módulo parece más una prueba funcional de backend que una estación de caja lista para trabajo diario.

## Flujo retail correcto esperado
1. verificar que el cajero no tenga otra caja abierta
2. abrir caja con fondo inicial
3. operar ventas vinculadas a una sesión activa
4. registrar ingresos/salidas extraordinarias con motivo
5. consultar resumen parcial durante el turno
6. cerrar caja con arqueo completo
7. comparar esperado vs contado
8. registrar faltante o sobrante
9. dejar trazabilidad por usuario, sucursal y sesión

## Hallazgo 1, la lógica de apertura y cierre existe y está bien orientada
### Evidencia
- validación para impedir doble sesión abierta
- apertura con `opening_balance`
- cierre con cálculo de totales esperados vía RPC
- cálculo de diferencia en cierre
- eventos de dominio para apertura/cierre/movimientos

### Valor
La base del flujo está bien planteada a nivel técnico.

## Hallazgo 2, la UI actual es demasiado reducida para operación real
### Evidencia
La pantalla solo permite:
- abrir caja con fondo inicial
- cerrar caja capturando solo efectivo contado

### Problema
No se muestra ni se gestiona claramente:
- total esperado en efectivo
- total esperado en tarjeta
- total esperado en transferencia
- diferencia o arqueo antes de confirmar
- movimientos extraordinarios durante la sesión
- sesión activa con contexto visible

### Impacto
Muy alto

### Corrección sugerida
La pantalla debe evolucionar de "formulario mínimo" a "panel operativo de caja" con:
- estado actual de sesión
- montos esperados
- montos contados
- diferencia
- movimientos del turno
- usuario/sucursal visibles

## Hallazgo 3, cierre incompleto desde la UX
### Evidencia
`closeSessionUseCase` y repositorio sí consideran:
- `counted_cash`
- `counted_card`
- `counted_transfer`

Pero la UI solo captura:
- `countedCash`

Y envía:
- `counted_card: 0`
- `counted_transfer: 0`

### Problema
Eso puede generar arqueos engañosos o cierres incompletos cuando la operación sí tuvo pagos no efectivo.

### Impacto
Crítico

### Corrección sugerida de UI
Agregar campos explícitos para:
- efectivo contado
- tarjeta contada
- transferencia contada
- notas de cierre

### Corrección sugerida de lógica
Mostrar el esperado vs contado antes de confirmar cierre.

## Hallazgo 4, movimientos de caja existen en backend pero no en pantalla
### Evidencia
Existe `recordCashMovementUseCase` con tipos:
- income
- expense
- deposit
- withdrawal

### Problema
El cajero u operador no tiene UI para registrar:
- retiros
- gastos
- depósitos
- ingresos extraordinarios

En retail real eso es esencial.

### Impacto
Muy alto

### Corrección sugerida
Agregar sección de movimientos de caja con:
- tipo de movimiento
- método de pago
- monto
- referencia
- descripción obligatoria
- historial de movimientos de la sesión

## Hallazgo 5, falta visibilidad de sesión activa
### Problema
La pantalla guarda `sessionId` localmente, pero no comunica suficiente contexto operacional:
- quién abrió la caja
- cuándo se abrió
- saldo inicial
- estatus actual
- si ya hubo ventas o movimientos

### Impacto
Alto

### Corrección sugerida
Mostrar una tarjeta de sesión activa con:
- sucursal
- cajero
- hora de apertura
- fondo inicial
- id/folio de sesión

## Hallazgo 6, la caja no está conectada visualmente con el POS
### Problema
Aunque conceptualmente POS y caja deben estar acoplados, en la UI no se siente esa relación. El cajero no ve claramente si puede vender solo con caja abierta o qué estado tiene su sesión.

### Impacto
Alto

### Corrección sugerida
- reflejar estado de caja dentro del POS
- o bloquear ventas si la política exige caja abierta
- vincular claramente venta, sesión y arqueo

## Hallazgo 7, faltan reglas visibles de sobre/faltante y confirmación
### Problema
El sistema calcula diferencia, pero el usuario no ve antes del cierre:
- cuánto debería haber
- cuánto contó
- si quedará faltante o sobrante
- si debe justificar una diferencia

### Impacto
Alto

### Corrección sugerida
- mostrar resumen previo al cierre
- pedir nota obligatoria si la diferencia supera umbral
- hacer visible faltante/sobrante antes de confirmar

## Backlog concreto para el orquestador

## Prioridad 1
1. ampliar UI de cierre para efectivo, tarjeta y transferencia
2. mostrar esperado vs contado antes de cerrar
3. exponer movimientos de caja en pantalla
4. mostrar sesión activa con contexto operativo
5. conectar mejor POS con estado de caja

## Prioridad 2
6. agregar notas obligatorias en diferencias relevantes
7. mostrar historial de movimientos y resumen del turno
8. mejorar trazabilidad visual de usuario/sucursal/sesión

## Prioridad 3
9. agregar reglas de límites de sobre/faltante
10. reforzar permisos y acciones disponibles según rol

## Impacto esperado
Estas mejoras reducirían errores muy típicos de tienda:
- cierres incompletos
- diferencias no explicadas
- ventas desacopladas de caja
- retiros o depósitos sin trazabilidad visible

## Esfuerzo estimado
- mejoras UX principales: medio
- conexión POS-caja: medio
- trazabilidad y reglas de diferencia: medio

## Siguiente acción recomendada
Cerrar esta fase del auditor POS consolidando un backlog maestro con prioridades cruzadas entre:
- compras
- inventario
- POS
- apartados
- caja

y convertirlo en roadmap de corrección incremental.
