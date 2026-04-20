# Backlog técnico ejecutable, Sprint 0 + Sprint 1

## Objetivo general

Bajar el análisis del PoS SaaS a trabajo técnico concreto para cerrar:
- definición operativa del sistema,
- circuito mínimo de operación base,
- y preparación para corrección de flujos críticos.

---

# Sprint 0, alineación operativa

## Meta
Definir cómo debe funcionar el sistema en operación real antes de seguir corrigiendo o construyendo.

## Entregable principal
Un recorrido piloto explícito y criterios de aceptación por pantalla núcleo.

---

## Pantalla, Login (`/auth/login`)

### Tareas
- [ ] Revisar todos los estados de error visibles y clasificarlos.
- [ ] Diferenciar mensajes para: credenciales inválidas, cuenta no confirmada, error temporal y usuario sin acceso operativo.
- [ ] Validar si el flujo de éxito siempre lleva a selección de empresa.
- [ ] Definir comportamiento esperado si el usuario solo tiene una empresa y una sucursal.

### Resultado esperado
Pantalla de acceso clara, sin mensajes ambiguos para usuario operativo.

---

## Pantalla, Registro (`/auth/register`)

### Tareas
- [ ] Definir mensaje de continuidad post-registro.
- [ ] Alinear el copy con el onboarding real del sistema.
- [ ] Revisar si el usuario entiende claramente el siguiente paso después del correo de confirmación.

### Resultado esperado
Registro alineado con el flujo real de alta de negocio.

---

## Pantalla, Recuperación y reset (`/auth/forgot-password`, `/reset-password`)

### Tareas
- [ ] Revisar consistencia de mensajes, estados de éxito y error.
- [ ] Documentar comportamiento esperado para enlaces expirados o inválidos.

### Resultado esperado
Flujo de recuperación consistente y sin ambigüedad operativa.

---

## Pantalla, Selección de empresa (`/auth/select-company`)

### Tareas
- [ ] Documentar flujo ideal para usuario con 0, 1 o múltiples empresas.
- [ ] Documentar flujo ideal para usuario con 0, 1 o múltiples sucursales.
- [ ] Revisar si falta contexto visible: rol, empresa activa, sucursal seleccionada.
- [ ] Definir comportamiento cuando una empresa no tiene sucursales operativas.

### Resultado esperado
Pantalla de contexto multiempresa/multisucursal claramente definida.

---

## Pantalla, Onboarding (`/onboarding`)

### Tareas
- [ ] Documentar qué deja listo el onboarding y qué no deja listo.
- [ ] Definir recorrido inmediatamente posterior al onboarding.
- [ ] Diseñar checklist de arranque post-onboarding:
  - crear catálogos mínimos,
  - cargar productos,
  - cargar stock,
  - abrir caja,
  - primera venta.
- [ ] Definir si el sistema debe llevar al usuario a dashboard, configuración o flujo guiado de arranque.

### Resultado esperado
Onboarding conectado con operación real, no solo con estructura de datos.

---

## Pantalla, Dashboard (`/`)

### Tareas
- [ ] Definir qué información necesita el sistema mostrar como centro operativo.
- [ ] Priorizar bloques: caja, ventas del día, alertas de stock, compras pendientes, apartados vencidos.
- [ ] Identificar qué widgets actuales sí sirven y cuáles son más decorativos que operativos.
- [ ] Diseñar criterio de estado operativo global: listo para vender / requiere atención.

### Resultado esperado
Especificación funcional del dashboard operativo mínimo.

---

## Pantalla, Caja (`/cash-register`)

### Tareas
- [ ] Definir flujo oficial de apertura y cierre.
- [ ] Documentar precondiciones para abrir caja.
- [ ] Documentar bloqueo esperado para vender sin caja.
- [ ] Definir datos mínimos que deben verse en caja activa.
- [ ] Definir información requerida al cierre y tratamiento de diferencias.

### Resultado esperado
Reglas operativas claras para caja antes de tocar implementación.

---

## Pantalla, POS (`/pos`)

### Tareas
- [ ] Definir flujo ideal de venta rápida.
- [ ] Definir precondiciones: caja abierta, sucursal válida, métodos de pago activos.
- [ ] Documentar recorrido de una venta de contado simple.
- [ ] Documentar recorrido de una venta multipago.
- [ ] Documentar recorrido de venta con cliente.
- [ ] Identificar operaciones faltantes o ambiguas en carrito y cobro.

### Resultado esperado
Especificación del flujo de venta base que Sprint 1 debe cerrar.

---

## Pantallas, Productos / Inventario / Compras / Apartados / Reportes

### Tareas
- [ ] Definir si entran como obligatorias o de soporte para piloto.
- [ ] Aterrizar su papel exacto dentro del recorrido operativo.
- [ ] Documentar dependencias cruzadas.

### Resultado esperado
Mapa claro de qué módulos son críticos en el piloto y cuáles quedan en segundo plano.

---

# Sprint 1, circuito mínimo de operación base

## Meta
Cerrar el flujo mínimo para que el negocio pueda operar una venta con control básico.

## Flujo objetivo
1. login,
2. selección empresa/sucursal,
3. apertura de caja,
4. venta en POS,
5. cobro,
6. registro correcto,
7. visibilidad básica en dashboard,
8. cierre de caja.

---

## Pantalla, Dashboard (`/`)

### Tareas técnicas
- [ ] Reordenar prioridades visuales hacia operación del día.
- [ ] Agregar o planear bloque de estado de caja.
- [ ] Agregar o planear bloque de pendientes operativos.
- [ ] Reducir peso de widgets menos útiles para arranque.
- [ ] Definir navegación rápida desde dashboard a POS, caja e inventario.

