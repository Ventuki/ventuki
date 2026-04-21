# Auditoría de política de reabasto, Inventario, ronda 1

## Hallazgo principal
La base para política de reabasto **ya existe en datos**, pero **no está expuesta como capacidad funcional clara**.

## Qué confirmé
### Sí existe en datos
En `stock_levels` ya viven:
- `min_stock`
- `max_stock`

Y esos valores sí alimentan hoy:
- alertas (`useStockAlerts`)
- sugerencias de recompra (`ReorderSuggestionsPanel`)
- lectura de tabla de inventario (`InventoryTable`)

### No encontré hoy
- caso de uso para actualizar `min_stock` / `max_stock`
- acción de repositorio explícita para configurarlos
- UI para editar parámetros de reabasto por producto/almacén

## Conclusión
La política de reabasto está **parcialmente construida**:
- ya hay soporte de datos,
- ya hay lectura,
- ya hay alertas,
- ya hay sugerencia de compra,

pero falta una pieza central:
### **configuración explícita de parámetros de stock**

---

## Implicación de negocio
Si la regla es:
- cuando el producto llegue a su mínimo,
- debe prepararse o solicitarse su compra,

entonces `min_stock` y `max_stock` son parte de una política operativa real, no de un dato accesorio.

Eso sí justifica remediación funcional.

---

## Slice funcional recomendado
### Nombre sugerido
**Configuración de reabasto por producto/almacén**

### Alcance mínimo
1. permitir editar `min_qty`
2. permitir editar `max_qty`
3. persistir sobre `stock_levels`
4. reflejarlo de inmediato en:
   - tabla
   - alertas
   - sugerencias de recompra

### Restricción recomendada
No mezclar esto con ajustes de existencia.

Separar claramente:
- **cantidad actual** = operación
- **mínimos/máximos** = política de reabasto

---

## Recomendación de UX
No lo haría inline de entrada en toda la tabla.

Me parece mejor una acción controlada por fila o modal tipo:
- `Configurar reabasto`

Porque comunica mejor que no estás moviendo stock, sino configurando política.

---

## Veredicto
Aquí sí aparece ya una remediación funcional con bastante sentido:
### agregar configuración explícita de `min/max` en Inventario

No porque falte CRUD clásico,
sino porque falta cerrar la política de reabasto que el propio sistema ya sugiere con alertas y recompra.
