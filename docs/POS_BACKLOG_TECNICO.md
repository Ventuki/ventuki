# POS, backlog técnico de corrección

## Objetivo
Cerrar el flujo de venta base para que sea rápido, entendible y consistente con operación real.

---

# Estado actual detectado

## Lo que ya existe
- búsqueda de productos,
- agregado al carrito,
- validación básica de stock,
- cliente opcional,
- multipago,
- cálculo de cambio,
- creación de venta vía RPC,
- integración de contexto empresa/sucursal/almacén.

## Limitantes actuales
- no hay bloqueo explícito por caja abierta,
- faltan señales de operación crítica antes de cobrar,
- el carrito todavía es limitado para operación real,
- la experiencia de cobro sigue siendo más formulario que estación de caja,
- la pantalla no comunica lo suficiente cuando falta contexto operativo.

---

# Archivos impactados
- `src/features/pos/pages/POSPage.tsx`
- `src/features/pos/components/POSCatalog.tsx`
- `src/features/pos/components/POSCart.tsx`
- `src/features/pos/hooks/usePOSCart.ts`
- hooks relacionados de búsqueda, pago y venta.

---

# Trabajo técnico por archivo

## 1. `POSPage.tsx`

### Cambios a preparar
- [ ] agregar estado visible del circuito operativo.
- [ ] mostrar aviso si falta caja abierta o contexto crítico.
- [ ] revisar atajos de teclado y compatibilidad con bloqueos operativos.

### Criterio de aceptación
La pantalla principal del POS debe comunicar si está lista para vender o qué falta.

---

## 2. `POSCatalog.tsx`

### Cambios a preparar
- [ ] validar si el flujo de búsqueda es suficientemente rápido y claro.
- [ ] revisar estado vacío, sin resultados y sin stock.
- [ ] revisar si las columnas actuales son las correctas para mostrador.
- [ ] revisar comportamiento al agregar repetidamente el mismo producto.

### Criterio de aceptación
Buscar y agregar productos debe sentirse inmediato y obvio.

---

## 3. `POSCart.tsx`

### Cambios a preparar
- [ ] revisar si el carrito necesita edición de cantidad o controles adicionales.
- [ ] mejorar jerarquía del bloque de pagos.
- [ ] revisar si el botón cobrar expresa correctamente el estado operativo.
- [ ] revisar comunicación de insuficiencia de pago.
- [ ] revisar manejo de cliente y referencia de pago.

### Criterio de aceptación
El carrito debe dejar claro qué se cobra, qué falta y si el ticket es válido para cerrar.

---

## 4. `usePOSCart.ts`

### Cambios a preparar
- [ ] integrar verificación explícita de caja abierta.
- [ ] revisar inicialización de métodos de pago y dependencias.
- [ ] revisar degradación cuando falta almacén o contexto.
- [ ] revisar si el reseteo por cambio de tenant es suficiente.
- [ ] revisar separación entre validaciones operativas y UI.

### Criterio de aceptación
El hook debe proteger el flujo de venta contra estados incoherentes.

---

# Dependencias críticas

## Caja
- validar sesión abierta antes de cobrar.

## Contexto
- empresa,
- sucursal,
- almacén,
- métodos de pago activos.

## Inventario
- stock suficiente,
- consistencia de reservación/salida al vender.

---

# Resultado esperado de este frente

Dejar definido el circuito de venta base y listo para endurecimiento técnico en Sprint 1.
