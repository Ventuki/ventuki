# Cierre de validación transaccional de checkout, POS, ronda 1

## Objetivo
Sacar de `usePOSCart` las reglas finas de validación del cobro para separar mejor:
- estado del ticket,
- readiness operativa,
- validación transaccional.

## Ajuste aplicado
Se agregó:
- `validateCheckoutUseCase`

## Qué consolidó
- usuario autenticado
- readiness operativa mínima para cobrar
- existencia de líneas en ticket
- contexto de empresa/sucursal/almacén
- normalización de pagos
- referencias obligatorias para no-efectivo
- suficiencia de pago
- restricción de excedente sin efectivo
- límite de pagos no-efectivo

## Resultado
`usePOSCart` quedó menos cargado de reglas de checkout y más enfocado en orquestación.

## Veredicto
Este era el siguiente paso natural en POS:
### separar ticket y flujo de UI de la validación transaccional del cobro.
