# Changes Log, PoS SaaS

## 2026-04-20

### Cierre de Sprint 0
- Se da por cerrada la fase de endurecimiento del circuito base.
- El proyecto queda con una base más coherente entre onboarding, contexto, dashboard, caja y POS.
- La continuidad hacia Sprint 1 ya quedó documentada.

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

### Sprint 1, productos e inventario inicial

#### Cambios aplicados
- Se aclaró el flujo de creación de producto cuando se activa gestión de inventario.
- El formulario ahora explica mejor si se creará stock inicial, si falta almacén o si el producto quedará sin existencias iniciales.
- Se limpió mejor el estado inicial al resetear el formulario.

#### Archivos tocados
- `src/features/products/components/ProductForm.tsx`
- `src/features/products/pages/ProductsPage.tsx`

#### Impacto esperado
- Menos ambigüedad al crear productos con inventario.
- Mejor correspondencia entre lo que el usuario ve y lo que realmente se registra en inventario.
- Más facilidad para validar físicamente este flujo en app.

### Sprint 1, verificabilidad de inventario

#### Cambios aplicados
- El hook de inventario ahora soporta refresco real de datos.
- La pantalla de inventario tiene botón explícito de actualización.
- La tabla ahora comunica mejor estados de carga y vacíos.

#### Archivos tocados
- `src/features/inventory/hooks/useInventory.ts`
- `src/features/inventory/pages/InventoryPage.tsx`
- `src/features/inventory/ui/InventoryTable.tsx`

#### Impacto esperado
- Más confianza al validar si un movimiento ya impactó inventario.
- Mejor verificabilidad física del stock inicial y otros cambios.
- Menos ambigüedad al revisar resultados en UI.

### Sprint 1, continuidad entre productos, inventario y POS

#### Cambios aplicados
- La pantalla de productos ahora deja una señal visible del último producto guardado.
- Se añadieron accesos rápidos para verificar el resultado en Inventario o POS.
- El formulario explica mejor que el stock inicial debe reflejarse después en Inventario.

#### Archivos tocados
- `src/features/products/pages/ProductsPage.tsx`
- `src/features/products/components/ProductForm.tsx`

#### Impacto esperado
- Mejor continuidad entre creación de producto y validación operativa.
- Menos fricción para comprobar físicamente si el flujo quedó bien.
- Más claridad para QA manual del circuito producto → inventario → POS.

### Sprint 1, legibilidad del catálogo POS

#### Cambios aplicados
- El catálogo POS ahora comunica mejor cuando un producto no está listo para vender por falta de precio o stock.
- Se deshabilita agregar al carrito si el producto no tiene precio operativo.
- Se mejoró el mensaje de búsqueda vacía para ayudar a verificar productos recién creados.

#### Archivos tocados
- `src/features/pos/components/POSCatalog.tsx`

#### Impacto esperado
- Menos confusión al validar productos recién creados en POS.
- Más claridad sobre por qué un producto no puede venderse todavía.
- Mejor QA manual del puente producto → inventario → POS.

### Sprint 1, listado de productos más operativo

#### Cambios aplicados
- El listado de productos ahora muestra señales rápidas de operatividad.
- Se añadió lectura visible de si el producto tiene precio y barcode.
- Esto ayuda a detectar más rápido si un producto quedó incompleto para operación.

#### Archivos tocados
- `src/features/products/services/productService.ts`
- `src/features/products/components/ProductList.tsx`

#### Impacto esperado
- Mejor lectura del estado real del catálogo.
- Menos necesidad de entrar a editar solo para descubrir si faltan piezas básicas.
- Mejor QA manual del módulo de productos.

### Sprint 1, producto listo para POS

#### Cambios aplicados
- El listado de productos ahora marca si el artículo quedó listo para POS o incompleto para venta.
- La confirmación de guardado también comunica mejor si el producto quedó con base mínima para validarse en POS.
- Se consolidó una lectura más directa entre estado del producto y operatividad de venta.

#### Archivos tocados
- `src/features/products/services/productService.ts`
- `src/features/products/components/ProductList.tsx`
- `src/features/products/pages/ProductsPage.tsx`

#### Impacto esperado
- Más claridad para saber cuándo un producto ya puede pasar a validación en POS.
- Menos ambigüedad entre catálogo técnico y producto realmente vendible.
- Mejor continuidad para QA manual del flujo producto → POS.

### Sprint 1, continuidad entre inventario y compras

#### Cambios aplicados
- La sugerencia de recompra ahora confirma cuántos productos se enviaron a Compras.
- Compras muestra una señal visible cuando se cargó un borrador desde Inventario.
- También se refuerza la lectura del proveedor sugerido y la necesidad de revisar costos/cantidades.

#### Archivos tocados
- `src/features/inventory/ui/ReorderSuggestionsPanel.tsx`
- `src/features/purchases/pages/PurchasesPage.tsx`

#### Impacto esperado
- Mejor continuidad entre reabasto detectado e inicio real de compra.
- Menos ambigüedad al llegar a Compras desde Inventario.
- Mejor QA manual del flujo inventario → compras.

### Sprint 1, lectura de recepción de compras

#### Cambios aplicados
- Recepción de compras ahora muestra mejor el estado global de la compra seleccionada.
- Se añadió un resumen visible de partidas completas, recibido acumulado y pendiente acumulado.
- La UI comunica mejor si la compra sigue parcial o si ya debería quedar totalmente recibida.

#### Archivos tocados
- `src/features/purchases/pages/PurchasesPage.tsx`

#### Impacto esperado
- Menos necesidad de deducir el estado de recepción fila por fila.
- Más claridad sobre cuándo la compra ya impactó inventario parcialmente o por completo.
- Mejor QA manual del flujo compras → inventario.

### Sprint 1, visibilidad de incidencias en recepción

#### Cambios aplicados
- Se añadió un resumen visible de incidencias para la recepción en curso.
- La UI agrupa faltantes, daños y sobrantes antes de registrar la entrada.
- También lista las partidas afectadas para revisión operativa rápida.

#### Archivos tocados
- `src/features/purchases/pages/PurchasesPage.tsx`

#### Impacto esperado
- Menos incidencias escondidas entre inputs de captura.
- Mejor control operativo antes de confirmar una recepción.
- Mejor QA manual de recepciones parciales con anomalías.

### Sprint 1, lectura de conteo físico antes de publicar

#### Cambios aplicados
- La previa de conteo físico ahora resume partidas que suben, bajan o no cambian.
- También muestra impacto neto visible antes de publicar el ajuste.
- Cada partida comunica mejor si el ajuste sube, baja o queda sin cambio.

#### Archivos tocados
- `src/features/inventory/ui/PhysicalCountPanel.tsx`

#### Impacto esperado
- Menos riesgo de publicar ajustes sin entender su efecto.
- Mejor lectura operativa del conteo físico previo al posteado.
- Mejor QA manual del flujo conteo → ajuste de inventario.

### Sprint 1, revisión previa de transferencias internas

#### Cambios aplicados
- Transferencias internas ahora muestran un resumen previo antes de mover stock.
- La UI deja visible origen, destino, producto y cantidad capturada.
- También refuerza el error operativo cuando origen y destino son iguales.

#### Archivos tocados
- `src/features/inventory/ui/TransferStockPanel.tsx`

#### Impacto esperado
- Menos transferencias ejecutadas con contexto incompleto.
- Mejor validación manual antes de mover stock entre almacenes.
- Mejor QA manual del flujo transferencia interna.
