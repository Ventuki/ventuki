# Dashboard, backlog técnico de corrección

## Objetivo
Convertir el dashboard actual en un centro operativo mínimo para el negocio, en vez de una portada ejecutiva con KPIs aislados.

---

# Estado actual detectado

## Lo que ya existe
- métricas del día,
- conteo de transacciones,
- conteo de productos,
- conteo de clientes,
- gráfica de ventas del mes,
- avisos rápidos visuales,
- manejo básico de error y recarga.

## Limitantes actuales
- no muestra estado de caja,
- no muestra contexto operativo de sucursal listo/no listo,
- no muestra pendientes críticos,
- no muestra compras pendientes, apartados vencidos o alertas accionables reales,
- la gráfica ocupa demasiado peso frente a información más urgente,
- los avisos rápidos actuales son genéricos y poco conectados con operación.

---

# Archivos impactados

## UI principal
- `src/pages/Index.tsx`

## Hook principal
- `src/pages/hooks/useDashboardStats.ts`

## Servicios relacionados
- `src/features/dashboard/services/dashboardService.ts`
- potencial integración con caja y apartados si aún no existe hook directo.

## Contexto visual superior
- `src/components/layout/AppTopbar.tsx`

---

# Trabajo técnico por archivo

## 1. `src/pages/Index.tsx`

### Cambios a preparar
- [ ] redefinir la jerarquía del dashboard.
- [ ] reducir protagonismo de la gráfica mensual.
- [ ] reemplazar "Avisos rápidos" por un bloque de "Estado operativo".
- [ ] agregar bloque de accesos rápidos hacia POS, Caja e Inventario.
- [ ] agregar bloque de pendientes operativos.
- [ ] separar claramente información de decisión inmediata vs información histórica.

### Propuesta de estructura objetivo
1. encabezado con contexto de sucursal,
2. bloque de estado operativo,
3. tarjetas KPI esenciales del día,
4. pendientes operativos,
5. accesos rápidos,
6. gráfica histórica en segundo nivel.

### Criterio de aceptación
Al abrir el dashboard, el usuario debe entender en menos de 5 segundos:
- dónde está operando,
- si ya puede vender,
- qué requiere atención hoy.

---

## 2. `src/pages/hooks/useDashboardStats.ts`

### Cambios a preparar
- [ ] separar métricas operativas de métricas históricas.
- [ ] extender la respuesta del hook para incluir estado operativo.
- [ ] preparar shape de datos para:
  - caja abierta/cerrada,
  - alertas críticas,
  - pendientes operativos,
  - disponibilidad de contexto.
- [ ] mantener degradación segura si faltan tablas o fuentes.

### Nota técnica
Hoy el hook resuelve bien KPIs simples, pero no está diseñado para servir un dashboard operacional compuesto.

### Criterio de aceptación
El hook debe poder alimentar la vista sin obligar a meter lógica operativa dispersa en `Index.tsx`.

---

## 3. `src/features/dashboard/services/dashboardService.ts`

### Cambios a preparar
- [ ] revisar si este servicio será el punto canónico del dashboard o si se consolidará con el hook actual.
- [ ] evitar duplicidad entre `useDashboardStats` y `dashboardService`.
- [ ] decidir una sola capa responsable de datos para dashboard.

### Criterio de aceptación
Debe existir una fuente clara de verdad para los datos del dashboard.

---

## 4. `src/components/layout/AppTopbar.tsx`

### Cambios a preparar
- [ ] revisar si el topbar debe mostrar contexto operativo adicional.
- [ ] evaluar si conviene mostrar empresa, sucursal y rol con mayor claridad.
- [ ] evaluar si la búsqueda global actual es útil o solo placeholder.

### Criterio de aceptación
El encabezado debe reforzar contexto, no competir con el dashboard.

---

# Datos faltantes o a validar

## Estado de caja
- si existe sesión activa,
- quién la abrió,
- desde cuándo,
- si la sucursal puede vender.

## Pendientes operativos
- apartados vencidos,
- alertas de inventario,
- compras pendientes de recepción,
- falta de configuración crítica.

## Accesos rápidos
- ir a vender,
- abrir/cerrar caja,
- revisar inventario,
- revisar compras.

---

# Decisiones de producto a fijar en implementación

- qué significa exactamente "listo para operar",
- qué alertas son críticas vs informativas,
- qué se muestra primero a cajero vs manager,
- si el dashboard será común para todos o adaptado por rol.

---

# Resultado esperado de este frente

Dejar al dashboard listo para un refactor enfocado en operación real y conectado al circuito base del negocio.
