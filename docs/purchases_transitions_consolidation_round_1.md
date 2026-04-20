# Consolidación de transiciones de Compras, ronda 1

## Problema
Las transiciones `confirm`, `cancel` y `reopen` estaban ejecutándose directo desde `purchaseService` contra Supabase, mientras que `create` y `receive` ya pasaban por capa de aplicación.

## Ajuste aplicado
Se agregó una capa de aplicación mínima para:
- `confirmPurchaseUseCase`
- `cancelPurchaseUseCase`
- `reopenPurchaseUseCase`

Además:
- se amplió RBAC con `purchase.confirm` y `purchase.reopen`
- se agregó `purchaseTransitionSchema`
- el repositorio recibió métodos explícitos para cada transición
- `purchaseService` dejó de hacer esas transiciones directo sobre la tabla

## Beneficio
- reglas más centralizadas
- menos lógica de transición dispersa
- base más limpia para futuras validaciones y auditoría
- consistencia mayor con `createPurchaseUseCase` y `receivePurchaseUseCase`

## Limitación actual
Todavía falta que la UI pase permisos/actor de forma más rica si se quiere endurecer realmente este frente por usuario/rol. Por ahora se consolidó la arquitectura básica sin rehacer todo el módulo.
