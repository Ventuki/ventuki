# Auditoría CRUD, Productos, ronda 1

## Alcance revisado
- `src/features/products/pages/ProductsPage.tsx`
- `src/features/products/components/ProductForm.tsx`
- `src/features/products/components/ProductList.tsx`
- `src/features/products/hooks/useManageProducts.ts`
- `src/features/products/hooks/useSaveProduct.ts`
- `src/features/products/services/productService.ts`

## Resumen ejecutivo
La pantalla de Productos sí tiene una base CRUD real, pero no está completamente cerrada como CRUD robusto.
Hay partes funcionales, partes parciales y al menos un hueco importante en la edición frente a inventario.

## C, Create
### Estado
Funcional, con mejoras recientes.

### Evidencia
- Existe formulario de alta con validaciones base.
- Se puede guardar producto desde `useSaveProduct`.
- Se contemplan SKU, nombre, barcode, precio, costo, estatus y banderas operativas.
- Para nuevos productos existe flujo opcional de inventario inicial.

### Observaciones
- La creación parece ser la parte más madura de la pantalla.
- Se agregaron ayudas visuales útiles para stock inicial y validación posterior en inventario/POS.

### Riesgo
Medio.
No parece roto de base, pero depende de que catálogos y precios existan bien.

## R, Read
### Estado
Funcional.

### Evidencia
- Existe búsqueda por nombre, SKU y barcode.
- El listado muestra estado activo, precio, barcode y señal de “listo para POS”.
- Hay carga de detalles para edición con `getProductForEdit`.

### Observaciones
- La lectura operativa mejoró bastante.
- Sigue siendo más una lectura comercial/operativa que una vista administrativa completa del producto.

### Riesgo
Bajo a medio.

## U, Update
### Estado
Parcial.

### Evidencia
- Existe botón Editar.
- Existe carga de datos al formulario.
- El submit reutiliza `save()` con `id`, así que sí hay update del registro principal.

### Hueco importante detectado
En `ProductForm.tsx`, la sección de:
- `manage_stock`
- `warehouse_id`
- `initial_stock`

solo se muestra cuando **no** existe `initialValues.id`, es decir, solo en creación.

Eso significa que al editar:
- no se puede revisar ni ajustar esa parte desde esta pantalla,
- no se ve claramente qué pasó con inventario inicial,
- y la edición queda incompleta respecto al flujo real del producto.

### Observaciones
Esto no rompe el update del producto base, pero sí deja el CRUD incompleto en términos operativos.
No es un “Update full” de la entidad tal como el usuario la percibe.

### Riesgo
Alto.
Porque el usuario puede asumir que editar producto cubre todo el estado relevante, cuando no es así.

## D, Delete
### Estado
Probablemente funcional, pero riesgoso y necesita validación real.

### Evidencia
- Existe botón Eliminar en listado.
- Existe `deleteProductUseCase` invocado desde `useManageProducts`.
- Existe `deleteProductById` a nivel servicio.

### Observaciones
No se aprecia aquí confirmación fuerte de UI antes de eliminar.
Tampoco se ve en esta lectura si el borrado es duro o si protege contra relaciones ya existentes.
Si el producto ya fue usado en inventario, compras o ventas, este punto puede ser delicado.

### Riesgo
Alto hasta validar en ejecución.
Aquí puede existir uno de los CRUD “aparentemente funcionales” pero problemáticos en operación real.

## Hallazgos prioritarios

### 1. Update incompleto respecto a inventario
Prioridad: Alta
- Editar producto no expone la parte de inventario inicial / gestión de stock.
- La experiencia de edición no cubre todo lo que el alta sí cubre.

### 2. Delete potencialmente frágil
Prioridad: Alta
- Falta validar si borrar producto usado en otros módulos falla, rompe o está protegido.
- También falta revisar si conviene eliminación lógica en vez de delete duro.

### 3. CRUD más comercial que administrativo
Prioridad: Media
- La pantalla opera bien para alta/listado/edición base.
- Pero no queda claro que el usuario esté viendo toda la entidad producto y sus dependencias reales.

## Veredicto
### Productos NO está completamente roto,
pero tampoco está cerrado como CRUD robusto y completo.

Mi lectura actual sería:
- **Create:** bien
- **Read:** bien
- **Update:** parcial
- **Delete:** incierto / riesgoso hasta validar

## Siguiente paso recomendado
1. Validar en código y/o prueba real el comportamiento de **Delete** con producto ya relacionado.
2. Revisar si el **Update** debe ampliarse o si la parte de inventario debe vivir explícitamente fuera del CRUD de producto.
3. Continuar auditoría CRUD con **Compras** o **Inventario**, porque ahí seguramente aparecerán más huecos de consistencia.
