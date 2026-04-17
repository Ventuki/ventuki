# POS flow audit round 2, compras e inventario

## Resumen
Se revisaron las pantallas y lógica de Compras e Inventario contra el flujo correcto de operación retail. La conclusión principal es que Ventuki ya tiene una base técnica bastante avanzada, pero todavía arrastra ambigüedades de UX y una contradicción funcional importante en Compras: la pantalla presenta un flujo de orden de compra en draft, pero la creación usa una transacción directa que actualiza stock.

Eso debe corregirse para alinearse con una operación real de tienda.

## Módulo 1, Compras

## Flujo retail correcto esperado
1. crear orden de compra en draft
2. revisar cantidades, costos, proveedor y almacén destino
3. confirmar compra
4. recibir mercancía parcial o total
5. afectar inventario solo en la recepción
6. cancelar o reabrir según reglas de negocio
7. registrar incidencias de recepción de forma trazable

## Hallazgo crítico 1, contradicción entre UI y operación real
### Evidencia
La pantalla indica:
- "Nueva orden de compra"
- "Se crea en draft y se confirma después"
- botón: `Crear draft`

Pero el flujo ejecuta:
- `createDirectPurchase(...)`
- RPC: `process_purchase_transaction`
- mensaje de éxito: `Compra directa registrada exitosamente (Stock actualizado)`

### Problema
Eso mezcla dos operaciones que en retail deben diferenciarse con claridad:
- crear compra
- recibir mercancía

Si al crear la compra ya se actualiza stock, entonces:
- el estado `draft` deja de representar una orden no recibida
- la confirmación posterior se vuelve conceptualmente débil
- la recepción posterior puede duplicar o confundir movimientos
- el usuario aprende un flujo incorrecto para compras

### Impacto
Muy alto

### Corrección sugerida de código
- la pantalla de compras debe usar el flujo de `createPurchaseUseCase` o equivalente a draft real
- `createDirectPurchase` no debería alimentar esta pantalla si su semántica es compra + recepción atómica
- si se quiere conservar `createDirectPurchase`, debe vivir en otro flujo explícito, por ejemplo "Compra directa con recepción inmediata"

### Corrección sugerida de UI
- separar claramente:
  - `Crear orden de compra`
  - `Registrar recepción`
- si existe una operación inmediata, nombrarla con honestidad operacional

## Hallazgo 2, recepción bien encaminada, pero necesita más señalización de estado
### Evidencia
La pantalla ya soporta:
- compra seleccionada
- recepción parcial/total
- incidencias
- confirmación, cancelación, reapertura

### Problema
Aunque la lógica parece sólida, la UI todavía no comunica con suficiente claridad:
- qué compras están listas para recepción
- qué estado tiene cada compra
- si una compra ya impactó stock o no
- cuánto falta por recibir de forma visual

### Impacto
Alto

### Corrección sugerida
- mostrar badge/estado más visible por compra
- mostrar resumen por compra: total pedido, total recibido, total pendiente
- restringir visualmente acciones no válidas según estado

## Hallazgo 3, falta de distinción visual entre folio interno y factura del proveedor
### Problema
`Folio / Factura` en un solo campo puede confundir:
- folio interno de compra
- número de factura del proveedor

### Impacto
Medio

### Corrección sugerida
Separar en UI:
- `Folio interno`
- `Factura proveedor`

## Hallazgo 4, expectedDate y notes existen en estado local, pero no se reflejan bien en la operación
### Problema
La fecha esperada aparece en estado local, pero el flujo principal visible no la aprovecha operativamente.

### Impacto
Medio

### Corrección sugerida
- reactivar fecha esperada en la UI
- usarla para seguimiento de compras pendientes y alertas de atraso

## Módulo 2, Inventario

## Flujo retail correcto esperado
1. consultar stock por sucursal/almacén
2. distinguir entre ajuste, transferencia, conteo físico, reserva y recepción
3. usar cada flujo correcto para cada operación
4. preservar trazabilidad en kardex
5. alertar faltantes sin inducir ajustes incorrectos

