# Sprint 1, siguientes pasos

## Contexto de entrada
Sprint 0 quedó cerrado como fase de endurecimiento del circuito base.

## Objetivo inmediato
Avanzar desde una base ya operable hacia validación integrada real, mayor solidez funcional y reducción de deuda visible.

## Prioridad 1
### POS, precondiciones operativas
- Validar que exista almacén operativo.
- Validar que exista contexto completo empresa/sucursal/almacén.
- Validar que el flujo de pago tenga configuración mínima suficiente.
- Mostrar bloqueos y mensajes operativos claros, no ambiguos.

## Prioridad 2
### QA integrado del circuito base
- Probar login → contexto → dashboard → caja → POS → cierre.
- Confirmar consistencia visual y funcional entre módulos.
- Registrar fallas reales restantes.

## Prioridad 3
### Decisión de onboarding
- Comparar onboarding simple vs onboarding completo.
- Definir cuál quedará como flujo definitivo.
- Hacer consolidación solo después de cubrir el circuito base.

## Recomendación
Seguir primero con POS y sus precondiciones operativas. Es el punto con mayor riesgo de incoherencia funcional.
