# Changes Log, PoS SaaS

## 2026-04-20

### Caja

#### Cambios aplicados
- Se corrigió la pantalla de caja para que recupere la sesión activa al entrar de nuevo.
- Se dejó de depender únicamente del `sessionId` en estado local efímero.
- Se agregó carga de resumen de sesión usando el repositorio.
- Se agregó contexto visible de sesión activa:
  - apertura,
  - fondo inicial,
  - resumen esperado por método,
  - diferencia proyectada antes del cierre.
- Se añadió estado visual intermedio mientras se valida la caja activa.

#### Archivos tocados
- `src/features/cash-register/infrastructure/cash.repository.ts`
- `src/features/cash-register/pages/CashRegisterPage.tsx`

#### Impacto esperado
- Menor fragilidad al refrescar o reentrar a caja.
- Mejor visibilidad operativa para apertura/cierre.
- Base más sólida para integrar bloqueo del POS por caja activa.

#### Nota
No se hizo todavía cambio drástico de arquitectura ni cambio global del flujo de caja. Fue una corrección incremental y segura del circuito base.

### POS

#### Cambios aplicados
- Se agregó validación explícita de caja activa antes de cobrar.
- Se añadió verificación de sesión de caja dentro del hook principal del POS.
- Se muestra alerta visible en la pantalla cuando la caja no está lista.
- Se deshabilita el botón de cobro si la caja no está abierta o sigue validándose.
- Se ajustó el texto del botón de cobro para comunicar mejor el estado operativo.

#### Archivos tocados
- `src/features/pos/hooks/usePOSCart.ts`
- `src/features/pos/pages/POSPage.tsx`
- `src/features/pos/components/POSCart.tsx`

#### Impacto esperado
- El POS deja de comportarse como si estuviera listo para vender cuando no hay caja activa.
- Se reduce el riesgo de ventas incoherentes dentro del circuito base.
- Mejora la lectura operativa del estado del módulo.

#### Nota
Este cambio endurece el circuito base sin alterar todavía flujos más complejos como tickets suspendidos, descuentos o devoluciones.

### Dashboard

#### Cambios aplicados
- Se agregó estado operativo de caja al dashboard.
- El dashboard ahora detecta si existe sesión activa de caja para la sucursal actual.
- Se añadió un bloque de "Estado operativo" con lectura directa de si la sucursal puede cobrar.
- Se añadió un bloque de pendientes operativos más útil para el arranque diario.
- Se reemplazó el bloque genérico de avisos por accesos rápidos al circuito base.

#### Archivos tocados
- `src/pages/hooks/useDashboardStats.ts`
- `src/pages/Index.tsx`

#### Impacto esperado
- El dashboard deja de ser solo portada visual y se acerca más a tablero operativo.
- Mejora la lectura rápida del estado del negocio.
- Refuerza la relación entre dashboard, caja y POS.

#### Nota
Todavía no incorpora compras pendientes, apartados vencidos ni alertas operativas más profundas; este cambio se concentra en el circuito base.

### Contexto y onboarding

#### Cambios aplicados
- Se reforzó la continuidad operativa al seleccionar empresa y sucursal.
- Se añadieron mensajes de contexto más útiles al entrar sin sucursal operativa.
- El onboarding ahora sugiere explícitamente abrir caja y validar el POS al terminar.
- Se agregaron accesos directos a Caja y POS desde el menú de cuenta en el topbar.
- Se ajustó la referencia visual de sucursal vacía para que sea más operativa.

#### Archivos tocados
- `src/features/auth/pages/SelectCompanyPage.tsx`
- `src/features/auth/pages/OnboardingPage.tsx`
- `src/components/layout/AppTopbar.tsx`

#### Impacto esperado
- Menor fricción entre contexto, dashboard y operación real.
- Mejor salida del onboarding hacia el circuito base.
- Más claridad para usuarios que todavía no tienen una sucursal lista.

