# Sprint 0, ejecución en orden

## Objetivo

Arrancar la ejecución real del Sprint 0 siguiendo el orden acordado, para convertir el análisis en trabajo operativo y técnico accionable.

## Orden activo

1. Dashboard
2. Caja
3. POS
4. Selección de empresa / Onboarding
5. QA del circuito base

---

# Frente 1, Dashboard

## Objetivo del frente
Definir el dashboard como centro operativo y no solo como vista ejecutiva.

## Trabajo inmediato
- revisar KPIs actuales vs necesidad operativa,
- identificar bloques que sobran o distraen,
- definir bloques críticos del día,
- definir navegación rápida hacia acciones operativas.

## Entregables
- especificación de dashboard operativo mínimo,
- backlog de cambios por componente,
- lista de widgets a conservar, mover o reemplazar.

## Preguntas que debe resolver
- ¿está lista la sucursal para operar?
- ¿hay caja abierta?
- ¿qué pendientes requieren atención hoy?
- ¿qué alertas afectan la venta o el abastecimiento?

---

# Frente 2, Caja

## Objetivo del frente
Definir el comportamiento operativo correcto de apertura, sesión activa y cierre.

## Trabajo inmediato
- revisar información visible al abrir/cerrar,
- definir precondiciones y bloqueos,
- definir datos mínimos de una sesión activa,
- definir qué debe verse al momento de cerrar caja.

## Entregables
- especificación operativa de caja,
- lista de validaciones visibles necesarias,
- backlog técnico de mejoras por pantalla y caso de uso.

## Preguntas que debe resolver
- ¿qué contexto necesita el cajero para abrir caja?
- ¿qué debe impedir operar si la caja no está lista?
- ¿cómo sabe el usuario qué sesión está activa y cómo cerrarla correctamente?

---

# Frente 3, POS

## Objetivo del frente
Definir el flujo base de venta rápida como recorrido principal del sistema.

## Trabajo inmediato
- revisar velocidad y claridad de búsqueda,
- revisar flujo de agregado al carrito,
- revisar cobro simple y multipago,
- revisar dependencias operativas como caja y métodos de pago,
- identificar operaciones faltantes o ambiguas.

## Entregables
- flujo base de venta definido,
- backlog de mejoras por componente,
- lista de bloqueos funcionales del circuito de venta.

## Preguntas que debe resolver
- ¿puede un usuario vender sin adivinar el siguiente paso?
- ¿qué pasa si intenta cobrar sin caja abierta?
- ¿qué feedback recibe si falta stock o contexto?

---

# Frente 4, Selección de empresa y Onboarding

## Objetivo del frente
Cerrar el arranque contextual del sistema antes de operación.

## Trabajo inmediato
- revisar persistencia de contexto empresa/sucursal,
- definir salida ideal del onboarding,
- documentar el paso operativo posterior a crear empresa.

## Entregables
- criterio de contexto mínimo listo para operar,
- definición de salida correcta de onboarding,
- backlog técnico residual para integración con circuito base.

---

# Frente 5, QA del circuito base

## Objetivo del frente
Definir y ejecutar el primer recorrido de validación end-to-end.

## Escenarios prioritarios
1. login → empresa/sucursal → dashboard
2. abrir caja
3. vender en POS
4. cerrar caja
5. validar lectura mínima de dashboard

## Entregables
- checklist QA del circuito base,
- lista de bloqueos reales,
- evidencia de puntos ambiguos o rotos.

---

# Criterio de avance de Sprint 0

Sprint 0 avanza correctamente si deja:
- flujo operativo base explícito,
- dependencias entre pantallas claramente definidas,
- backlog técnico real por archivo/componente,
- y una lista de bloqueos que pueda atacar Sprint 1.

---

# Siguiente paso inmediato

Aterrizar cada frente en backlog técnico de implementación real, empezando por:
1. Dashboard
2. Caja
3. POS