## Hallazgo 1, base técnica muy buena
### Evidencia
El módulo tiene:
- hooks y usecases
- transferencias
- kardex
- alertas
- conteo físico
- pruebas de concurrencia y dominio

### Valor
Esto pone a Inventario como uno de los módulos más maduros del proyecto.

## Hallazgo 2, el ajuste de inventario está demasiado genérico en UI
### Evidencia
`AdjustInventoryModal` pide:
- producto
- almacén
- delta
- notas

### Problema
Para usuario operativo, `delta` es una abstracción técnica. En retail real, el usuario necesita saber por qué está ajustando:
- merma
- robo
- corrección por conteo
- daño
- regularización
- error de captura

Un ajuste demasiado libre tiende a convertirse en la salida fácil para arreglar cualquier problema, incluso cuando la operación correcta sería recepción, transferencia o conteo físico.

### Impacto
Muy alto

### Corrección sugerida de UI
- renombrar `delta` a algo más entendible
- obligar motivo de ajuste
- mostrar advertencia: "No uses ajuste si lo correcto es recepción, transferencia o conteo"

### Corrección sugerida de lógica
- clasificar ajustes por tipo
- auditar motivo obligatoriamente

## Hallazgo 3, transferencias internas están bien orientadas, pero requieren validación operativa extra
### Evidencia
El panel ya separa:
- almacén origen
- almacén destino
- producto
- cantidad
- notas

### Problema
Falta reforzar reglas visibles como:
- disponibilidad suficiente en origen
- usuario responsable
- confirmación con resumen antes de ejecutar

### Impacto
Medio alto

### Corrección sugerida
- mostrar stock disponible antes de transferir
- pedir confirmación con resumen
- registrar responsable visible

## Hallazgo 4, conteo físico está mejor alineado con operación real que el ajuste manual
### Evidencia
El flujo contempla:
- folio
- almacén
- partidas
- revisión previa
- publicación final
- diferencias sistema vs conteo

### Valor
Este flujo sí está bien alineado con operación real y debe promoverse como el camino correcto para conciliación de stock.

### Corrección sugerida
- reforzar en UI que diferencias relevantes deben resolverse por conteo físico, no por ajuste libre
- conectar mejor conteo con kardex y resumen de impacto

## Hallazgo 5, falta ayuda operativa transversal
### Problema
El módulo permite muchas acciones correctas, pero la pantalla no enseña claramente cuándo usar cada una.

### Impacto
Alto

### Corrección sugerida
Agregar ayuda contextual tipo:
- `Ajuste`: corrige diferencias puntuales extraordinarias
- `Transferencia`: mueve stock entre almacenes
- `Conteo físico`: concilia inventario real contra sistema
- `Recepción de compra`: entra mercancía comprada

## Backlog concreto para el orquestador

## Prioridad 1
1. Corregir la contradicción de compras: draft no debe actualizar stock
2. Separar claramente orden de compra vs recepción de mercancía
3. Endurecer ajuste de inventario con motivo obligatorio y lenguaje menos técnico
4. Agregar ayuda contextual para evitar flujo incorrecto de stock

## Prioridad 2
5. Mejorar visibilidad de estados de compra
6. Mostrar resumen pedido/recibido/pendiente
7. Separar folio interno y factura proveedor
8. Mostrar stock disponible antes de transferir

## Prioridad 3
9. Reforzar uso de fecha esperada de compra
10. Mejorar trazabilidad visual entre recepción, kardex y conteo físico

## Impacto esperado
Aplicar estas correcciones reduciría errores muy típicos de operación:
- compras que alteran stock antes de tiempo
- ajustes manuales usados como parche
- recepción ambigua
- diferencias de inventario mal explicadas

## Esfuerzo estimado
- corrección de flujo de compras: medio a alto
- mejoras UX en inventario: medio
- refuerzo de validaciones: medio

## Siguiente acción recomendada
Continuar ronda 2 del auditor POS sobre:
1. POS
2. Apartados
3. Caja

porque ahí están los siguientes puntos críticos de operación real.
