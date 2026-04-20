# Factibilidad de implementación, update de draft en Compras, ronda 1

## Veredicto
Sí parece **factible con bajo a medio riesgo** implementar administración mínima de `draft` **sin crear una RPC nueva de entrada**.

## Por qué
### 1. La estructura de datos ya lo permite
En `types.ts` se ve que:
- `purchases` permite `Update`
- `purchase_items` permite `Insert`, `Update` y `Delete`

### 2. Ya existen triggers en BD para recomputar totales
En migraciones aparece:
- `purchase_items_set_total_trigger`
- `purchase_items_recompute_totals_trigger`

Eso reduce bastante la lógica que tendría que asumir la app para recalcular montos.

### 3. El flujo de recepción ya depende de que `purchase_items` esté bien normalizado
Eso hace razonable que el draft se pueda rearmar antes de confirmar.

---

## Slice técnico mínimo viable
### Backend / aplicación
Implementar:

1. `getPurchaseDraftDetail(...)`
   - lee encabezado de `purchases`
   - lee partidas de `purchase_items`
   - restringe a `status = 'draft'`

2. `updatePurchaseDraftUseCase(...)`
   - valida schema
   - exige permiso de compra
   - verifica que la compra siga en `draft`
   - actualiza encabezado
   - reemplaza partidas

3. Repositorio con operaciones explícitas:
   - `getDraftDetail`
   - `updateDraftHeader`
   - `deleteDraftItems`
   - `insertDraftItems`

### Estrategia recomendada para partidas
**Reemplazo completo de líneas mientras siga en `draft`.**

Esto evita complejidad innecesaria de diff granular y es suficiente para una primera versión.

---

## Restricción crítica
### Solo editable en `draft`

Si no está en `draft`, no se actualiza.

Esa regla protege:
- coherencia del flujo,
- recepción posterior,
- y expectativas del módulo.

---

## Riesgos a vigilar
1. asegurar que no existan `received_qty > 0` en líneas del draft, aunque por modelo no debería pasar
2. validar que el reemplazo completo no choque con políticas RLS
3. confirmar que el formulario UI pueda distinguir entre “crear” y “actualizar” sin romper recompra desde Inventario

---

## Recomendación
El siguiente paso ya puede ser implementación real del slice mínimo:
- detalle de draft,
- update de draft,
- luego conexión UI.

No parece necesario detenerse antes en otra auditoría.
