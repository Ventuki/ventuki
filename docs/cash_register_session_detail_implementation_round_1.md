# Implementación de detalle de sesión, Caja, ronda 1

## Objetivo
Completar el historial reciente de Caja con una vista simple de detalle para sesiones cerradas o recientes.

## Ajustes aplicados

### Backend / aplicación
Se agregó:
- `listSessionMovements` en repositorio
- `getSessionDetailUseCase`

### UI
Se agregó:
- `CashSessionDetailDialog`
- botón `Ver detalle` en historial reciente

## Qué muestra el detalle
- apertura
- cierre
- efectivo esperado
- diferencia final
- movimientos ligados por sesión

## Beneficio
- el historial reciente ya no es solo una lista plana
- Caja gana inspección operativa real sin volverse un módulo administrativo pesado
- prepara mejor una futura auditoría más completa si hace falta
