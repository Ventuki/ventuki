# Plan de agentes para Ventuki

Este archivo define perfiles de agentes especializados para avanzar en paralelo sobre el proyecto, con entregables pequeños, acumulables y verificables.

## Regla de operación

Cada agente debe trabajar con cambios pequeños, verificables y orientados a integración continua. Ningún agente debe asumir cambios destructivos sin validación previa.

## Agente 1, Diseñador UI/UX

### Perfil
Especialista en experiencia de usuario, consistencia visual, legibilidad, accesibilidad básica y claridad de flujos.

### Objetivos
- Mejorar navegación y jerarquía visual
- Detectar pantallas confusas o sobrecargadas
- Proponer mejoras incrementales en dashboard, POS, inventario y apartados

### Tareas iniciales
- Auditar consistencia visual entre páginas principales
- Revisar formularios largos y estados vacíos
- Proponer checklist de mejoras visuales priorizadas
- Identificar componentes candidatos para estandarización

### Entregables
- documento de hallazgos UI
- backlog de mejoras por pantalla
- propuestas de micro-mejoras de usabilidad

## Agente 2, Seguridad

### Perfil
Especialista en higiene de secretos, exposición innecesaria, validación de inputs, permisos y riesgos de integración.

### Objetivos
- Revisar superficie de riesgo frontend + Supabase
- Confirmar manejo correcto de entorno
- Priorizar hallazgos por impacto

### Tareas iniciales
- Revisar variables de entorno y documentación segura
- Auditar llamadas a Supabase desde frontend
- Revisar riesgos de autorización y validación
- Verificar qué piezas requieren reglas RLS y endurecimiento

### Entregables
- checklist de riesgos
- hallazgos por severidad
- plan de remediación incremental

## Agente 3, QA Funcional

### Perfil
Especialista en pruebas manuales, smoke tests, regresión funcional y reproducibilidad de bugs.

### Objetivos
- Convertir módulos clave en flujos verificables
- Detectar huecos entre la intención del negocio y la app real

### Tareas iniciales
- Definir smoke tests por módulo crítico
- Crear matriz de prueba manual por flujo
- Verificar login, dashboard, POS, inventario, compras, facturación y apartados
- Documentar defectos con pasos de reproducción

### Entregables
- checklist funcional
- matriz de pruebas manuales
- backlog de bugs reproducibles

## Agente 4, Arquitectura Frontend

### Perfil
Especialista en React, TypeScript, estructura por features, deuda técnica y rendimiento del bundle.

### Objetivos
- Reducir complejidad accidental
- Mejorar modularidad
- Preparar el proyecto para crecimiento sostenible

### Tareas iniciales
- Auditar rutas y dependencias entre features
- Revisar oportunidades de lazy loading
- Detectar componentes y hooks con responsabilidad mezclada
- Proponer plan de refactor incremental

### Entregables
- mapa técnico por feature
- backlog de deuda técnica
- plan de performance y code splitting

## Agente 5, Datos y Supabase

### Perfil
Especialista en estructura de datos, contratos con Supabase, SQL, funciones y consistencia frontend-base de datos.

### Objetivos
- Asegurar que el frontend coincida con el modelo de datos real
- Reducir errores de integración

### Tareas iniciales
- Inventariar tablas, funciones y scripts SQL usados
- Revisar dependencias reales del frontend contra Supabase
- Detectar huecos de documentación del entorno
- Proponer flujo de staging/seed mínimo

### Entregables
- mapa de datos y dependencias
- checklist de integración Supabase
- plan de entorno mínimo reproducible

## Agente 6, Producto/Operaciones POS

### Perfil
Especialista en operación real de punto de venta, flujos de negocio, prioridades y validación práctica.

### Objetivos
- Aterrizar el proyecto a uso real
- Priorizar lo que más impacta una operación diaria

### Tareas iniciales
- Revisar flujo completo de venta
- Revisar inventario, compras, caja y apartados como operación conectada
- Detectar fricciones para usuario final
- Priorizar backlog según impacto en operación

### Entregables
- backlog priorizado por valor de negocio
- mapa de fricciones operativas
- propuesta de roadmap corto

## Secuencia sugerida de trabajo incremental

### Sprint A
- Agente 2 Seguridad
- Agente 3 QA Funcional
- Agente 4 Arquitectura Frontend

### Sprint B
- Agente 1 UI/UX
- Agente 5 Datos y Supabase

### Sprint C
- Agente 6 Producto/Operaciones POS
- Integración y priorización final

## Resultado esperado

Al trabajar con estos perfiles, Ventuki debe avanzar con un ciclo estable:

1. entender el riesgo
2. validar funcionamiento
3. ordenar arquitectura
4. mejorar experiencia
5. cerrar huecos de datos
6. priorizar según valor real
