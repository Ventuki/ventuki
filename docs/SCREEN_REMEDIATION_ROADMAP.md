# Screen remediation roadmap (live)

## Objetivo
Mantener un mapa vivo de pantallas, dependencias y prioridades de corrección, orientado a operación real y a mini-sprints incrementales.

## Estado actual
Este roadmap actualiza documentos previos (`INVENTARIO_PANTALLAS_2026-04-15.md`, `PLAN_REMEDIACION_PANTALLAS_PRINCIPALES_2026-04-07.md`) para reflejar que varias correcciones ya fueron ejecutadas en compras, inventario, apartados y caja.

## Pantallas núcleo por impacto

### P1, núcleo operativo directo
- `/pos` , Punto de Venta
- `/cash-register` , Caja
- `/inventory` , Inventario
- `/purchases` , Compras
- `/layaways` y `/layaways/:id` , Apartados
- `/products` , Productos

### P2, soporte operativo
- `/customers` , Clientes
- `/suppliers` , Proveedores
- `/reports` , Reportes
- `/settings` , Catálogos maestros
- `/` , Dashboard

### P3, periféricas o dejar al final
- `/invoicing` , Facturación 4.0 (dejar al final)
- auth/onboarding/recovery

## Dependencias principales

### Flujo comercial
Productos -> Inventario -> POS -> Caja -> Reportes

### Flujo de abastecimiento
Proveedores -> Compras -> Recepción -> Inventario -> Reposición

### Flujo de reserva
Clientes -> Apartados -> Inventario comprometido -> Caja

### Flujo maestro de configuración
Configuración -> Productos / Clientes / Proveedores / POS / Compras

## Criterio de corrección incremental
1. Priorizar pantallas que afectan stock, cobro o caja.
2. Corregir primero validación y semántica operativa.
3. Luego endurecer UX de formularios y recuperación de errores.
4. Después mejorar trazabilidad e historial visible.
5. Facturación 4.0 se mantiene al final.

## Avances ya realizados
- Compras separadas de recepción mediante draft real.
- Caja con cierre más completo (cash/card/transfer/notes).
- Ajustes de inventario con motivo obligatorio.
- Reposición por stock mínimo visible y conectada a compras.
- Apartados con anticipo mínimo, vencimiento visible, bloqueo de abonos vencidos y renovación operativa.
- Historial visible de renovaciones de apartados.
- Caducidad opcional por producto y captura obligatoria en recepción cuando aplica.

## Próximo enfoque recomendado

### Sprint de revisión y corrección de formularios críticos
1. POS: revisar cobro, cliente, pagos mixtos, post-venta.
2. Caja: revisar apertura/cierre y estados de sesión.
3. Productos: round-trip completo de edición y validaciones visibles.
4. Clientes/Proveedores: endurecer formularios y eliminación.
5. Reportes/Configuración: revisar errores UX y estados vacíos.

## Regla operativa vigente
Avanzar en mini-sprints pequeños, seguros e incrementales, aceptando la siguiente recomendación salvo riesgo alto, decisión ambigua o acción destructiva/externa.