### Criterios de aceptación
- El dashboard permite entender si el negocio está listo para operar.
- El usuario puede detectar rápido pendientes importantes.

---

## Pantalla, Caja (`/cash-register`)

### Tareas técnicas
- [ ] Revisar si la pantalla muestra suficiente contexto de sesión.
- [ ] Agregar o planear resumen de caja activa.
- [ ] Validar protección contra flujos inválidos.
- [ ] Definir manejo visible de errores al abrir/cerrar.
- [ ] Diseñar historial mínimo o bloque de contexto para arqueo.

### Criterios de aceptación
- Abrir caja no deja dudas.
- Cerrar caja no se siente como formulario ciego.
- El estado de caja puede usarse por otros módulos.

---

## Pantalla, POS (`/pos`)

### Tareas técnicas
- [ ] Revisar el flujo de búsqueda para velocidad real de mostrador.
- [ ] Validar foco, teclado y continuidad operativa.
- [ ] Revisar comportamiento cuando no hay productos o no hay stock.
- [ ] Revisar edición operativa del carrito.
- [ ] Revisar señalización de total, pagos, cambio y suficiencia.
- [ ] Validar bloqueo o guía si falta caja abierta.
- [ ] Validar bloqueo o guía si faltan métodos de pago.
- [ ] Revisar claridad del flujo de cobro con multipago.
- [ ] Revisar experiencia con cliente opcional.

### Criterios de aceptación
- El usuario puede vender sin adivinar pasos.
- El flujo se siente rápido y con señales claras.
- El cobro no permite estados incoherentes.

---

## Componente, POS catálogo

### Tareas técnicas
- [ ] Evaluar si la tabla actual soporta lectura rápida en mostrador.
- [ ] Revisar columnas necesarias vs ruido.
- [ ] Validar UX de búsqueda por SKU, nombre y barcode.
- [ ] Revisar respuesta al agregar producto repetido.

### Criterios de aceptación
- Búsqueda y agregado se sienten veloces y obvios.

---

## Componente, POS carrito

### Tareas técnicas
- [ ] Revisar si faltan acciones de línea relevantes.
- [ ] Ver si la eliminación actual es suficiente o demasiado limitada.
- [ ] Revisar espacio y jerarquía de bloque de pagos.
- [ ] Revisar si el botón cobrar expresa bien el estado real.

### Criterios de aceptación
- El carrito comunica claramente qué se está cobrando y qué falta para cerrar.

---

## Pantalla, Selección de empresa (`/auth/select-company`)

### Tareas técnicas
- [ ] Revisar transición limpia hacia dashboard o flujo operativo.
- [ ] Asegurar persistencia correcta de contexto empresa/sucursal.
- [ ] Validar que el contexto quede listo para caja y POS.

### Criterios de aceptación
- El usuario entra a operar con contexto correcto y visible.

---

## Pantalla, Onboarding (`/onboarding`)

### Tareas técnicas
- [ ] Preparar salida operativa post-onboarding.
- [ ] Definir si requiere paso guiado adicional antes de vender.
- [ ] Alinear onboarding con Sprint 1 aunque no se implemente completo aún.

### Criterios de aceptación
- El onboarding no deja al usuario perdido tras crear su negocio.

---

## Pantalla, Productos (`/products`)

### Tareas técnicas
- [ ] Revisar alta mínima necesaria para vender en Sprint 1.
- [ ] Confirmar campos obligatorios reales para operación.
- [ ] Revisar default de almacén y stock inicial.
- [ ] Revisar si el listado necesita datos operativos mínimos para soporte al POS.

### Criterios de aceptación
- Crear productos para vender no requiere fricción innecesaria.

---

## Pantalla, Inventario (`/inventory`)

### Tareas técnicas
- [ ] Validar si el inventario ya soporta bien consulta básica para Sprint 1.
- [ ] Identificar qué acciones deben quedarse fuera del foco del primer circuito.
- [ ] Confirmar cómo impacta la venta sobre stock visible.

### Criterios de aceptación
- El módulo sirve como respaldo operativo del circuito base sin confundir al usuario.

---

## Pantalla, Reportes (`/reports`)

### Tareas técnicas
- [ ] Definir reporte mínimo útil para cierre diario.
- [ ] Revisar si la pantalla actual sirve como soporte de Sprint 1 o solo como placeholder técnico.

### Criterios de aceptación
- Existe al menos una lectura mínima de resultado diario útil.

---

# Escenarios QA obligatorios para Sprint 0 + 1

## Escenario 1, acceso y contexto
- [ ] usuario entra,
- [ ] selecciona empresa,
- [ ] selecciona sucursal,
- [ ] llega al sistema con contexto correcto.

## Escenario 2, apertura y venta simple
- [ ] abrir caja,
- [ ] buscar producto,
- [ ] agregar al carrito,
- [ ] cobrar en efectivo,
- [ ] verificar cierre correcto de venta.

## Escenario 3, venta multipago
- [ ] agregar productos,
- [ ] pagar con dos métodos,
- [ ] validar total y cambio,
- [ ] validar consistencia final.

## Escenario 4, cierre de caja
- [ ] cerrar caja,
- [ ] capturar montos,
- [ ] revisar resultado visible.

## Escenario 5, señal operativa en dashboard
- [ ] verificar si el dashboard refleja el estado del día de forma útil.

---

# Criterio de salida de Sprint 0 + 1

Se considera listo para avanzar cuando:
- el flujo operativo maestro quede explícito,
- el circuito login → contexto → caja → POS → cierre esté definido o corregido,
- exista backlog residual claro para Sprint 2,
- y el sistema esté más cerca de una operación piloto real.
