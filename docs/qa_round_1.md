# QA round 1

## Resumen
La base funcional de Ventuki ya permite diseñar una matriz de pruebas útil. Hay rutas protegidas, módulos principales definidos y una suite automatizada que cubre lógica importante. Sin embargo, todavía falta convertir esa cobertura técnica en una validación funcional manual más cercana al uso real.

## Flujos críticos identificados

### Acceso
- login
- recuperación de contraseña
- selección de compañía
- onboarding
- bloqueo de rutas protegidas

### Dashboard
- carga de KPIs
- manejo de loading y error
- refresco de métricas

### Productos
- alta
- edición
- validación de duplicados
- baja
- barcode y precios

### Inventario
- consulta por almacén
- ajuste de stock
- transferencias
- kardex
- conteo físico

### POS
- búsqueda de producto
- agregar al carrito
- selección de cliente
- cobro multi-método
- cierre de venta
- comprobante/ticket

### Compras
- crear compra
- confirmar compra
- recepción parcial
- recepción total
- cancelación/reapertura

### Clientes y proveedores
- alta
- edición
- validación de datos
- baja lógica o bloqueo por referencias

### Facturación
- crear factura
- cancelar
- nota de crédito
- envío por correo
- descarga de PDF/XML

### Apartados
- crear apartado
- registrar abonos
- liquidar
- cancelar
- consultar detalle

## Cobertura automatizada detectada
Existe cobertura útil en:
- POS
- inventario
- compras
- facturación
- flujos críticos generales

Eso da confianza en reglas y casos de negocio, pero no sustituye validación visual y operativa de UI.

## Huecos de cobertura funcional

### 1. Falta de smoke manual consolidado
No hay un solo documento operativo que diga: "así probamos la app completa de punta a punta".

### 2. Falta de validación explícita de rutas protegidas y expiración de sesión
La lógica existe, pero debe probarse de forma manual y reproducible.

### 3. Falta de checklist transversal por módulo
Hay pruebas por reglas, pero no una matriz simple para QA o demo del sistema.

### 4. Falta de escenarios de error de integración
Conviene probar:
- Supabase sin datos
- errores de red
- sesión expirada
- permisos insuficientes
- respuestas vacías

## Smoke test manual sugerido

### Smoke 1, acceso
- [ ] Login exitoso
- [ ] Login inválido muestra error útil
- [ ] Ruta protegida redirige a login sin sesión
- [ ] Selección de compañía/sucursal funciona

### Smoke 2, operación básica
- [ ] Dashboard carga
- [ ] Productos lista y guarda cambios
- [ ] Inventario muestra existencias
- [ ] POS permite agregar producto y cobrar

### Smoke 3, operación extendida
- [ ] Compra se crea correctamente
- [ ] Recepción impacta inventario
- [ ] Cliente se puede seleccionar en POS
- [ ] Facturación abre y ejecuta flujo base
- [ ] Apartados lista, crea y muestra detalle

### Smoke 4, resiliencia
- [ ] Mensajes de error son entendibles
- [ ] Loading states aparecen donde corresponde
- [ ] No hay pantallas en blanco en flujos críticos

## Priorización QA

### Alta
- acceso y rutas protegidas
- POS
- inventario
- compras

### Media
- productos
- clientes/proveedores
- apartados

### Baja
- reportes y ajustes secundarios

## Esfuerzo estimado
- primera ronda manual: media
- formalizar regresión base: media

## Siguiente acción recomendada
En la siguiente ronda conviene convertir este documento en una matriz ejecutable con:
1. precondiciones
2. pasos
3. resultado esperado
4. evidencia
5. severidad del fallo
