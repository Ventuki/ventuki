# Auditoría CRUD, Compras, ronda 1

## Alcance revisado
- `src/features/purchases/pages/PurchasesPage.tsx`
- `src/features/purchases/services/purchaseService.ts`
- `src/features/purchases/application/createPurchase.usecase.ts`
- `src/features/purchases/infrastructure/purchase.repository.ts`
- `src/features/purchases/ux/purchaseFlow.ts`
- `src/features/purchases/validations/purchase.schema.ts`

## Resumen ejecutivo
La pantalla de Compras no debe leerse como CRUD tradicional completo.
Lo que existe hoy es un flujo operativo por estados:
- draft
- confirmed
- partial
- received
- cancelled

Eso significa que algunas expectativas de CRUD normal probablemente no se cumplen porque el módulo está modelado más como proceso que como entidad editable libremente.
Aun así, sí hay huecos importantes si lo evaluamos como pantalla administrativa robusta.

## C, Create
### Estado
Funcional.

### Evidencia
- Existe creación de orden de compra en draft.
- Hay validación de schema.
- La creación usa RPC atómico `create_purchase_with_items`.
- El flujo desde recompra de inventario hacia draft también existe.

### Observaciones
- El alta parece suficientemente sólida para operación inicial.
- Se apoya bien en proveedor, sucursal, partidas y costos.

### Riesgo
Bajo a medio.

## R, Read
### Estado
Parcialmente funcional.

### Evidencia
- Se lista historial reciente de compras.
- Se muestran estado, folio, monto y proveedor.
- Se puede seleccionar compra y cargar partidas pendientes de recepción.

### Huecos detectados
- No se ve una vista detallada completa de la compra como entidad administrativa.
- La lectura está muy enfocada a recepción, no a inspección integral.
- No se aprecia consulta clara del detalle original de partidas ya registradas fuera del contexto de recepción.

### Riesgo
Medio.
Porque sí se puede leer lo necesario para operar recepción, pero no necesariamente administrar bien la compra completa.

## U, Update
### Estado
Muy parcial / restringido por flujo.

### Evidencia
- Existen transiciones de estado: confirmar, cancelar, reabrir.
- Existe recepción parcial/total.

### Hueco importante
No existe aquí edición libre de una compra ya creada en draft, al menos no visible en esta pantalla.
No se aprecia mecanismo para:
- editar encabezado del draft,
- cambiar proveedor,
- corregir partidas ya agregadas en una compra existente,
- recalcular o rearmar el draft desde una compra ya guardada.

### Observaciones
Si la intención del producto es manejar compras como flujo inmutable por etapas, esto puede ser aceptable.
Pero si el usuario espera CRUD administrativo clásico de órdenes de compra, el Update está incompleto.

### Riesgo
Alto.
Porque aquí la palabra “editar compra” parece no existir realmente como capacidad UI clara.

## D, Delete
### Estado
No funcional como delete clásico.

### Evidencia
- No aparece eliminación física de compra.
- Lo que existe es transición a `cancelled`.

### Observaciones
Esto probablemente es correcto desde negocio.
Para compras normalmente conviene cancelación, no borrado duro.
Entonces aquí el problema no es que falte delete, sino que el módulo no es CRUD puro y debe entenderse así.

### Riesgo
Bajo si está intencionalmente diseñado así.
Medio si el usuario espera borrar drafts erróneos y hoy no puede hacerlo ni diferenciarlos bien.

## Hallazgos prioritarios

### 1. Compras no es CRUD tradicional, sino flujo por estados
Prioridad: Alta de claridad conceptual
- Si se evalúa con expectativa CRUD clásica, va a parecer incompleto.
- Hay que distinguir entre entidad administrativa editable y flujo operativo de abastecimiento.

### 2. Update administrativo casi inexistente en UI
Prioridad: Alta
- No se ve edición de draft persistido.
- No se ve corrección de partidas ya guardadas.
- No se ve rearmado de compra existente.

### 3. Read insuficiente para administración completa
Prioridad: Media
- La lectura actual ayuda a recibir, pero no a administrar en profundidad la orden.

### 4. Delete sustituido por cancelación
Prioridad: Media
- Probablemente correcto por negocio.
- Pero conviene explicitar mejor que la baja es cancelación, no eliminación.

## Veredicto
### Compras NO está roto como flujo operativo básico,
pero NO está cerrado como CRUD administrativo completo.

Mi lectura actual sería:
- **Create:** bien
- **Read:** parcial
- **Update:** muy parcial
- **Delete:** no aplica como delete duro; existe cancelación

## Implicación importante
Si varias pantallas del sistema están modeladas así, una parte del problema no será solo “CRUD roto”, sino una mezcla entre:
- pantallas pensadas como flujo operativo,
- pantallas pensadas como CRUD,
- y ausencia de una separación clara entre ambas cosas.

## Siguiente paso recomendado
1. Auditar **Inventario**, porque probablemente combine lectura fuerte con CRUD parcial y operaciones especiales.
2. Después auditar **Caja** y **POS**, que seguramente serán más flujos operativos que CRUD tradicional.
3. Eventualmente construir una matriz final:
- CRUD real
- flujo operativo
- híbrido
para cada pantalla crítica.
