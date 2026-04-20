# Sprint 0, cierre

## Objetivo del sprint
Endurecer el circuito base del sistema para que deje de aparentar estar listo cuando todavía faltan precondiciones operativas mínimas, y convertir el dashboard/onboarding/caja/POS en una base más coherente para operación real.

## Secciones cerradas

### 1. Caja
- Recuperación de sesión activa al reingresar o recargar.
- Resumen esperado de sesión.
- Arqueo más claro por método de pago.
- Diferencia proyectada visible antes del cierre.

### 2. POS
- Bloqueo si no existe caja activa.
- Validación de almacén operativo.
- Validación de métodos de pago activos.
- Mejor comunicación visual de bloqueos operativos.
- Mejor consistencia en pagos mixtos y cálculo de cambio.

### 3. Dashboard
- Estado operativo visible.
- Relación más clara con caja y POS.
- Lectura de último cierre de caja cuando ya no hay sesión abierta.
- Accesos rápidos al circuito base.

### 4. Contexto y onboarding
- Mejor continuidad al seleccionar empresa y sucursal.
- Mejor salida del onboarding hacia operación.
- Unificación definitiva a un solo onboarding operativo.

### 5. QA base y documentación
- Checklist de QA del circuito base actualizado.
- Bitácora de cambios del endurecimiento realizada.
- Próximos pasos de Sprint 1 aterrizados.

## Resultado del sprint
Sprint 0 queda cerrado como fase de endurecimiento del circuito base.

La app ya permite validar físicamente una parte importante del flujo real:
- onboarding,
- contexto,
- dashboard,
- caja,
- POS.

## Lo que no se declara cerrado todavía
- Compras e inventario avanzado.
- Validación integral con datos reales en todos los módulos.
- Optimización de bundle/performance.
- Limpieza posterior de código descontinuado en `src/features/onboarding/`.
- Deuda técnica adicional fuera del circuito base.

## Salida hacia Sprint 1
Sprint 1 inicia con foco en:
1. validación integrada del circuito real,
2. endurecimiento de productos/inventario/compras,
3. QA funcional con datos reales,
4. reducción de deuda técnica visible.
