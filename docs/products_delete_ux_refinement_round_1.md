# Refinamiento UX de delete en Productos, ronda 1

## Ajuste aplicado
Se hizo más honesto el flujo de eliminación en la UI.

### Cambios
- El botón ahora dice: `Eliminar / desactivar`
- Antes de ejecutar la acción, se muestra confirmación explicando que:
  - si el producto ya tiene uso en compras, inventario o ventas,
  - se desactivará en lugar de eliminarse.

## Por qué importa
Antes, la UX insinuaba una sola acción irreversible (`Eliminar`), pero la política real ya es condicional.
Ese desfase podía confundir al usuario y hacer que el sistema pareciera inconsistente.

## Resultado
Ahora la interfaz comunica mejor que:
- no todos los productos pueden borrarse realmente,
- algunos pasarán a estado inactivo,
- el comportamiento depende del historial operativo.

## Siguiente mejora sugerida
Después convendría reemplazar `window.confirm` por un diálogo UI consistente con el sistema de componentes, y distinguir mejor en auditoría entre `delete` y `deactivate`.
