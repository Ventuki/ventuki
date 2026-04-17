# Análisis profundo y plan de remediación — pantallas principales

**Fecha:** 2026-04-07  
**Alcance analizado:** Dashboard, Punto de Venta, Inventario, Productos, Compras y Proveedores.  
**Objetivo:** definir ruta de trabajo para dejar los flujos 100% funcionales y listos para prueba física operativa (tienda/sucursal).

---

## 1) Diagnóstico por pantalla

## 1.1 Dashboard (`/`)

### Estado actual
- La pantalla renderiza tarjetas con métricas hardcodeadas (`$0.00`, `0`, etc.), sin consultas reales a backend.
- No existe hook/servicio/query dedicado para KPIs operativos.

### Impacto operativo
- No permite validar salud real del negocio durante pruebas físicas.
- Oculta errores de integración (ventas, stock, clientes) porque siempre muestra ceros.

### Causas raíz
- Falta de capa de aplicación para agregados de negocio (ventas del día, transacciones, productos activos, clientes activos).
- Ausencia de contrato de datos y fallback visual para estados vacíos/error.

---

## 1.2 Punto de Venta (`/pos`)

### Estado actual
- Flujo base funcional: búsqueda de productos, carrito, cálculo de totales, cobro y ejecución de venta/pago por casos de uso.
- Se crea venta (`createSaleCommand`) y luego se procesa pago (`processPaymentUseCase`) vía RPC atómico `process_sale_payment`.
- Falta robustez UX para operación en piso:
  - No hay selección de cliente.
  - Método de pago reducido a efectivo en UI.
  - No hay reintento guiado ni recuperación de sesión de venta en caso de caída.
  - No hay impresión/ticket operacional integrado en flujo principal.

### Impacto operativo
- Riesgo de bloquear cobros reales ante errores intermitentes de red o refresh accidental.
- Flujo de caja limitado (sin mixto/tarjeta en UI) para pruebas físicas reales.

### Causas raíz
- Pantalla principal está simplificada respecto a capacidades disponibles en dominio/aplicación.
- Falta “estado de caja/sesión” transversal y evidencias post-venta (ticket, folio visible, desglose de pagos).

---

## 1.3 Inventario (`/inventory`)

### Estado actual
- Tiene consultas de stock, kardex, ajustes y transferencias.
- Ajuste y transferencia usan comandos/casos de uso con RBAC y RPC (`adjust_stock`, `transfer_stock`).
- Debilidades de usabilidad/operación:
  - Entradas por IDs manuales (warehouse/product) en paneles clave.
  - Modal de ajuste recibe `productOptions={[]}` (sin catálogo cargado en esa UI).
  - El flujo de conteo físico está como panel aislado, sin cierre/captura de diferencias en lote.

### Impacto operativo
- Alta probabilidad de error humano en pruebas físicas por captura manual de UUID.
- Dificulta validar procesos reales de almacén (ajuste masivo, conteo por ubicación, transferencia asistida).

### Causas raíz
- Brecha entre capacidades de backend y ergonomía de frontend.
- Falta de flujos guiados por contexto (sucursal/almacén/producto con selects y búsqueda).

---

## 1.4 Productos (`/products`)

### Estado actual
- CRUD funcional con búsqueda, edición y eliminación.
- Alta/edición sí utiliza `useSaveProduct` y `upsertProductCommand/usecase` con validación y auditoría.
- Debilidades:
  - Edición no carga ni persiste explícitamente `price/cost/price_list` en el formulario de vuelta (se actualizan parcialmente según captura manual).
  - Eliminación usa servicio directo en página, fuera de caso de uso (sin política homogénea de auditoría/eventos).
  - No hay validación preventiva de duplicados (SKU/barcode) antes de enviar.

### Impacto operativo
- Riesgo de datos incompletos de precio/costo durante pruebas de compra/venta.
- Inconsistencia de trazabilidad entre acciones de crear/actualizar vs eliminar.

### Causas raíz
- Flujo híbrido (parte con caso de uso, parte con service directo).
- Contrato de edición no trae todos los campos comerciales necesarios para round-trip completo.

---

## 1.5 Compras (`/purchases`)

### Estado actual
- Permite crear orden de compra y registrar recepción parcial/total.
- Usa servicios directos y RPC `receive_purchase`.
- Debilidades:
  - Estado forzado a `confirmed` al crear (sin etapa `draft` operativa).
  - No hay validación estricta de costos/impuestos/fechas a nivel schema en UI.
  - No hay cancelación/reapertura/bitácora visible del ciclo de compra.
  - Recepción usa texto fijo en notas y no guía incidencias (faltante/sobrante/daño).

### Impacto operativo
- Flujo real de abastecimiento incompleto para pruebas físicas (no cubre excepciones frecuentes).
- Riesgo de datos contables inconsistentes por validación insuficiente de importes.

### Causas raíz
- Servicio de página no está orquestado por capa application completa.
- Falta modelado de estados de negocio y transiciones en UI.

---

## 1.6 Proveedores (`/suppliers`)

### Estado actual
- CRUD funcional con validaciones básicas de email y RFC.
- Debilidades:
  - Validación solo en UI (regex local), sin schema central reutilizable en flujo visual.
  - Eliminación física directa (sin soft-delete explícito ni warning de dependencias).
  - Sin integración de scoring/estatus comercial (bloqueado, crédito, condiciones de pago).

### Impacto operativo
- Riesgo de captura inconsistente y pérdida de historial útil en pruebas reales.
- Posibles errores al intentar eliminar proveedor con documentos relacionados.

### Causas raíz
- Falta de reglas de negocio explícitas para ciclo de vida de proveedor.
- Falta de UX de prevención para entidades referenciadas por compras.

