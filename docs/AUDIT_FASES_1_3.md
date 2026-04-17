# Auditoría técnica rápida (Fases 1–3)

Fecha: 2026-04-05

## Objetivo
Elevar calidad de código/proyecto antes de avanzar a siguientes fases del roadmap.

## Hallazgos críticos y acciones

### 1) Ajuste de stock con comportamiento inconsistente para deltas negativos en filas inexistentes
- **Riesgo:** permitir ajustes negativos con saldo inicial no real.
- **Acción:** hardening de `adjust_stock` para bloquear decrementos sin existencia previa y `delta = 0`.
- **Estado:** ✅ corregido en migración de hardening.

### 2) Búsqueda de productos e inventario sin cobertura completa de barcode
- **Riesgo:** operación POS lenta/incompleta al no encontrar por código de barras.
- **Acción:** búsqueda cruzada en `product_barcodes` + filtros por `product_id`.
- **Estado:** ✅ aplicado en `ProductsPage` e `InventoryPage`.

### 3) Edición de producto sobreescribía `is_active`
- **Riesgo:** datos inconsistentes por reactivación involuntaria.
- **Acción:** preservar y permitir editar estado activo/inactivo.
- **Estado:** ✅ aplicado.

## Hallazgos de calidad no bloqueantes

1. Faltan pruebas automáticas ejecutables en entorno actual (dependencias no disponibles).
2. Faltan servicios desacoplados por feature (`services/`) para reducir lógica en páginas.
3. Se recomienda centralizar parseo CSV robusto (comillas/escape) para catálogos.
4. Se recomienda normalizar guards de permisos backend/frontend por matriz de permisos real.

## Recomendaciones siguientes (antes de Fase 4)

1. Agregar tests unitarios para funciones críticas de inventario (ajustes, validaciones).
2. Agregar pruebas de integración para RLS en tablas nuevas de fase 3.
3. Extraer lógica de consultas/mutaciones a `services` por feature.
4. Documentar contratos RPC/Edge Functions en `docs/`.

---

## Avance ejecutado: Fase 4 (Compras y Entradas)

- Se agregó modelo de datos para proveedores, compras, renglones de compra, recepciones y renglones de recepción.
- Se implementó RPC `receive_purchase` para registrar recepción parcial/total y disparar entrada automática a inventario por `adjust_stock`.
- Se agregaron políticas RLS por empresa para proveedores y compras.
- Se agregaron pantallas base para:
  - CRUD de proveedores (`/suppliers`)
  - Alta de orden de compra + recepción (`/purchases`)

Resultado esperado de salida de fase habilitado en backend:  
**Compra creada → recibida (parcial/total) → stock actualizado con `stock_movements` tipo `purchase`.**
