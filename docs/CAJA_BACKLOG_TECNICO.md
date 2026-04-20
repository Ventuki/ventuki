# Caja, backlog técnico de corrección

## Objetivo
Convertir la pantalla de caja en un módulo operativo confiable, no solo en un formulario de apertura/cierre.

---

# Estado actual detectado

## Lo que ya existe
- apertura con fondo inicial,
- cierre con arqueo por efectivo, tarjeta y transferencia,
- notas de cierre,
- integración con casos de uso,
- repositorio con detección de sesión activa y cálculo de diferencia al cerrar.

## Limitantes actuales
- la pantalla no carga una sesión activa al entrar,
- `sessionId` vive solo en estado local,
- el usuario puede perder contexto al refrescar,
- no se muestra resumen de la sesión activa,
- no hay visibilidad suficiente del esperado vs contado,
- no hay historial mínimo,
- no está explicitado cómo POS depende de caja.

---

# Archivos impactados
- `src/features/cash-register/pages/CashRegisterPage.tsx`
- `src/features/cash-register/infrastructure/cash.repository.ts`
- `src/features/cash-register/application/openSession.usecase.ts`
- `src/features/cash-register/application/closeSession.usecase.ts`

---

# Trabajo técnico por archivo

## 1. `CashRegisterPage.tsx`

### Cambios a preparar
- [ ] cargar sesión activa al montar la pantalla.
- [ ] dejar de depender solo de estado local para `sessionId`.
- [ ] mostrar resumen de sesión activa:
  - id,
  - usuario,
  - apertura,
  - fondo inicial,
  - sucursal.
- [ ] mostrar expected vs counted al cierre si ya existe soporte en backend o repositorio.
- [ ] mejorar mensajes de error y contexto.
- [ ] preparar estados visuales más claros: sin caja, caja abierta, cierre en proceso.

### Criterio de aceptación
El usuario debe poder entrar a caja y entender de inmediato si ya hay sesión activa y qué puede hacer.

---

## 2. `cash.repository.ts`

### Cambios a preparar
- [ ] usar `getActiveSession` como base real del estado de caja visible.
- [ ] revisar si falta método para consultar resumen de sesión actual.
- [ ] revisar si el cierre puede devolver detalle suficiente para UI.

### Criterio de aceptación
El repositorio debe soportar una UI de caja con contexto persistente.

---

## 3. Casos de uso de apertura/cierre

### Cambios a preparar
- [ ] revisar si devuelven suficiente información para hidratar la pantalla.
- [ ] revisar manejo de errores de negocio vs errores técnicos.
- [ ] validar si ya protegen doble apertura o cierre inválido.

### Criterio de aceptación
La capa de aplicación debe dejar clara la regla de operación de caja.

---

# Dependencia crítica con POS

## A validar y cerrar
- el POS debe saber si hay caja abierta,
- vender sin caja abierta debe bloquearse o guiarse explícitamente,
- dashboard debe poder reflejar estado de caja.

---

# Resultado esperado de este frente

Dejar caja lista para integrarse como pieza central del circuito operativo base.
