# QA, circuito base

## Objetivo
Validar el primer recorrido real del sistema con foco en operación mínima.

---

# Recorrido principal a probar

1. login,
2. selección de empresa,
3. selección de sucursal,
4. dashboard,
5. apertura de caja,
6. búsqueda y venta en POS,
7. cierre de caja,
8. lectura mínima de estado final.

---

# Estado actual del circuito base

## Cubierto ya por cambios aplicados
- Caja recupera sesión activa al recargar o reingresar.
- POS ya no permite cobrar si no existe caja activa validada.
- Dashboard ya comunica mejor si la sucursal está lista para operar.
- Selección de contexto y onboarding empujan mejor hacia caja y POS.

## Aún sensible o pendiente de validar
- Persistencia completa de contexto empresa/sucursal entre sesiones reales.
- Comportamiento cuando falta almacén operativo para POS.
- Flujo real de venta completa con datos válidos en Supabase.
- Coherencia final entre cierre de caja y resumen mostrado.
- Utilidad real del dashboard tras operar una jornada mínima.

---

# Checklist manual

## 1. Acceso
- [ ] El usuario puede iniciar sesión sin errores ambiguos.
- [ ] Si no hay contexto, se redirige correctamente a selección de empresa.
- [ ] El contexto empresa/sucursal queda persistido correctamente.

## 2. Dashboard
- [x] La pantalla carga sin error.
- [x] El usuario entiende en qué sucursal está operando.
- [x] El dashboard ayuda a decidir la siguiente acción.
- [ ] Refleja correctamente el estado después de operar una venta real.

## 3. Caja
- [x] Se puede identificar si hay sesión activa.
- [x] La pantalla deja claro el estado de caja y el arqueo esperado.
- [x] La sesión activa no se pierde visualmente al recargar o reingresar.
- [ ] Se puede abrir caja con datos reales válidos en entorno integrado.
- [ ] Se puede cerrar caja con resultados consistentes frente al resumen esperado.

## 4. POS
- [x] El sistema bloquea claramente la venta sin caja abierta.
- [x] La UI comunica cuando la caja no está lista.
- [ ] Se pueden buscar productos con contexto completo.
- [ ] Se pueden agregar al carrito.
- [ ] El total se calcula correctamente con datos reales.
- [ ] Se puede capturar al menos una línea de pago válida.
- [ ] La venta completa descuenta inventario y deja trazabilidad coherente.

## 5. Contexto / onboarding
- [x] La selección de empresa y sucursal da mejor continuidad operativa.
- [x] El onboarding ya orienta al siguiente paso operativo.
- [ ] Sigue pendiente definir si el onboarding simple será el definitivo o será sustituido por el más completo.

## 6. Cierre del circuito
- [ ] Se puede cerrar caja al terminar.
- [ ] Queda señal mínima del resultado del día.
- [ ] Dashboard y caja reflejan de forma consistente el estado final.

---

# Bloqueos a detectar explícitamente

- [x] venta sin caja abierta,
- [ ] falta de almacén,
- [ ] falta de sucursal,
- [ ] falta de métodos de pago,
- [x] pérdida de sesión de caja al recargar,
- [ ] onboarding que deja operación incompleta,
- [~] dashboard sin utilidad operativa (parcialmente corregido, falta validación integrada).

---

# Resultado esperado

Una lista real de fallas y ambigüedades del circuito base para atacar en Sprint 1 con cambios deliberados.

---

# Siguiente mini-sprint recomendado

## Validar precondiciones operativas del POS más allá de caja

Prioridad siguiente:
1. detectar y bloquear falta de almacén operativo,
2. detectar huecos de métodos de pago o configuración mínima,
3. dejar mensajes más explícitos cuando el POS no tenga contexto suficiente para vender.

Ese es el siguiente endurecimiento lógico del circuito base.
