# Cierre de arquitectura de readiness, POS, ronda 1

## Objetivo
Sacar de `usePOSCart` la parte más estructural de preparación operativa para dejar el hook más enfocado en estado del ticket y orquestación de UI.

## Ajustes aplicados

### Application layer
Se agregó:
- `ensurePosReadyUseCase`
- `getActivePaymentMethodsQuery`

### Qué consolidan
- caja activa
- almacén operativo disponible
- métodos de pago activos

### Hook
`usePOSCart` ahora usa esa capa para:
- resolver readiness principal
- sincronizar warehouse efectivo
- cargar métodos de pago activos
- derivar banderas base de operación

## Qué no moví todavía
Las validaciones finas del cobro siguen cerca de `completeSale`, lo cual todavía tiene sentido porque están pegadas a la ejecución transaccional.

## Beneficio
- menos dispersión de reglas de readiness
- mejor frontera entre aplicación y UI
- base más limpia para seguir endureciendo POS sin crecer el hook desordenadamente

## Veredicto
POS no necesitaba CRUD ni una expansión funcional grande.
Necesitaba cerrar mejor su readiness operativa, y este sprint va exactamente en esa dirección.
