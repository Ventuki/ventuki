# Auditoria operativa por pantallas

Fecha: 2026-05-04  
Criterio: balanceado (operacion + UX + datos)

## Matriz de hallazgos (S0-S3)

| Modulo | Hallazgo | Severidad | Impacto | Accion recomendada |
|---|---|---:|---|---|
| Auth/Contexto | Flujo sin sucursal puede redirigir en bucle entre seleccion y ruta protegida | S1 | Bloqueo de entrada operativa | Forzar onboarding/sucursal obligatoria antes de navegar a rutas protegidas |
| Apartados | Formulario exige `branch_id` pero no se ve selector explicito en UI | S1 | Imposibilidad de crear apartados en escenarios reales | Inyectar branch por sesion o agregar selector obligatorio visible |
| Facturacion | UI en placeholder no refleja backend disponible | S2 | Funcionalidad percibida incompleta | Conectar flujos minimos de emitir/cancelar y consultar pendientes |
| POS/Caja | Dependencia fuerte de caja activa con manejo parcial de errores | S2 | Friccion en venta y riesgo de soporte | Establecer guardas previas centralizadas y mensajes accionables |
| Inventario/Compras | Uso mixto de servicios directos y repositorios con contratos distintos | S2 | Deuda tecnica y mantenimiento costoso | Normalizar capa de acceso a datos por dominio |
| Reportes | Dependencia RPC sin fallback funcional | S3 | Riesgo de reporte vacio o error opaco | Agregar manejo de degradacion y logging de falla |

## Auditoria por pantalla (proceso, gaps y mejora)

### 1. Login/Register/Forgot/Reset
- Proceso: autenticacion y recuperacion estandar con Supabase Auth.
- Gap: faltan estados UX uniformes para errores recurrentes (credenciales, expirada, recovery).
- Mejora: catalogo unico de errores de autenticacion y componentes de feedback reutilizables.

### 2. Select Company / Onboarding
- Proceso: seleccion tenant/sucursal y creacion inicial de estructura.
- Gap critico: manejo de empresa sin sucursal no cierra el circuito con precondiciones de `ProtectedRoute`.
- Mejora: contrato unico de contexto operativo (company + branch + warehouse opcional) antes de home.

### 3. Dashboard
- Proceso: consume KPIs y estado de caja para decision operativa.
- Gap: errores de datos no siempre tienen accion sugerida desde UI.
- Mejora: panel de incidentes operativos con CTA directo (abrir caja, crear sucursal, etc).

### 4. Productos
- Proceso: CRUD catalogo maestro comercial.
- Gap: validaciones y mensajes en conflictos de SKU/barcode no estan homologados.
- Mejora: estandarizar feedback y reglas de colision en capa de dominio.

### 5. Inventario
- Proceso: consulta/ajuste/transferencia/conteo/reabasto.
- Gap: alta complejidad en una sola pantalla y estados transitorios dispersos.
- Mejora: separar por subflujos (existencias, ajustes, transferencias, conteos) y preservar contexto de filtros.

### 6. Compras
- Proceso: ciclo draft -> confirmacion -> recepcion.
- Gap: friccion en reintentos y recuperacion de errores de recepcion parcial.
- Mejora: asegurar idempotencia de recepcion y bitacora de intentos por orden.

### 7. POS
- Proceso: carrito, validacion checkout, cierre de venta.
- Gap: dependencia de precondiciones externas (caja, metodos de pago, almacen) con mensajes no siempre guiados.
- Mejora: checklist de readiness antes de cobro y bloqueo preventivo con instrucciones.

### 8. Caja
- Proceso: apertura/cierre/arqueo.
- Gap: reconciliacion de diferencias y trazabilidad de movimientos puede ser insuficiente para auditoria.
- Mejora: detalle transaccional consolidado y reporte de variaciones por metodo.

### 9. Clientes/Proveedores
- Proceso: alta/edicion/listado maestros.
- Gap: reglas de limpieza y deduplicacion no estandarizadas.
- Mejora: validacion compartida y deteccion de duplicados por heuristica.

### 10. Apartados
- Proceso: apertura, pagos parciales, renovacion/cancelacion.
- Gap critico: dependencia en RPC y stock reservado sin visibilidad suficiente para operadores.
- Mejora: timeline operacional del apartado y estado de reserva por item.

### 11. Reportes
- Proceso: consulta por rango y export CSV.
- Gap: no siempre se comunica estado de consistencia de origen de datos.
- Mejora: incluir metadata del reporte (fuente, hora, filtros efectivos).

### 12. Facturacion
- Proceso: no operativo end-to-end desde UI actual.
- Gap: desfase entre expectativa de menu y capacidad real.
- Mejora: milestone minimo viable de facturacion con trazabilidad de errores SAT/provider.

## Quick wins (1-2 sprints)

1. Cerrar inconsistencia de precondiciones en acceso protegido.
2. Corregir flujo de alta de apartados para `branch_id`.
3. Activar checklist de readiness en POS/caja.
4. Publicar estado funcional real de facturacion y ruta de activacion.
5. Normalizar manejo de errores (auth, RPC, edge functions) en un helper transversal.
