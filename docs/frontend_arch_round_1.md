# Frontend architecture round 1

## Resumen
La arquitectura de Ventuki ya muestra una intención clara de trabajo por features y casos de uso, lo cual es una base muy buena. Aun así, conviven dos niveles de madurez: partes bien separadas por dominio y otras todavía cercanas a acceso directo a Supabase desde servicios o páginas. También hay una oportunidad clara de performance en routing y code splitting.

## Hallazgos

### 1. Estructura por features ya es una fortaleza
**Impacto:** positivo

Existen módulos bien delimitados para:
- auth
- inventory
- invoicing
- pos
- products
- purchases
- customers
- suppliers
- reports
- layaways

Además, algunos features ya incluyen capas como:
- application
- domain
- infrastructure
- hooks
- ui
- validations
- events

Esto facilita escalar el proyecto con trabajo incremental.

### 2. El routing principal está centralizado pero no lazy-loaded
**Impacto:** alto

`App.tsx` importa directamente muchas páginas pesadas. Eso empuja más código al bundle inicial de lo necesario.

Esto coincide con el hallazgo del build:
- bundle principal alrededor de 1.3 MB minificado

**Siguiente acción recomendada:**
Aplicar `React.lazy` o lazy loading por rutas para módulos como POS, inventario, compras, facturación, reportes y apartados.

### 3. Coexisten patrones modernos y acceso directo a infraestructura
**Impacto:** medio

Hay features con usecases y repositories, pero también servicios o páginas que acceden de forma bastante directa a Supabase. Eso mezcla niveles de responsabilidad y dificulta estandarizar testing, logging y seguridad.

**Siguiente acción recomendada:**
Definir un patrón preferido por feature, por ejemplo:
- page
- hook/usecase
- repository/service
- supabase client

### 4. Hay duplicidad potencial entre `services` e `infrastructure`
**Impacto:** medio

En varios módulos aparecen ambas carpetas. Eso puede ser útil, pero también puede esconder solapamientos o deuda técnica.

**Siguiente acción recomendada:**
Auditar 2 o 3 features y documentar cuándo usar `service` y cuándo `repository/infrastructure`.

### 5. La cobertura de tests existe, pero conviene alinear mejor con la arquitectura
**Impacto:** medio

Hay pruebas en varias capas, incluyendo domain, integration, UX y QA flows. Eso es bueno. El siguiente paso es usar esa cobertura para respaldar refactors de bajo riesgo, especialmente en routing, data access y separación de responsabilidades.

## Oportunidades de refactor de bajo riesgo y alto impacto

### Prioridad alta
1. Lazy loading de rutas principales
2. Estandarizar acceso a Supabase por feature
3. Crear mapa de dependencias entre módulos críticos

### Prioridad media
4. Revisar duplicidad entre `services` e `infrastructure`
5. Unificar convenciones para hooks y usecases
6. Documentar patrón por feature

### Prioridad baja
7. Consolidar barrels `index.ts` donde ayuden
8. Afinar naming entre `ui`, `components` y `pages`

## Features candidatas para lazy loading inmediato
- ProductsPage
- InventoryPage
- SuppliersPage
- PurchasesPage
- POSPage
- CustomersPage
- ReportsPage
- CashRegisterPage
- InvoicingPage
- LayawaysPage
- LayawayDetailPage
- CatalogsSettingsPage

## Esfuerzo estimado
- lazy loading inicial: bajo a medio
- estandarización de patrones por feature: medio
- limpieza arquitectónica profunda: media a alta

## Siguiente acción recomendada
Ejecutar una ronda 2 con estos entregables:
1. propuesta de lazy loading en `App.tsx`
2. mapa técnico por feature crítico
3. convención mínima de arquitectura para nuevos cambios
