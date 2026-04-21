# Plan de remediación de Inventario, ronda 1

## Veredicto ejecutivo
Inventario **no parece pedir una remediación funcional grande e inmediata**.

Mi lectura actual es:
- la operación principal sí existe,
- la lectura base sí funciona,
- las acciones críticas sí están presentes,
- pero la experiencia todavía arrastra ambigüedad de módulo híbrido.

Entonces la prioridad correcta no parece ser “agregar más CRUD”, sino:

1. **mejorar explicitación del módulo**,
2. **refinar lectura y legibilidad**,
3. **evaluar después si hace falta una capa administrativa fina de parámetros**.

---

## Qué sí está suficientemente bien
### Operación
- ajuste manual
- transferencia
- conteo físico
- kardex
- alertas
- sugerencias de recompra

### Lectura base
- stock por almacén
- búsqueda
- resumen
- refresco

Eso sugiere que el corazón operativo del módulo está razonablemente bien encaminado.

---

## Dónde sí hay fricción real

### 1. Lectura todavía poco humana en algunos puntos
Ejemplos visibles:
- `StockAlertsPanel` usa `product_id` y `warehouse_id` si no resuelve nombres
- algunas piezas del módulo todavía se sienten más técnicas que operativas

### 2. Naturaleza híbrida poco explicitada
La pantalla junta:
- lectura,
- alertas,
- movimientos,
- conteo,
- recompra,
- kardex.

Eso es potente, pero puede sentirse como mezcla difusa si no se comunica mejor qué hace cada bloque.

### 3. Parámetros administrativos de stock no están claramente resueltos aquí
La auditoría previa ya apuntaba a:
- mínimos,
- máximos,
- configuración por producto/almacén.

Ese hueco existe, pero no parece el primer frente a remediar antes de mejorar claridad y legibilidad.

---

## Remediación recomendada por prioridad

### Prioridad 1
#### Mejorar legibilidad operativa
Acciones recomendadas:
- mostrar nombre de producto y almacén de forma consistente en alertas
- evitar fallback visible a ids crudos cuando haya datos disponibles
- revisar textos para que el módulo se sienta menos técnico y más operativo

### Prioridad 2
#### Explicitar que Inventario es centro operativo, no CRUD de registros
Acciones recomendadas:
- ajustar copy principal del módulo
- reforzar qué hace cada bloque
- evitar expectativa de edición inline de stock como si fuera hoja tabular CRUD

### Prioridad 3
#### Evaluar capa administrativa fina de parámetros de stock
Acciones recomendadas:
- decidir si min/max debe editarse aquí
- o si conviene una pantalla/configuración separada por producto/almacén

Esta sí es remediación funcional real, pero no parece la primera más rentable.

---

## Decisión recomendada
### No abrir todavía un sprint grande de lógica nueva para Inventario.

La recomendación más sensata ahora sería un sprint pequeño de:
### **claridad operativa y legibilidad**

Porque:
- cuesta menos,
- aclara mejor la naturaleza híbrida,
- y puede reducir bastante la sensación de incompletud sin tocar reglas de negocio sensibles.

---

## Siguiente slice sugerido
1. mejorar `StockAlertsPanel`
2. revisar textos de `InventoryPage`
3. decidir después si vale la pena abrir “configuración de min/max” como frente aparte
