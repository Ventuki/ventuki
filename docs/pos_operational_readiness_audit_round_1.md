# Auditoría de preparación operativa, POS, ronda 1

## Hallazgo principal
POS está razonablemente bien orientado como flujo transaccional, pero la validación de preparación operativa está demasiado dispersa en `usePOSCart`.

## Qué confirmé
### Sí existe
- validación de caja activa
- validación de almacén operativo
- validación de métodos de pago activos
- validaciones de pago suficiente, referencias y cambio
- bloqueo operativo antes de cobrar

### No encontré
- `ensurePosReadyUseCase`
- un cierre claro de precondiciones en application layer
- una frontera limpia entre:
  - reglas de readiness,
  - manipulación del ticket,
  - ejecución de venta

## Lectura actual
POS no está fallando por falta de funcionalidad base.

El hueco principal parece ser de:
### **arquitectura y claridad de reglas operativas**

Hoy `usePOSCart` concentra demasiado:
- sincronización de tenant/contexto
- readiness de caja
- readiness de almacén
- readiness de pagos
- reglas de líneas de pago
- reglas de cobro
- ejecución del cobro

## Riesgo
Esto no necesariamente rompe el flujo hoy,
pero sí vuelve más difícil:
- mantener reglas,
- testear precondiciones,
- y evolucionar POS sin meter regresiones.

## Slice recomendado
### Nombre sugerido
**Consolidación de readiness operativa de POS**

### Alcance mínimo
1. crear un caso de uso o servicio de aplicación para readiness de POS
2. mover allí las precondiciones principales:
   - caja activa
   - almacén disponible
   - métodos de pago activos
3. dejar `usePOSCart` más enfocado en estado del ticket y orquestación de UI
4. conservar las validaciones transaccionales finas cerca del cobro si conviene

## Recomendación
No abrir ahorita una remediación funcional grande en POS.

El siguiente sprint correcto aquí parece ser:
### **cierre arquitectónico de readiness**, no CRUD ni expansión administrativa.

## Veredicto
POS está bastante bien como flujo operativo.
Lo que más conviene ahora es ordenar la frontera de precondiciones antes de seguir agregando lógica nueva.
