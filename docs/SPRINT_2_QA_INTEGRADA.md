# Sprint 2, QA integrada y cierre de huecos reales

## Objetivo
Validar el circuito operativo de punta a punta con foco en fallas reales, fricciones visibles y huecos de consistencia que todavía aparezcan al usar la app como operación diaria.

## Principio de trabajo
No abrir frentes grandes por intuición.
Primero probar el flujo real, luego corregir solo lo que aparezca como bloqueo, inconsistencia o ambigüedad relevante.

## Circuitos prioritarios

### 1. Producto → Inventario → POS
- Crear producto.
- Validar precio, estado operativo y stock inicial.
- Confirmar encontrabilidad y cobrabilidad en POS.

### 2. Inventario → Recompra → Compras → Recepción
- Detectar necesidad de recompra.
- Mandar a Compras.
- Confirmar borrador, proveedor sugerido, recepción parcial/total e incidencias.
- Revisar reflejo posterior en inventario.

### 3. Conteo físico → Ajuste
- Crear conteo.
- Revisar previa.
- Publicar ajuste.
- Confirmar efecto esperado en inventario.

### 4. Transferencia interna
- Mover stock entre almacenes.
- Confirmar lectura previa y reflejo posterior.

### 5. Caja → POS → Cierre
- Abrir caja.
- Cobrar con distintos métodos.
- Revisar cambio, validaciones y cierre.
- Confirmar coherencia final con arqueo.

## Qué registrar
- Bloqueos reales.
- Ambigüedades operativas todavía visibles.
- Inconsistencias entre módulos.
- Mensajes que no ayuden a destrabar operación.
- Casos donde el dato cambie pero la UI no lo haga evidente.

## Resultado esperado
Un backlog corto, priorizado y basado en operación real, listo para un Sprint 2 verdaderamente guiado por QA integrada en vez de intuición.
