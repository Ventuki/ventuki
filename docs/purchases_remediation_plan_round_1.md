# Plan de remediación de Compras, ronda 1

## Objetivo
Aterrizar qué debe corregirse en Compras sin forzarlo a ser un CRUD tradicional cuando su naturaleza real es un flujo operativo por estados.

---

## Diagnóstico consolidado
Compras no debe transformarse ciegamente en CRUD clásico.
Su base conceptual parece correcta como flujo:
- `draft`
- `confirmed`
- `partial`
- `received`
- `cancelled`

Pero hoy tiene dos huecos importantes:

1. **administración insuficiente del draft y de la orden como entidad**
2. **arquitectura inconsistente en transiciones críticas**

---

## Hallazgo técnico importante
Durante la revisión apareció esta inconsistencia:

- `createPurchaseUseCase` sí existe
- `receivePurchaseUseCase` sí existe
- pero `confirmPurchase`, `cancelPurchase` y `reopenPurchase` se hacen directo en `purchaseService`
- y `src/features/purchases/application/cancelPurchase.usecase.ts` no existe

### Implicación
El módulo está mezclando:
- capa de aplicación,
- acceso directo desde servicio/UI,
- y reglas de transición repartidas.

Eso no necesariamente rompe operación hoy, pero sí vuelve más frágil el módulo y más difícil endurecer reglas de negocio.

---

## Estado actual por frente

### 1. Create
**Estado:** bien

### Qué sí logra
- alta de compra en `draft`
- creación atómica por RPC `create_purchase_with_items`
- integración con sugerencia de recompra

### Observación
Está razonablemente bien resuelto para entrada inicial.

---

### 2. Read
**Estado:** parcial

### Qué sí logra
- listado reciente
- lectura suficiente para recepción
- resumen operativo de compra seleccionada

### Qué falta
- vista administrativa más completa de la compra
- mejor inspección de partidas guardadas como entidad
- lectura más clara de historial y contexto de la orden

---

### 3. Update
**Estado:** restringido por flujo, pero además incompleto como administración de draft

### Qué sí existe
- transiciones de estado
- recepción parcial / total
- cancelación
- reapertura

### Qué falta realmente
- edición de draft persistido
- corrección de encabezado
- ajuste de partidas ya guardadas antes de confirmar

### Lectura
No hace falta volverlo CRUD libre completo.
Pero sí hace falta una administración mínima del `draft`.

---

### 4. Delete
**Estado:** reemplazado por cancelación

### Lectura
Eso es correcto para negocio.
No parece necesario delete duro.

---

## Remediaciones sugeridas por prioridad

### Prioridad 1
#### Consolidar transiciones en capa de aplicación

### Acción recomendada
Crear casos de uso explícitos para:
- `confirmPurchaseUseCase`
- `cancelPurchaseUseCase`
- `reopenPurchaseUseCase`

Y dejar de ejecutar esas transiciones directo desde `purchaseService`.

### Beneficio
- reglas centralizadas,
- permisos más consistentes,
- menor fragilidad,
- base más limpia para auditoría y validaciones futuras.

---

### Prioridad 2
#### Definir administración mínima de draft

### Acción recomendada
Permitir al menos, mientras siga en `draft`:
- editar proveedor,
- editar folio,
- editar fecha esperada,
- editar notas,
- ajustar partidas.

### Beneficio
Cierra el hueco más claro del módulo sin convertir Compras en edición libre de cualquier estado.

---

### Prioridad 3
#### Mejorar lectura administrativa de compra

### Acción recomendada
Agregar o reforzar una vista de detalle que muestre:
- encabezado,
- partidas,
- cantidades pedidas / recibidas,
- estatus,
- incidencias,
- contexto de almacén / recepción.

### Beneficio
Mejor inspección y menor dependencia de la lógica de recepción como única forma de lectura.

---

### Prioridad 4
#### Explicitar que cancelar sustituye eliminar

### Acción recomendada
Ajustar copy y UX para que quede claro que:
- una compra no se borra,
- se cancela,
- y puede reabrirse si el flujo lo permite.

### Beneficio
Reduce expectativa CRUD equivocada.

---

## Decisión recomendada
### No empujar Compras hacia CRUD libre completo.

La remediación correcta parece ser:
- **más administración de draft**,
- **mejor detalle de lectura**,
- **arquitectura más consistente para transiciones**,
- sin romper la lógica de flujo por estados.

---

## Definición más honesta del módulo
Compras debería sentirse como:

### “flujo de abastecimiento con administración controlada del borrador”

no como:

### “CRUD total de órdenes de compra en cualquier estado”

---

## Cierre ejecutivo
Compras no parece fallar por falta de CRUD en sentido estricto.
Falla más bien por dos cosas:
- administración insuficiente del `draft`,
- y transiciones importantes todavía demasiado pegadas al servicio/UI.

Eso orienta mejor la remediación:
### menos CRUD genérico,
### más flujo bien cerrado con capa de aplicación consistente.
