# Auditoría del puente reabasto, Inventario → Compras, ronda 1

## Hallazgo principal
El puente entre Inventario y Compras **sí existe**, pero hoy funciona como un
### **handoff manual asistido**, no como automatización real de reabasto.

## Qué confirmé

### En Inventario
`ReorderSuggestionsPanel`:
- detecta productos en mínimo
- calcula sugerencia de recompra
- permite acción `Preparar compra`

Pero esa acción no crea una compra real.

Lo que hace hoy es:
- construir una lista de ítems sugeridos
- guardarla en `localStorage` bajo `ventuki.purchaseDraftFromReorder`
- pedir al usuario abrir Compras

### En Compras
`PurchasesPage`:
- lee `ventuki.purchaseDraftFromReorder`
- precarga ítems en el formulario de draft
- intenta sugerir proveedor
- deja al usuario completar proveedor, costos y revisar agrupación

## Lectura actual del diseño
Esto significa que hoy el sistema usa un patrón de:
### **preparación de intención de compra**
no de creación automática de orden.

Y eso probablemente fue una decisión prudente.

---

## Qué sí resuelve hoy
- evita reescribir partidas manualmente desde cero
- conecta mínimos de Inventario con preparación de Compras
- deja revisión humana antes de crear draft real
- permite sugerir proveedor antes de confirmar una orden

## Qué no resuelve todavía
- no crea draft persistido automáticamente
- no agrupa formalmente por proveedor
- no maneja varias compras separadas cuando los productos pertenecen a proveedores distintos
- no deja trazabilidad fuerte entre alerta de stock y compra resultante
- depende de `localStorage`, así que el puente es local y frágil

---

## Riesgo de automatizar demasiado pronto
Si se pasara directo de alerta mínima a draft persistido automático, todavía quedarían abiertas decisiones delicadas como:
- un solo proveedor vs múltiples proveedores
- costos vacíos o estimados
- cantidades sugeridas vs cantidades negociadas
- una sola recompra combinada vs varios drafts
- qué hacer con sugerencias repetidas mientras un draft ya existe

## Veredicto
Hoy el sistema está en un punto intermedio razonable:
### sugerencia operativa + preparación manual asistida

No parece maduro todavía para automatización completa sin definir mejor las reglas de agrupación y trazabilidad.

---

## Recomendación
El siguiente slice correcto no sería “crear compra automática al tocar mínimo”.

Sería:
### **formalizar el handoff de reabasto**

### Alcance recomendado
1. reemplazar `localStorage` por un payload más formal o draft persistido controlado
2. explicitar si la salida es:
   - sugerencia editable,
   - borrador persistido,
   - o propuesta agrupada por proveedor
3. agregar trazabilidad mínima entre:
   - sugerencia de reabasto
   - draft generado
   - compra confirmada

## Recomendación concreta de producto
Mi recomendación es esta secuencia:
1. **mantener revisión humana**
2. **crear draft persistido explícito desde Inventario**
3. **agrupar por proveedor cuando la heurística sea confiable**
4. solo después evaluar automatización mayor

## Conclusión
El puente correcto ya empezó a existir,
pero todavía está en versión:
### **handoff asistido, no flujo cerrado de reabasto**

Y eso es exactamente lo que conviene endurecer en la siguiente implementación.
