# Auditoría de Update en Productos, ronda 1

## Alcance revisado
- `src/features/products/components/ProductForm.tsx`
- `src/features/products/hooks/useSaveProduct.ts`
- `src/features/products/validations/product.schema.ts`
- `src/features/products/application/upsertProduct.usecase.ts`
- `src/features/products/pages/ProductsPage.tsx`

## Resumen ejecutivo
`Update` en Productos sí existe, pero hoy mezcla responsabilidades de forma imperfecta.
No está totalmente roto, pero tampoco está claramente delimitado.

El formulario administra tres capas a la vez:
1. **datos maestros del catálogo**,
2. **configuración comercial mínima**,
3. **arranque operativo parcial**.

El problema no es solo técnico.
Es de frontera funcional.

---

## 1. Qué sí pertenece claramente a Productos
Estos campos sí encajan bien en un CRUD administrativo de producto:

- `sku`
- `name`
- `description`
- `category_id`
- `brand_id`
- `unit_id`
- `barcode`
- `is_active`

### Lectura
Esto sí es catálogo base.
Aquí el módulo está bien orientado.

---

## 2. Qué también cabe en Productos, pero como configuración comercial
Estos campos todavía pueden vivir razonablemente aquí:

- `price_list_id`
- `price`
- `cost`

### Lectura
No son puro catálogo descriptivo, pero sí forman parte de la preparación comercial del producto.
Además impactan de inmediato en `sale_ready` y POS.

### Conclusión
Es defendible que sigan en Productos.

---

## 3. Qué ya huele a capa operativa
Estos campos o comportamientos se sienten menos propios de un CRUD administrativo puro:

- `manage_stock`
- `initial_stock`
- `warehouse_id`
- parte del discurso funcional de `control_expiration`

### Evidencia
- `manage_stock`, `initial_stock` y `warehouse_id` solo se usan para crear stock inicial y solo en creación (`!input.id`).
- En edición no existe ajuste posterior de stock desde este módulo.
- El usuario puede interpretar que inventario “se administra” aquí, pero eso no es verdad.
- `control_expiration` sí se persiste en `products`, pero el copy actual lo presenta casi como regla operativa específica.

### Lectura
Aquí hay mezcla de responsabilidades:
- Productos hace onboarding operativo inicial,
- pero no administración operativa continua.

Eso genera asimetría y expectativa confusa.

---

## 4. Problema principal del Update actual
### No es falta de botón editar.
El problema es que el módulo no deja suficientemente claro qué está editando realmente.

Hoy la semántica parece ser:
- editar producto,
- editar precio,
- definir inventario inicial,
- marcar caducidad,

pero después:
- el stock ya no se edita ahí,
- el almacén inicial deja de ser parte editable real,
- la operación continua vive en Inventario.

Eso puede hacer que el usuario piense que el módulo está incompleto o inconsistente.

---

## Veredicto
### `Update` en Productos es funcional, pero conceptualmente borroso.

Mi lectura sería:
- **Update de catálogo:** sí
- **Update comercial mínima:** sí
- **Update operativo continuo:** no

Entonces el hueco no es “falta update”, sino:
### **falta separar o explicar mejor qué se actualiza aquí y qué se actualiza en otros módulos**

---

## Recomendación de remediación

### Opción recomendada, mínima y segura
Mantener Productos como módulo de:
- catálogo base,
- activación,
- barcode,
- precio/costo base,
- flags del producto.

Pero comunicar mejor que:
- `initial_stock` y `warehouse_id` solo aplican al alta inicial,
- los movimientos posteriores pertenecen a Inventario.

### Qué no haría todavía
No metería ajuste de stock completo dentro de Productos.
Eso empeoraría la mezcla.

---

## Cambios de UX recomendados
1. renombrar o explicar mejor el bloque de inventario inicial
2. hacer visible que solo aplica al crear producto
3. reforzar el puente hacia Inventario después del alta
4. revisar el copy de `control_expiration` para tratarlo como atributo del producto, no como mini flujo operativo ambiguo

---

## Prioridad
Alta, pero de claridad funcional y UX.
No parece un bug severo de ejecución, sino un problema de límites del módulo.
