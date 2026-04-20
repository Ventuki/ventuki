# Plan ejecutable, PoS SaaS

## Objetivo

Convertir el PoS SaaS actual en un sistema realmente usable para operación piloto, cerrando primero flujos críticos antes de agregar nuevas funcionalidades grandes.

## Regla de ejecución

- Sprints cortos.
- Cada sprint debe dejar un resultado visible y verificable.
- No abrir frentes nuevos si el flujo anterior sigue roto o ambiguo.
- Priorizar operación real sobre complejidad técnica bonita.

---

# Sprint 0, alineación operativa

> Backlog técnico detallado: `docs/BACKLOG_TECNICO_SPRINT_0_1.md`

## Meta
Dejar definido el recorrido operativo real que el sistema debe soportar de punta a punta.

## Entregables
- mapa de flujo maestro del negocio,
- definición del recorrido piloto,
- lista de bloqueos críticos actuales,
- criterios de aceptación por módulo núcleo.

## Alcance
- acceso y onboarding,
- selección de empresa/sucursal,
- dashboard,
- caja,
- POS,
- productos,
- inventario,
- compras,
- apartados,
- reportes básicos.

## Checklist
- [ ] Documentar flujo maestro del día operativo.
- [ ] Definir qué módulos son obligatorios para piloto.
- [ ] Definir qué módulos quedan fuera del primer uso real.
- [ ] Definir criterios de "listo para piloto".

## Resultado esperado
Saber exactamente qué hay que cerrar para empezar a operar sin improvisar.

---

# Sprint 1, circuito de operación base

## Meta
Cerrar el circuito mínimo para vender con control.

## Flujo objetivo
1. ingresar,
2. seleccionar empresa/sucursal,
3. abrir caja,
4. buscar producto,
5. vender,
6. cobrar,
7. registrar venta correctamente,
8. cerrar caja.

## Enfoque
- endurecer POS,
- endurecer caja,
- mejorar señales operativas del dashboard.

## Checklist
- [ ] Verificar bloqueo o guía clara si no hay caja abierta.
- [ ] Revisar flujo de búsqueda y alta velocidad en POS.
- [ ] Revisar carrito, cantidades, eliminación y cobro.
- [ ] Revisar multipago y validaciones.
- [ ] Revisar apertura/cierre de caja con contexto suficiente.
- [ ] Mejorar visibilidad de estado operativo en dashboard.

## Resultado esperado
Primer flujo real de venta usable con menor ambigüedad.

---

# Sprint 2, catálogo y stock confiables

## Meta
Hacer confiable la relación entre producto, stock y operación.

## Enfoque
- productos,
- inventario,
- catálogos maestros.

## Checklist
- [ ] Mejorar administración de productos para operación diaria.
- [ ] Revisar alta, edición y consulta de producto.
- [ ] Separar mejor consulta de stock vs acciones sensibles.
- [ ] Revisar ajustes, transferencias y conteo físico.
- [ ] Revisar protecciones en catálogos usados por transacciones.
- [ ] Validar visibilidad de alertas y reabasto.

## Resultado esperado
Base confiable para vender y controlar mercancía sin inconsistencias visibles.

---

# Sprint 3, compras y recepción sin ambigüedad

## Meta
Cerrar el flujo de abastecimiento con recepción operable.

## Flujo objetivo
1. crear compra,
2. confirmar,
3. recibir parcial o total,
4. registrar incidencias,
5. impactar inventario correctamente.

## Checklist
- [ ] Revisar estados de compra y transiciones visibles.
- [ ] Revisar UX de captura para recepción.
- [ ] Revisar incidencias y faltantes.
- [ ] Revisar control de caducidad/lote cuando aplica.
- [ ] Revisar integración con sugerencias de recompra.

## Resultado esperado
Ciclo de compra y entrada de mercancía claro y repetible.

---

# Sprint 4, clientes, proveedores y apartados integrados

## Meta
Volver más usable la operación comercial alrededor de la venta.

## Checklist
- [ ] Mejorar lectura operativa de clientes.
- [ ] Mejorar lectura operativa de proveedores.
- [ ] Integrar mejor apartados con dashboard y operación diaria.
- [ ] Revisar vencidos, renovaciones y mercancía comprometida.
- [ ] Revisar puntos de contacto entre POS, inventario y apartados.

## Resultado esperado
Operación comercial más completa, no solo venta aislada.

---

# Sprint 5, reporteo y control mínimo para piloto

## Meta
Tener visibilidad suficiente para operar y evaluar el piloto.

## Checklist
- [ ] Reforzar reportes básicos realmente útiles.
- [ ] Definir tablero operativo mínimo.
- [ ] Validar métricas clave para cierre diario.
- [ ] Confirmar qué información necesita dueño, cajero y supervisor.

## Resultado esperado
Capacidad de seguimiento básico del negocio sin depender del código o base de datos.

---

# Fuera de foco por ahora

No meter antes de cerrar lo anterior:
- facturación completa,
- devoluciones complejas,
- cuentas por cobrar/pagar completas,
- e-commerce,
- reportes avanzados,
- automatizaciones grandes,
- nuevas integraciones externas.

---

# Criterio de avance

Solo pasar al siguiente sprint cuando:
- el flujo actual esté claro,
- haya evidencia visible de mejora,
- los bloqueos principales estén documentados,
- y el sistema quede más usable, no solo más grande.
