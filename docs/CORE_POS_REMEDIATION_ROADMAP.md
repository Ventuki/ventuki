# Core POS remediation roadmap

## Objetivo
Convertir los hallazgos del auditor POS en un plan de corrección incremental, priorizado por riesgo operativo real, impacto en tienda y esfuerzo estimado.

Este roadmap cubre el núcleo operativo de Ventuki:
- compras
- inventario
- POS
- apartados
- caja

## Criterios de prioridad

### P1, riesgo operativo crítico
Problemas que pueden producir errores reales de operación, inventario, cobro o caja.

### P2, riesgo operativo alto o UX peligrosa
Problemas que no rompen todo, pero sí inducen errores humanos o mala interpretación del flujo.

### P3, mejora estructural y consolidación
Cambios de claridad, trazabilidad, consistencia y endurecimiento progresivo.

---

## P1, correcciones críticas

### 1. Separar compra vs recepción de mercancía
**Módulo:** Compras
**Problema:** la pantalla dice "draft", pero la creación actualiza stock.
**Riesgo:** muy alto.
**Acción:**
- usar un flujo de draft real para orden de compra
- reservar `createDirectPurchase` para compra con recepción inmediata, si se conserva
- separar en UI `Crear orden de compra` de `Registrar recepción`
**Esfuerzo:** medio a alto

### 2. Endurecer ajuste de inventario
**Módulo:** Inventario
**Problema:** ajuste libre demasiado genérico.
**Riesgo:** muy alto.
**Acción:**
- motivo obligatorio
- lenguaje menos técnico que `delta`
- advertencia visible cuando el flujo correcto sea compra, transferencia o conteo
**Esfuerzo:** medio

### 3. Política explícita de apartados
**Módulo:** Apartados
**Problema:** no están visibles reglas clave.
**Riesgo:** muy alto.
**Acción:**
- definir si hay anticipo mínimo obligatorio
- definir vencimiento operativo
- mostrar stock comprometido
- aclarar si el primer pago es obligatorio o no
**Esfuerzo:** medio

### 4. Cierre de caja completo
**Módulo:** Caja
**Problema:** la UI solo captura efectivo contado.
**Riesgo:** crítico.
**Acción:**
- capturar efectivo, tarjeta y transferencia
- mostrar esperado vs contado
- mostrar faltante/sobrante antes de confirmar
**Esfuerzo:** medio

### 5. POS con contexto operativo visible
**Módulo:** POS + Caja
**Problema:** el cajero no ve con claridad caja/sucursal/almacén operativos.
**Riesgo:** alto.
**Acción:**
- mostrar encabezado operativo con sucursal, almacén y estado de caja
- bloquear cobro si la política exige caja abierta
**Esfuerzo:** medio

---

## P2, correcciones de alto valor

### 6. Visibilidad de estados en compras
**Módulo:** Compras
**Acción:**
- badge de estado
- resumen pedido/recibido/pendiente
- acciones válidas según estado
- separar folio interno de factura proveedor
- recuperar fecha esperada como dato operativo
**Esfuerzo:** medio

### 7. Ayuda contextual del inventario
**Módulo:** Inventario
**Acción:**
- explicar cuándo usar ajuste, transferencia, recepción, conteo físico
- mostrar stock disponible antes de transferir
- conectar mejor conteo con kardex y resumen de impacto
**Esfuerzo:** medio

### 8. Mejor post-flujo de venta en POS
**Módulo:** POS
**Acción:**
- mostrar folio o resumen final
- ticket/comprobante visible
- mejor transición a facturación si aplica
- mejores mensajes de excepción y recuperación
**Esfuerzo:** medio

### 9. Detalle operacional de apartados
**Módulo:** Apartados
**Acción:**
- mostrar vencido / por vencer
- mostrar política de cancelación
- reflejar stock comprometido en detalle
- reforzar resumen de anticipo, pagado y pendiente
**Esfuerzo:** medio

### 10. Movimientos de caja en UI
**Módulo:** Caja
**Acción:**
- registrar ingresos, egresos, depósitos y retiros
- historial de sesión
- descripción obligatoria
- trazabilidad por usuario
**Esfuerzo:** medio

---

## P3, consolidación estructural

### 11. Lenguaje operativo uniforme entre módulos
**Acción:**
- unificar términos como ajuste, recepción, apartado, arqueo, cierre, compromiso de stock
**Esfuerzo:** bajo a medio

### 12. Reglas visibles de sobre/faltante y permisos
**Módulo:** Caja
**Acción:**
- límites
- notas obligatorias
- acciones por rol
**Esfuerzo:** medio

### 13. Guía de cliente opcional/obligatorio en POS
**Módulo:** POS
**Acción:**
- indicar cuándo conviene cliente
- facturación, historial, apartados o seguimiento
**Esfuerzo:** bajo

### 14. Documento funcional por flujo
**Acción:**
- documentar flujo correcto por módulo con precondiciones, pasos y resultados esperados
**Esfuerzo:** medio

---

## Orden sugerido de implementación

### Fase 1, Riesgo operativo inmediato
1. compra vs recepción
2. cierre de caja completo
3. política explícita de apartados
4. ajuste de inventario endurecido
5. contexto operativo visible en POS

### Fase 2, UX que evita errores humanos
6. estados claros en compras
7. ayuda contextual en inventario
8. cierre de venta más visible
9. detalle operacional de apartados
10. movimientos de caja en UI

### Fase 3, Consistencia y endurecimiento
11. lenguaje operativo uniforme
12. reglas de sobre/faltante y permisos
13. guía de uso de cliente en POS
14. documentación funcional por flujo

---

## Propuesta de ejecución por mini-sprints

### Mini-sprint 1
- corregir compra vs recepción
- ampliar cierre de caja

### Mini-sprint 2
- política de apartados
- endurecer ajuste de inventario

### Mini-sprint 3
- contexto operativo del POS
- post-flujo de venta
- conexión POS-caja

### Mini-sprint 4
- estados de compra
- ayudas contextuales inventario
- movimientos de caja UI

### Mini-sprint 5
- consolidación documental y lenguaje operativo

---

## Recomendación para el orquestador
El siguiente trabajo ya no debe arrancar por módulo aislado, sino por riesgo transversal. La mejor secuencia es:

1. corregir inconsistencias que alteran stock o caja
2. volver explícitas las reglas invisibles del negocio
3. mejorar el lenguaje y la señalización de los flujos
4. endurecer validaciones y trazabilidad

## Resultado esperado
Si este roadmap se ejecuta, Ventuki debería pasar de ser una app técnicamente prometedora a un sistema mucho más confiable para operación real de tienda, reduciendo errores de:
- stock
- recepción
- cobro
- cierre de caja
- apartados
- interpretación incorrecta del flujo por parte del usuario
