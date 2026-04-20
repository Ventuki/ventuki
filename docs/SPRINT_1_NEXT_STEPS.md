# Sprint 1, siguientes pasos

## Estado
Sprint 1 quedó sustancialmente endurecido en UI operativa y verificabilidad manual.

## Cierre alcanzado
- Productos ahora comunica mejor si el artículo quedó listo para POS.
- Inventario ganó mejor verificabilidad, refresco manual y lectura de estados.
- Compras quedó más clara en recompra, recepción parcial/total e incidencias.
- Conteo físico y transferencias internas ahora muestran mejor su impacto antes de afectar stock.
- POS comunica mejor sus precondiciones operativas y la cobrabilidad real de los productos.

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
- Estado actual: este frente ya quedó bastante endurecido en UI y mensajes operativos; lo siguiente es validación integrada y cierre selectivo.

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
El siguiente paso ya no es solo endurecer UI aislada, sino validar integradamente el circuito y decidir si Sprint 1 se cierra formalmente o si queda una pasada corta de QA real.

## QA manual corto del bloque ya endurecido

### 1. Producto listo para POS
- Crear o editar producto activo con precio operativo.
- Confirmar que en Productos aparezca como listo o incompleto para POS.
- Ir a POS y validar encontrabilidad por búsqueda.

### 2. Recompra desde Inventario hacia Compras
- Detectar alerta o sugerencia de recompra.
- Enviar a Compras.
- Confirmar toast con cantidad de productos y banner de carga desde Inventario.

### 3. Compra y recepción
- Crear draft, confirmar compra y abrir recepción.
- Validar resumen de estado de compra.
- Capturar una recepción parcial y revisar pendiente acumulado.
- Capturar una incidencia y verificar su visibilidad en el resumen previo.

### 4. Conteo físico
- Crear conteo con al menos una partida que suba y otra que baje.
- Abrir la previa y validar resumen de subidas, bajadas y sin cambio.
- Publicar solo si el impacto neto visible coincide.

### 5. Transferencia interna
- Seleccionar origen, destino, producto y cantidad.
- Validar resumen previo antes de transferir.
- Confirmar que origen y destino iguales muestren bloqueo claro.

### 6. Cierre funcional mínimo
- Volver a Inventario y revisar si el resultado esperado se refleja visualmente.
- Registrar cualquier hueco donde el stock cambie pero la lectura operativa siga ambigua.
