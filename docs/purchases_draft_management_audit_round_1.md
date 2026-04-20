# Auditoría de administración mínima del draft en Compras, ronda 1

## Hallazgo principal
Hoy **no existe base funcional suficiente** para editar un `draft` persistido de compra.

La pantalla de `PurchasesPage.tsx` sí permite:
- crear un nuevo `draft`,
- listar compras,
- seleccionar compra para recepción,
- confirmar,
- cancelar,
- reabrir.

Pero **no permite cargar un draft existente al formulario de edición**.

---

## Evidencia encontrada
### Sí existe
- `createDraftPurchase(...)`
- `listPurchases(...)`
- `getPendingPurchaseItems(...)`
- transiciones `confirm/cancel/reopen`
- recepción parcial/total

### No existe
- `getPurchaseById(...)`
- `getPurchaseDraftDetail(...)`
- `updatePurchaseUseCase(...)`
- repositorio para actualizar encabezado de compra
- repositorio para reemplazar/editar `purchase_items`
- carga del formulario desde una compra `draft` ya guardada

Además, el `grep` no encontró base para `updatePurchase` o `upsertPurchase` en Compras.

---

## Conclusión funcional
El hueco de Compras no es solo UX.
Es también de **capacidad real ausente**.

No hay hoy un mecanismo intermedio tipo:
- abrir draft,
- editar encabezado,
- editar partidas,
- guardar cambios,
- luego confirmar.

Por eso el módulo sí se queda corto como “administración controlada del borrador”.

---

## Remediación mínima recomendada
Para cerrar este hueco sin convertir Compras en CRUD libre completo, lo mínimo razonable sería agregar:

### 1. Lectura de detalle del draft
Un método tipo:
- `getPurchaseDraftDetail(purchaseId, companyId)`

Que recupere:
- encabezado de compra,
- partidas (`purchase_items`),
- solo si el estado es `draft`.

### 2. Caso de uso de actualización de draft
Un caso de uso tipo:
- `updatePurchaseDraftUseCase`

Con política restringida a estado `draft`.

### 3. Persistencia controlada de partidas
Decidir estrategia mínima:
- reemplazo completo de partidas en draft,
- o edición granular.

Mi recomendación inicial sería:
### **reemplazo completo mientras siga en draft**
porque simplifica mucho la implementación y reduce ambigüedad.

### 4. UX de “Editar draft”
Permitir seleccionar una compra en `draft` y cargarla al formulario izquierdo.

---

## Estrategia recomendada
### No editar compras fuera de `draft`

Regla clara:
- `draft` se puede corregir
- `confirmed` en adelante ya no se reescribe como orden, solo se opera por flujo

Eso mantiene coherencia con la naturaleza del módulo.

---

## Prioridad
Alta.
Porque este sí parece ser el hueco funcional más claro que le falta a Compras para sentirse completo dentro de su propio modelo.

---

## Siguiente paso técnico recomendado
Implementar primero la base de datos/aplicación mínima para:
1. leer detalle de draft
2. actualizar encabezado + reemplazar partidas en `draft`
3. luego conectar la UI

Ese orden reduce riesgo y evita parchear solo la pantalla.