---

## 2) Hallazgos transversales que afectan 100% funcionalidad

1. **Desalineación UI vs operación real:** hay capacidades backend maduras que no están expuestas de forma operable en frontend.
2. **Ergonomía insuficiente para prueba física:** formularios con IDs manuales y sin asistentes aumentan error de captura.
3. **Cobertura de estados de negocio parcial:** faltan transiciones clave (borrador/cancelación/reapertura/incidencias).
4. **Observabilidad funcional limitada:** mensajes toast existen, pero faltan evidencias operativas (folios claros, trazas de acción, panel de errores recuperables).
5. **Pruebas funcionales no estandarizadas por flujo:** no existe checklist único de “aceptación física” por módulo.

---

## 3) Plan de remediación (priorizado)

## Fase A — Bloqueantes de operación (P0, semana 1)

### A1. Dashboard conectado a datos reales
- Crear `getDashboardKpisQuery` con métricas diarias por empresa/sucursal.
- Mostrar estados `loading/error/empty`.
- KPI mínimo: ventas hoy, tickets hoy, productos activos, clientes activos.

### A2. POS endurecido para caja real
- Habilitar métodos de pago múltiples en UI (efectivo/tarjeta/mixto) reutilizando `payments[]` existente.
- Agregar selección de cliente opcional + validación de contexto.
- Implementar recuperación de venta en curso (persistencia local + reconciliación).
- Mostrar comprobante post-cobro con folio, desglose y acción de impresión.

### A3. Inventario operable sin UUID manual
- Reemplazar inputs de IDs por selects buscables (almacén, producto).
- Alimentar `AdjustInventoryModal` con catálogo real de productos.
- Validar origen/destino distintos en transferencia desde UI antes de ejecutar.

---

## Fase B — Integridad de datos y ciclo completo (P1, semana 2)

### B1. Productos round-trip completo
- En edición, cargar y guardar consistentemente `price_list`, `price`, `cost` y barcode primario.
- Pasar eliminación de producto a command/usecase con auditoría uniforme.
- Prevalidar duplicados SKU/barcode en tiempo real.

### B2. Compras con ciclo de negocio completo
- Añadir estados: `draft -> confirmed -> partial -> received -> cancelled` con transiciones explícitas.
- Validaciones schema para renglones (qty>0, costo>=0, tax_rate>=0).
- Recepción con motivos de incidencia (faltante/daño/sobrante) y notas estructuradas.

### B3. Proveedores robustos
- Centralizar validación con schema (UI + usecase).
- Implementar baja lógica (`is_active=false`) y bloqueo de eliminación cuando hay compras asociadas.
- Agregar campos operativos mínimos: condición de pago, días de crédito, estatus comercial.

---

## Fase C — Cierre de calidad para prueba física (P2, semana 3)

### C1. Suite de pruebas E2E por flujo crítico
- Dashboard carga KPIs reales.
- POS venta completa con pago mixto y validación de cambio.
- Inventario ajuste + transferencia + kardex reflejado.
- Producto alta/edición/eliminación lógica.
- Compra creación + recepción parcial + recepción final.
- Proveedor alta + edición + baja lógica.

### C2. Checklists de prueba física en tienda
- Definir guías paso a paso por rol: cajero, almacenista, compras, administrador.
- Incluye casos felices y casos de error recuperable.

### C3. Métricas de aceptación (Definition of Done operativa)
- 0 bloqueos P0 en 3 días de prueba.
- 100% de casos críticos ejecutados al menos 2 veces sin pérdida de datos.
- Conciliación diaria: ventas vs pagos vs stock sin diferencias.

---

## 4) Plan de ejecución técnica detallada

1. **Congelar contratos de datos por pantalla** (queries/commands, shape de respuesta y errores).
2. **Refactor UI para usar capa application de forma consistente** (evitar services directos en páginas para acciones críticas).
3. **Homologar validaciones** (schema único compartido entre UI/usecase).
4. **Agregar trazabilidad funcional** (folio visible, estado de transacción, bitácora de acciones por módulo).
5. **Automatizar regresión mínima** (smoke + E2E de flujo principal por módulo).
6. **Ejecutar piloto físico controlado** (1 sucursal, 1 semana, seguimiento diario).

---

## 5) Matriz de pruebas físicas recomendada

## 5.1 Dashboard
- Abrir día con transacciones en cero y confirmar actualización tras primera venta.
- Validar que al recibir mercancía y crear productos se reflejen conteos.

## 5.2 POS
- Venta con efectivo exacto.
- Venta con efectivo mayor (validar cambio).
- Venta con pago mixto.
- Intento de venta con stock insuficiente.
- Recuperación de venta tras recarga del navegador.

## 5.3 Inventario
- Ajuste positivo y negativo (sin permitir stock negativo).
- Transferencia entre almacenes y validación en kardex.
- Conteo físico con diferencias y ajuste resultante.

## 5.4 Productos
- Alta con SKU/barcode/price/cost.
- Edición completa y verificación en POS.
- Baja lógica y confirmación de no selección en compras/POS.

## 5.5 Compras
- Crear compra en borrador, confirmar, recibir parcial, recibir total.
- Registrar incidencia por faltante/daño.
- Confirmar impacto en stock y costo.

## 5.6 Proveedores
- Alta con datos fiscales válidos.
- Edición de condición comercial.
- Intento de baja con compras históricas (debe prevenir o guiar).

---

## 6) Resultado esperado al finalizar plan

Al cerrar las fases A/B/C, las seis pantallas principales quedarán:
- operables por usuario de negocio en entorno físico,
- con trazabilidad de acciones críticas,
- con validaciones homogéneas,
- y con suite mínima de regresión para sostener cambios futuros sin romper operación.