#### Nota
Sigue pendiente la decisión mayor sobre cuál onboarding debe consolidarse como versión definitiva.

### POS, precondiciones operativas

#### Cambios aplicados
- Se agregó validación explícita de almacén operativo antes de cobrar.
- Se agregó validación explícita de métodos de pago activos antes de cobrar.
- El POS ahora muestra alertas visibles cuando falta caja, almacén o configuración de pagos.
- El botón de cobro comunica mejor cuál precondición operativa falta.

#### Archivos tocados
- `src/features/pos/hooks/usePOSCart.ts`
- `src/features/pos/pages/POSPage.tsx`
- `src/features/pos/components/POSCart.tsx`

#### Impacto esperado
- Menos falsos positivos de "POS listo" cuando todavía falta configuración mínima.
- Mejor claridad operativa para destrabar ventas reales.
- Base más segura para QA integrada del circuito base.

### Dashboard, lectura de cierre de caja

#### Cambios aplicados
- El dashboard ahora consulta la última sesión de caja del usuario en la sucursal.
- Si no hay caja abierta pero sí hubo cierre reciente, se muestra una señal mínima del resultado.
- Se agregó visualización de diferencia final del último cierre.
- Se mejoró la sugerencia operativa cuando la última caja ya fue cerrada.

#### Archivos tocados
- `src/features/cash-register/infrastructure/cash.repository.ts`
- `src/pages/hooks/useDashboardStats.ts`
- `src/pages/Index.tsx`

#### Impacto esperado
- El dashboard refleja mejor el estado final del día cuando la caja ya fue cerrada.
- Mejora la lectura entre operación activa y operación ya cerrada.
- Aumenta la coherencia entre caja y dashboard.

### POS, consistencia de pagos y cambio

#### Cambios aplicados
- Se endureció la validación de sobrepago para métodos no-efectivo.
- El excedente ahora solo se permite cuando existe una línea de pago en efectivo.
- El cálculo visual de cambio se ajustó para no mezclar erróneamente tarjeta/transferencia como si generaran cambio.
- Se añadieron señales visuales más explícitas en el ticket actual.

#### Archivos tocados
- `src/features/pos/hooks/usePOSCart.ts`
- `src/features/pos/components/POSCart.tsx`
- `src/features/pos/pages/POSPage.tsx`

#### Impacto esperado
- Menor riesgo de cobros incoherentes en pagos mixtos.
- Mejor correspondencia entre lo que cobra el POS y lo que luego debe cuadrar en caja.
- Más claridad para cajero al momento de cobrar.

### Caja, lectura detallada de arqueo

#### Cambios aplicados
- Se detalló el arqueo por método de pago en la pantalla de cierre.
- Ahora se muestran esperados, contados y diferencia por efectivo, tarjeta y transferencia.
- La diferencia total proyectada quedó más visible antes de cerrar caja.

#### Archivos tocados
- `src/features/cash-register/pages/CashRegisterPage.tsx`

#### Impacto esperado
- Más claridad para detectar faltantes o sobrantes antes del cierre.
- Mejor coherencia entre POS, caja y revisión operativa del turno.
- Menor ambigüedad en el arqueo final.

### Onboarding, unificación de flujo

#### Cambios aplicados
- Se consolidó un solo onboarding operativo.
- El onboarding alterno de `src/features/onboarding/` quedó explícitamente descontinuado.
- La versión alterna ahora redirige al onboarding unificado.
- Se documentó la decisión para evitar que vuelvan a coexistir dos flujos.

#### Archivos tocados
- `src/features/onboarding/pages/OnboardingPage.tsx`
- `src/features/onboarding/hooks/useOnboarding.ts`
- `docs/ONBOARDING_UNIFICACION.md`

#### Impacto esperado
- Se elimina la ambigüedad sobre qué onboarding usar.
- Baja el riesgo de mantener un flujo incompleto o roto.
- El proyecto queda con un solo punto real de entrada para setup inicial.
