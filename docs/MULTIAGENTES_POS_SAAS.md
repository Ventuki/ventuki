# Esquema de multiagentes, PoS SaaS

## Objetivo

Dividir el trabajo del proyecto por frentes claros para acelerar desarrollo y corrección sin perder coordinación.

## Regla principal

Los agentes no deben abrir features nuevas por cuenta propia.
Su trabajo es cerrar flujos, detectar fricciones, proponer mejoras y ejecutar cambios acotados por sprint.

---

## Agente 1, Orquestador de producto

### Rol
- dueño del sprint,
- priorización,
- secuencia de trabajo,
- consolidación de hallazgos,
- definición de criterios de aceptación.

### Responsabilidades
- mantener el mapa de flujo maestro,
- decidir qué entra y qué no entra en cada sprint,
- consolidar findings de otros agentes,
- bajar todo a backlog accionable.

### Entregables
- plan del sprint,
- checklist de aceptación,
- resumen de riesgos,
- decisiones de producto/UX.

---

## Agente 2, Auditor de flujos UX

### Rol
Revisar cada pantalla como flujo de trabajo real, no solo como componente.

### Responsabilidades
- detectar fricciones de uso,
- detectar mezcla de acciones peligrosas,
- revisar consistencia entre pantallas,
- proponer mejoras de navegación, estados y feedback.

### Enfoque ideal
- POS,
- caja,
- compras,
- inventario,
- onboarding,
- dashboard.

### Entregables
- hallazgos por pantalla,
- lista de fricciones,
- mejoras priorizadas de UX operativa.

---

## Agente 3, Implementador frontend

### Rol
Ejecutar cambios de UI, estructura de pantallas y wiring de interacción.

### Responsabilidades
- refactor de pantallas,
- mejora de componentes,
- jerarquía visual,
- separación de vistas y acciones,
- endurecer señales y validaciones visibles.

### Restricción
No cambiar lógica de negocio profunda sin coordinación con agente de dominio.

---

## Agente 4, Guardián de dominio y reglas de negocio

### Rol
Cuidar que los cambios respeten operación retail real.

### Responsabilidades
- revisar estados y transiciones,
- validar reglas de caja,
- validar inventario,
- validar compras/recepción,
- validar apartados,
- identificar inconsistencias funcionales.

### Entregables
- observaciones de dominio,
- reglas faltantes,
- decisiones operativas que deben quedar explícitas.

---

## Agente 5, QA de flujo operativo

### Rol
Probar recorridos completos como usuario real.

### Responsabilidades
- ejecutar escenarios de punta a punta,
- detectar roturas reales,
- validar criterios de aceptación,
- registrar casos de prueba por sprint.

### Escenarios base
- onboarding,
- alta de producto,
- stock inicial,
- venta en POS,
- apertura/cierre de caja,
- compra y recepción,
- creación y seguimiento de apartado.

---

## Agente 6, Documentador técnico-operativo

### Rol
Convertir cambios en documentación útil para continuidad.

### Responsabilidades
- actualizar mapa de flujos,
- mantener backlog técnico y operativo,
- documentar decisiones,
- dejar listas de verificación de piloto,
- evitar pérdida de contexto entre sprints.

---

# Cómo trabajar por sprint

## Fase 1, análisis del sprint
- Orquestador define alcance.
- Auditor UX revisa pantallas implicadas.
- Guardián de dominio valida reglas del flujo.

## Fase 2, ejecución
- Implementador frontend realiza cambios acotados.
- Orquestador resuelve prioridades y tradeoffs.

## Fase 3, validación
- QA ejecuta recorrido real.
- Documentador deja evidencia y backlog residual.

---

# Recomendación práctica para arrancar ya

## Sprint 1
Activar estos agentes primero:
1. Orquestador de producto
2. Auditor de flujos UX
3. Guardián de dominio
4. Implementador frontend
5. QA de flujo operativo

## Documentador
Puede correr en paralelo o al cierre de cada mini-sprint.

---

# Secuencia recomendada de trabajo inmediato

1. mapear el sprint activo,
2. asignar flujo principal,
3. revisar pantallas involucradas,
4. ejecutar cambios acotados,
5. probar recorrido completo,
6. documentar hallazgos y siguiente sprint.

---

# Nota importante

Multiagentes sí, pero con un solo frente activo por sprint.
Si se abren demasiados frentes a la vez, el proyecto crecerá en complejidad más rápido que en usabilidad.
