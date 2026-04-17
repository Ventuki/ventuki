# 🏗️ ARQUITECTURA COMPLETA — POS SaaS MULTI-EMPRESA PARA RETAIL

**Versión:** 1.0  
**Fecha:** 2026-04-05  
**Stack:** React 18 + TypeScript 5 + Vite 5 + Tailwind CSS v3 + Lovable Cloud (PostgreSQL + RLS + Edge Functions)

---

## TABLA DE CONTENIDOS

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Decisiones Arquitectónicas](#2-decisiones-arquitectónicas)
3. [Módulos del Sistema](#3-módulos-del-sistema)
4. [Catálogos](#4-catálogos)
5. [Pantallas](#5-pantallas)
6. [Modelo de Datos](#6-modelo-de-datos)
7. [Multi-Tenant + RLS](#7-multi-tenant--rls)
8. [Flujos Críticos](#8-flujos-críticos)
9. [Integración Opcional con EverShop](#9-integración-opcional-con-evershop)
10. [UX/UI](#10-uxui)
11. [Seguridad y Calidad](#11-seguridad-y-calidad)
12. [Roadmap por Fases](#12-roadmap-por-fases)
13. [Recomendación Final](#13-recomendación-final)

---

# 1. RESUMEN EJECUTIVO

## Producto

POS SaaS multi-empresa para negocios de retail con inventario físico: ferreterías, refaccionarias, casas de materiales y tiendas de autopartes. El sistema cubre desde la venta en mostrador hasta la gestión integral de inventarios, compras, caja, cotizaciones, apartados y pedidos.

## Decisión Arquitectónica Inamovible

| Componente | Decisión |
|---|---|
| POS principal | Construido desde cero sobre React 18 + TypeScript + Lovable Cloud |
| EverShop | Solo como módulo OPCIONAL para e-commerce/catálogo web |
| Backend | Lovable Cloud (PostgreSQL + RLS + Edge Functions + Realtime) |
| Multi-tenancy | Segregación por `company_id` con RLS a nivel de fila |

## Alcance MVP

- Alta de empresa + sucursal + almacén + caja
- Catálogos maestros (productos, categorías, marcas, unidades)
- Inventario básico (entradas, salidas, stock)
- Compras a proveedores + recepción
- Ventas en mostrador (POS)
- Cobro (efectivo, tarjeta, mixto)
- Cotizaciones
- Apertura/cierre/corte de caja
- Clientes y proveedores
- Roles y permisos básicos
- Dashboard con KPIs esenciales
- Suscripción SaaS (Stripe)

## Fuera del MVP (fases posteriores)

- Apartados y abonos
- Pedidos especiales
- Devoluciones avanzadas
- Traspasos entre sucursales
- Facturación electrónica (CFDI)
- Cuentas por cobrar/pagar
- Reportes avanzados
- Integración EverShop
- Notificaciones push
- Importación/exportación masiva

---

# 2. DECISIONES ARQUITECTÓNICAS

## 2.1 Principios Obligatorios

| Principio | Descripción |
|---|---|
| **POS desde cero** | Todo el núcleo operativo se construye sobre el stack actual. Sin dependencias externas para lógica de negocio. |
| **Multi-tenant por empresa** | Cada empresa es un tenant. Segregación por `company_id` en todas las tablas transaccionales. |
| **Multi-sucursal** | Cada empresa puede tener N sucursales con su propia configuración. |
| **Multi-almacén** | Cada sucursal puede tener N almacenes. El stock se controla por almacén. |
| **RLS como capa de seguridad** | Toda la seguridad de datos se aplica a nivel de fila en PostgreSQL. |
| **Auditoría obligatoria** | Toda operación financiera, de inventario o de seguridad queda registrada. |
| **Separación de capas** | Catálogos ≠ Transacciones ≠ Configuración ≠ SaaS. |
| **EverShop desacoplado** | EverShop solo consume datos publicados vía API. Nunca es fuente de verdad. |
| **Código modular** | Cada módulo tiene su carpeta con componentes, hooks, types y servicios propios. |

## 2.2 ¿Por qué el POS NO debe depender de EverShop?

1. **EverShop es un framework e-commerce** — su modelo de datos, flujos y UI están diseñados para tiendas en línea, no para operación de mostrador.
2. **Velocidad de mostrador** — un POS de ferretería necesita respuesta <200ms por teclazo. EverShop agrega latencia y complejidad innecesarias.
3. **Lógica de negocio retail** — apartados, cortes de caja, compras a proveedor, recepción física de mercancía, descuentos por mayoreo — nada de esto existe nativamente en EverShop.
4. **Control total** — con el stack actual se tiene control completo sobre schema, RLS, edge functions y realtime sin depender de un framework externo.
5. **Independencia operativa** — si EverShop falla o se descontinúa, el POS sigue funcionando al 100%.

## 2.3 Dónde SÍ puede entrar EverShop

| Capa | Uso permitido |
|---|---|
| Catálogo web | Mostrar productos publicados con precios públicos |
| Storefront | Escaparate B2C para clientes finales |
| Pedidos en línea | Recibir pedidos que se procesan como órdenes en el POS |
| Portal B2B | Catálogo con precios especiales para distribuidores |

**Límite absoluto:** EverShop NUNCA modifica stock, precios maestros, datos de clientes ni transacciones del POS. Solo lee datos publicados y envía órdenes.

## 2.4 Estructura de Carpetas del Proyecto

```
src/
├── assets/
├── components/
│   ├── ui/              # shadcn/ui base components
│   ├── layout/          # MainLayout, Sidebar, TopBar
│   ├── shared/          # DataTable, SearchInput, ConfirmDialog, StatusBadge
│   └── pos/             # POSLayout, TicketPanel, ProductSearch, PaymentModal
├── features/
│   ├── auth/            # login, recovery, company selection
│   ├── dashboard/       # KPIs, charts
│   ├── products/        # CRUD, variants, barcodes, prices
│   ├── inventory/       # stock levels, movements, adjustments, transfers
│   ├── purchases/       # orders, receipts
│   ├── sales/           # POS, history, detail
│   ├── quotations/      # create, convert to sale
│   ├── layaways/        # apartados, abonos
│   ├── customers/       # CRUD, addresses, balances
│   ├── suppliers/       # CRUD, contacts
│   ├── cash-register/   # sessions, cuts, expenses
│   ├── reports/         # sales, inventory, cash
│   ├── billing/         # prepared for CFDI (future)
│   ├── settings/        # company, fiscal, branches, warehouses
│   ├── users/           # CRUD, roles, permissions
│   ├── subscription/    # plans, billing, limits
│   ├── audit/           # logs viewer
│   ├── notifications/   # in-app notifications
│   └── ecommerce/       # optional EverShop integration
├── hooks/               # shared hooks
├── lib/                 # utils, constants, api client
├── services/            # API calls organized by domain
├── types/               # shared TypeScript types/interfaces
├── stores/              # global state (if needed)
├── pages/               # route-level page components
└── routes/              # route definitions
```

Cada feature sigue esta estructura interna:

```
features/products/
├── components/          # UI components specific to this feature
├── hooks/               # useProducts, useProductForm, etc.
├── services/            # productService.ts (API calls)
├── types/               # Product, ProductVariant, etc.
├── schemas/             # Zod schemas for validation
├── utils/               # helper functions
└── index.ts             # public exports
```

---

# 3. MÓDULOS DEL SISTEMA

## Leyenda de prioridad

- **P0** = MVP obligatorio
- **P1** = Post-MVP inmediato
- **P2** = Fase de madurez
- **P3** = Opcional/futuro

| # | Módulo | Objetivo | Prioridad | Dependencias | Riesgos |
|---|---|---|---|---|---|
| 1 | **Dashboard** | KPIs de ventas, inventario, caja del día | P0 | Sales, Inventory, CashRegister | Queries pesadas sin índices |
| 2 | **POS / Venta Rápida** | Venta en mostrador con búsqueda rápida, ticket, cobro | P0 | Products, Inventory, CashRegister, Customers | Performance en búsqueda, stock en tiempo real |
| 3 | **Cobro** | Procesar pagos (efectivo, tarjeta, mixto, transferencia) | P0 | Sales, CashRegister, Payments | Concurrencia en caja, fallas de red |
| 4 | **Historial de Ventas** | Consultar ventas con filtros por fecha, cajero, cliente, estatus | P0 | Sales | Paginación con volúmenes altos |
| 5 | **Cotizaciones** | Crear cotización, convertir a venta | P0 | Products, Customers, Sales | Precios pueden cambiar entre cotización y venta |
| 6 | **Apartados** | Reservar mercancía con abonos parciales | P1 | Products, Inventory, Customers, Payments | Stock reservado vs disponible |
| 7 | **Pedidos Especiales** | Mercancía no en existencia solicitada por cliente | P1 | Products, Purchases, Customers | Trazabilidad proveedor→pedido→cliente |
| 8 | **Devoluciones** | Devolver producto, reingreso a inventario, nota de crédito | P1 | Sales, Inventory, Payments | Reglas de negocio complejas por giro |
| 9 | **Compras** | Orden de compra a proveedor | P0 | Products, Suppliers | Control de costos y precios |
| 10 | **Recepción de Mercancía** | Registrar entrada física vs orden de compra | P0 | Purchases, Inventory | Diferencias entre pedido y recibido |
| 11 | **Inventario** | Stock por almacén, mínimos, máximos, alertas | P0 | Products, Warehouses | Consistencia entre movimientos y saldos |
| 12 | **Ajustes de Inventario** | Merma, daño, corrección, conteo físico | P0 | Inventory | Auditoría obligatoria |
| 13 | **Traspasos** | Mover mercancía entre almacenes/sucursales | P1 | Inventory, Warehouses | Estado intermedio "en tránsito" |
| 14 | **Productos** | Catálogo maestro con categorías, variantes, precios, atributos | P0 | Categories, Brands, Units | Volumen de datos, variantes complejas |
| 15 | **Clientes** | Registro, historial, saldos, datos fiscales | P0 | — | Duplicados, datos fiscales incorrectos |
| 16 | **Proveedores** | Registro, contactos, historial de compras | P0 | — | — |
| 17 | **Cuentas por Cobrar** | Ventas a crédito, seguimiento de pagos | P1 | Sales, Customers, Payments | Morosidad, cortes incorrectos |
| 18 | **Cuentas por Pagar** | Deudas con proveedores, fechas de vencimiento | P1 | Purchases, Suppliers, Payments | — |
| 19 | **Caja** | Apertura, cierre, corte, gastos, fondo | P0 | CashRegister, Sales, Payments | Descuadres, operaciones sin sesión abierta |
| 20 | **Reportes** | Ventas, inventario, caja, compras, utilidad | P1 | Todos los módulos transaccionales | Performance en reportes históricos |
| 21 | **Facturación (preparación)** | Estructura para CFDI futuro: series, folios, datos fiscales | P1 | Sales, Customers, Settings | No implementar timbrado aún |
| 22 | **Usuarios** | CRUD usuarios, asignación a empresa/sucursal | P0 | Auth, Roles | — |
| 23 | **Roles y Permisos** | Matriz de permisos por rol, por empresa | P0 | Users | Granularidad excesiva vs insuficiente |
| 24 | **Sucursales** | CRUD sucursales por empresa | P0 | Companies | — |
| 25 | **Almacenes** | CRUD almacenes por sucursal | P0 | Branches | — |
| 26 | **Configuración del Negocio** | Nombre, logo, moneda, idioma, zona horaria | P0 | Companies | — |
| 27 | **Configuración Fiscal** | Datos fiscales del emisor, regímenes, impuestos | P1 | Companies, TaxProfiles | — |
| 28 | **Planes y Suscripciones SaaS** | Gestión de planes, límites, cobro recurrente (Stripe) | P0 | Companies, Stripe | Suspensión/reactivación |
| 29 | **Bitácora / Auditoría** | Log de operaciones críticas consultable | P0 | Todos | Volumen de registros |
| 30 | **Notificaciones** | Alertas de stock bajo, vencimientos, pagos pendientes | P2 | Inventario, CxC, CxP | — |
| 31 | **Importación/Exportación** | Carga masiva de productos, clientes, precios | P2 | Products, Customers | Validación de datos, duplicados |

### Funciones principales por módulo clave

**POS / Venta Rápida:**
- Búsqueda por nombre, código, código de barras (con lector)
- Agregar al ticket con cantidad
- Descuentos por línea o generales
- Seleccionar cliente o venta público general
- Seleccionar lista de precios (mayoreo, menudeo)
- Guardar ticket, suspender ticket, retomar ticket suspendido
- Enviar a cobro

**Cobro:**
- Calcular total con impuestos
- Aceptar múltiples métodos de pago en una misma venta
- Calcular cambio
- Generar ticket imprimible
- Registrar pago en caja activa
- Cerrar venta

**Caja:**
- Apertura con fondo inicial
- Registro de gastos de caja (con motivo)
- Retiros parciales
- Entradas de efectivo
- Corte parcial
- Corte final: esperado vs contado, diferencia
- Cierre de sesión de caja

---

# 4. CATÁLOGOS

## 4.1 Catálogos de Empresa y Estructura

| Catálogo | Propósito | Campos clave | Segregación | Tipo | Baja lógica | Auditoría |
|---|---|---|---|---|---|---|
| **companies** | Tenant principal | id, name, slug, rfc, legal_name, logo_url, timezone, currency, status | Global | Maestro | Sí | Sí |
| **company_settings** | Config por empresa | company_id, key, value, type | company_id | Apoyo | No | Sí |
| **branches** | Sucursales | id, company_id, name, address, phone, is_main, status | company_id | Maestro | Sí | Sí |
| **warehouses** | Almacenes | id, branch_id, company_id, name, type(physical/virtual), status | company_id | Maestro | Sí | Sí |
| **cash_registers** | Cajas | id, branch_id, company_id, name, code, status | company_id | Maestro | Sí | Sí |

## 4.2 Catálogos de Seguridad

| Catálogo | Propósito | Campos clave | Segregación | Tipo | Baja lógica | Auditoría |
|---|---|---|---|---|---|---|
| **user_profiles** | Perfil de usuario | id (=auth.users.id), full_name, avatar_url, phone | Global | Maestro | No | Sí |
| **company_users** | Relación usuario↔empresa↔sucursal | id, user_id, company_id, branch_ids[], role_id, status | company_id | Apoyo | Sí | Sí |
| **roles** | Roles del sistema | id, company_id, name, description, is_system | company_id (null=global) | Maestro | Sí | Sí |
| **permissions** | Permisos disponibles | id, module, action, description | Global | Maestro | No | No |
| **role_permissions** | Asignación permiso↔rol | id, role_id, permission_id | Hereda de rol | Apoyo | No | Sí |

## 4.3 Catálogos Comerciales

| Catálogo | Propósito | Campos clave | Segregación | Tipo | Baja lógica | Auditoría |
|---|---|---|---|---|---|---|
| **customers** | Clientes | id, company_id, code, name, email, phone, rfc, tax_regime, customer_type_id, credit_limit, balance | company_id | Maestro | Sí | Sí |
| **customer_types** | Tipos de cliente | id, company_id, name (menudeo, mayoreo, distribuidor, contratista) | company_id | Apoyo | Sí | No |
| **customer_addresses** | Direcciones | id, customer_id, type, street, city, state, zip, is_default | Hereda | Apoyo | Sí | No |
| **suppliers** | Proveedores | id, company_id, code, name, contact, phone, email, rfc, payment_terms, status | company_id | Maestro | Sí | Sí |
| **supplier_types** | Tipos de proveedor | id, company_id, name | company_id | Apoyo | Sí | No |

## 4.4 Catálogos de Producto

| Catálogo | Propósito | Campos clave | Segregación | Tipo | Baja lógica | Auditoría |
|---|---|---|---|---|---|---|
| **products** | Producto maestro | id, company_id, sku, name, description, category_id, subcategory_id, brand_id, line_id, department_id, unit_id, tax_profile_id, is_active, track_stock, allow_fractions, min_stock, max_stock, cost, base_price | company_id | Maestro | Sí | Sí |
| **product_categories** | Categorías | id, company_id, name, parent_id, sort_order | company_id | Maestro | Sí | No |
| **product_subcategories** | Subcategorías | id, category_id, company_id, name | company_id | Apoyo | Sí | No |
| **product_brands** | Marcas | id, company_id, name, logo_url | company_id | Maestro | Sí | No |
| **product_lines** | Líneas | id, company_id, name | company_id | Apoyo | Sí | No |
| **product_departments** | Departamentos | id, company_id, name | company_id | Apoyo | Sí | No |
| **product_units** | Unidades de medida | id, company_id, name, abbreviation (pza, kg, m, lt, rollo, caja) | company_id | Maestro | Sí | No |
| **product_attributes** | Atributos definibles | id, company_id, name, type (text, number, select, color) | company_id | Apoyo | Sí | No |
| **product_attribute_values** | Valores de atributo | id, attribute_id, value | Hereda | Apoyo | No | No |
| **product_variants** | Variantes (talla, color, medida) | id, product_id, sku, name, attributes_json, cost, price, is_active | Hereda | Maestro | Sí | Sí |
| **product_barcodes** | Códigos de barras | id, product_id, variant_id, barcode, type (EAN13, CODE128, UPC) | Hereda | Apoyo | No | No |
| **price_lists** | Listas de precios | id, company_id, name, type (retail, wholesale, contractor), is_default | company_id | Maestro | Sí | No |
| **product_prices** | Precio por lista | id, product_id, variant_id, price_list_id, price, min_qty | Hereda | Apoyo | No | Sí |

## 4.5 Catálogos de Inventario

| Catálogo | Propósito | Campos clave |
|---|---|---|
| **stock_movement_types** | Tipos de movimiento | id, name (entrada_compra, salida_venta, ajuste_positivo, ajuste_negativo, traspaso_salida, traspaso_entrada, devolucion_cliente, devolucion_proveedor) |
| **adjustment_reasons** | Motivos de ajuste | id, company_id, name, type (positive/negative) |
| **return_reasons** | Motivos de devolución | id, company_id, name |
| **discount_reasons** | Motivos de descuento | id, company_id, name, max_percent |

## 4.6 Catálogos Operativos

| Catálogo | Propósito | Campos clave |
|---|---|---|
| **payment_methods** | Métodos de pago | id, company_id, name, type (cash, card, transfer, check, credit), is_active |
| **delivery_methods** | Formas de entrega | id, company_id, name (mostrador, envío, recoger) |
| **document_statuses** | Estados de documentos | id, entity_type, name (draft, confirmed, partial, completed, cancelled) |
| **document_series** | Series y folios | id, company_id, branch_id, entity_type (sale, purchase, quotation, etc.), prefix, current_folio |
| **currencies** | Monedas | id, code, name, symbol, exchange_rate |

## 4.7 Catálogos Fiscales

| Catálogo | Propósito | Campos clave |
|---|---|---|
| **tax_profiles** | Perfiles de impuesto | id, company_id, name, rate, type (IVA, IEPS, exento), is_included |
| **tax_regimes** | Regímenes fiscales SAT | id, code, name |
| **cfdi_uses** | Usos de CFDI | id, code, name |
| **fiscal_config** | Config fiscal del emisor | id, company_id, rfc, legal_name, tax_regime_id, zip_code, certificate_data |

## 4.8 Catálogos SaaS

| Catálogo | Propósito | Campos clave |
|---|---|---|
| **plans** | Planes SaaS | id, name, price_monthly, price_yearly, stripe_price_id, is_active |
| **plan_features** | Límites por plan | id, plan_id, feature_key, limit_value (max_branches, max_users, max_products, etc.) |
| **plan_modules** | Módulos habilitados | id, plan_id, module_key, is_enabled |
| **sales_channels** | Canales de venta | id, company_id, name (mostrador, en_linea, telefono) |

## 4.9 Catálogos de Integración E-commerce (opcional)

| Catálogo | Propósito | Campos clave |
|---|---|---|
| **ecommerce_integrations** | Config de integración | id, company_id, provider (evershop), api_url, api_key_secret_ref, status, last_sync |
| **ecommerce_product_mappings** | Mapeo producto↔ecommerce | id, product_id, external_id, sync_status |
| **ecommerce_sync_logs** | Log de sincronización | id, integration_id, direction, entity, status, error_message, synced_at |

---

# 5. PANTALLAS DEL SISTEMA

## 5.1 Pantallas por Rol

### Pantallas Públicas / Auth

| Pantalla | Ruta | Tipo | Objetivo | Componentes UI | Permisos |
|---|---|---|---|---|---|
| Login | `/login` | Page | Autenticación | Form (email, password), hCaptcha | Público |
| Recuperar contraseña | `/forgot-password` | Page | Reset password | Form (email) | Público |
| Resetear contraseña | `/reset-password` | Page | Nueva contraseña | Form (password, confirm) | Token válido |
| Selección de empresa | `/select-company` | Page | Elegir empresa y sucursal | Cards con empresas/sucursales | Autenticado |

### Dashboard (todos los roles con acceso)

| Pantalla | Ruta | Tipo | Objetivo | Componentes |
|---|---|---|---|---|
| Dashboard | `/dashboard` | Page | KPIs del día/periodo | Cards KPI, Charts (Recharts), filtros por periodo |

**Datos:** ventas del día, ticket promedio, productos vendidos, top 10 productos, estado de caja, alertas stock bajo.  
**Estados:** loading (skeletons), error (retry), vacío (onboarding).

### Punto de Venta (Cajero, Vendedor)

| Pantalla | Ruta | Tipo | Objetivo |
|---|---|---|---|
| POS Principal | `/pos` | Page | Pantalla de venta rápida |
| Búsqueda de productos | — | Drawer/Panel | Buscar por nombre, SKU, código de barras |
| Ticket actual | — | Panel lateral | Líneas del ticket, totales, descuentos |
| Cobro | `/pos/checkout` | Modal | Registrar pagos, calcular cambio |
| Ticket suspendido | — | Modal | Listar tickets suspendidos para retomar |
| Historial de ventas | `/sales` | Page | Tabla con filtros |
| Detalle de venta | `/sales/:id` | Page/Drawer | Detalle completo con acciones |

**Componentes POS:**
- `ProductSearchBar` — input con hotkey (F2), búsqueda en tiempo real
- `TicketItemList` — tabla de líneas del ticket con qty editable
- `TicketTotals` — subtotal, descuento, impuestos, total
- `CustomerSelector` — combobox para seleccionar/crear cliente
- `PriceListSelector` — switch entre listas de precios
- `PaymentModal` — tabs por método de pago, input de monto, cálculo de cambio
- `TicketPreview` — vista previa para impresión (thermal 80mm)

**Acciones POS:** Agregar producto (tecla +/Enter), quitar línea (Delete), cambiar cantidad, aplicar descuento, suspender ticket, cobrar (F12), reimprimir último ticket.

**Atajos de teclado obligatorios:**
- `F2` — Foco en búsqueda
- `F4` — Seleccionar cliente
- `F8` — Suspender ticket
- `F9` — Retomar ticket
- `F12` — Cobrar
- `Esc` — Cancelar modal activo

### Cotizaciones

| Pantalla | Ruta | Tipo |
|---|---|---|
| Lista de cotizaciones | `/quotations` | Page |
| Nueva cotización | `/quotations/new` | Page |
| Detalle cotización | `/quotations/:id` | Page |
| Convertir a venta | — | Modal (confirmación) |

### Apartados (P1)

| Pantalla | Ruta | Tipo |
|---|---|---|
| Lista de apartados | `/layaways` | Page |
| Nuevo apartado | `/layaways/new` | Page |
| Detalle de apartado | `/layaways/:id` | Page |
| Registrar abono | — | Modal |

### Compras (Encargado de compras)

| Pantalla | Ruta | Tipo |
|---|---|---|
| Lista de compras | `/purchases` | Page |
| Nueva compra | `/purchases/new` | Page |
| Detalle de compra | `/purchases/:id` | Page |
| Recepción de mercancía | `/purchases/:id/receive` | Page |

### Inventario (Encargado de almacén)

| Pantalla | Ruta | Tipo |
|---|---|---|
| Stock por almacén | `/inventory` | Page |
| Movimientos de inventario | `/inventory/movements` | Page |
| Ajuste de inventario | `/inventory/adjustments/new` | Page |
| Traspasos | `/inventory/transfers` | Page |
| Nuevo traspaso | `/inventory/transfers/new` | Page |

### Productos (Admin, Supervisor)

| Pantalla | Ruta | Tipo |
|---|---|---|
| Lista de productos | `/products` | Page |
| Nuevo producto | `/products/new` | Page |
| Editar producto | `/products/:id/edit` | Page |
| Variantes | — | Tab dentro de producto |
| Precios por lista | — | Tab dentro de producto |
| Códigos de barras | — | Tab dentro de producto |
| Categorías | `/products/categories` | Page |
| Marcas | `/products/brands` | Page |
| Unidades | `/products/units` | Page |

### Clientes y Proveedores

| Pantalla | Ruta | Tipo |
|---|---|---|
| Lista de clientes | `/customers` | Page |
| Detalle de cliente | `/customers/:id` | Page |
| Nuevo cliente | `/customers/new` | Modal/Page |
| Lista de proveedores | `/suppliers` | Page |
| Detalle de proveedor | `/suppliers/:id` | Page |

### Caja (Cajero, Supervisor)

| Pantalla | Ruta | Tipo |
|---|---|---|
| Estado de caja | `/cash-register` | Page |
| Apertura de caja | — | Modal |
| Cierre/Corte de caja | `/cash-register/cut` | Page |
| Gastos de caja | — | Modal |
| Historial de cortes | `/cash-register/history` | Page |

### Reportes (Admin, Supervisor, Contador)

| Pantalla | Ruta | Tipo |
|---|---|---|
| Reporte de ventas | `/reports/sales` | Page |
| Reporte de inventario | `/reports/inventory` | Page |
| Reporte de compras | `/reports/purchases` | Page |
| Reporte de caja | `/reports/cash` | Page |
| Reporte de utilidad | `/reports/profit` | Page |

### Configuración (Dueño/Admin)

| Pantalla | Ruta | Tipo |
|---|---|---|
| Datos de empresa | `/settings/company` | Page |
| Sucursales | `/settings/branches` | Page |
| Almacenes | `/settings/warehouses` | Page |
| Cajas | `/settings/cash-registers` | Page |
| Configuración fiscal | `/settings/fiscal` | Page |
| Métodos de pago | `/settings/payment-methods` | Page |
| Listas de precios | `/settings/price-lists` | Page |
| Series y folios | `/settings/document-series` | Page |
| Impuestos | `/settings/taxes` | Page |

### Usuarios y Seguridad (Admin)

| Pantalla | Ruta | Tipo |
|---|---|---|
| Lista de usuarios | `/users` | Page |
| Invitar usuario | — | Modal |
| Editar usuario | `/users/:id` | Page |
| Roles | `/users/roles` | Page |
| Permisos por rol | `/users/roles/:id` | Page |
| Bitácora de auditoría | `/audit` | Page |

### Suscripción SaaS (Dueño)

| Pantalla | Ruta | Tipo |
|---|---|---|
| Mi plan | `/subscription` | Page |
| Cambiar plan | `/subscription/upgrade` | Page |
| Historial de pagos | `/subscription/billing` | Page |

### Superadmin SaaS (interno)

| Pantalla | Ruta | Tipo |
|---|---|---|
| Panel de empresas | `/admin/companies` | Page |
| Detalle empresa | `/admin/companies/:id` | Page |
| Planes y precios | `/admin/plans` | Page |
| Métricas globales | `/admin/metrics` | Page |
| Logs globales | `/admin/logs` | Page |

### Patrones de Estado para TODAS las pantallas

| Estado | Implementación |
|---|---|
| **Loading** | Skeleton components (shadcn Skeleton) |
| **Empty** | Ilustración + texto descriptivo + CTA para crear primer registro |
| **Error** | Alert destructive con mensaje + botón reintentar |
| **Success** | Toast (Sonner) para confirmaciones |
| **Confirmation** | AlertDialog para acciones destructivas o irreversibles |

---

# 6. MODELO DE DATOS

## 6.1 Tablas del Núcleo POS

```sql
-- ============================================
-- EMPRESA Y ESTRUCTURA
-- ============================================

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  legal_name VARCHAR(255),
  rfc VARCHAR(13),
  tax_regime_code VARCHAR(10),
  logo_url TEXT,
  timezone VARCHAR(50) DEFAULT 'America/Mexico_City',
  currency_code VARCHAR(3) DEFAULT 'MXN',
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','suspended','cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(20),
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  is_main BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_branches_company ON branches(company_id);

CREATE TABLE warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) DEFAULT 'physical' CHECK (type IN ('physical','virtual','transit')),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_warehouses_company ON warehouses(company_id);
CREATE INDEX idx_warehouses_branch ON warehouses(branch_id);

CREATE TABLE cash_registers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- ============================================
-- USUARIOS Y SEGURIDAD
-- ============================================

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  avatar_url TEXT,
  phone VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TYPE app_role AS ENUM ('superadmin','owner','admin','supervisor','cashier','seller','warehouse_manager','buyer','accountant');

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE, -- NULL = system role
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module VARCHAR(50) NOT NULL,         -- 'sales', 'inventory', 'purchases', etc.
  action VARCHAR(50) NOT NULL,         -- 'create', 'read', 'update', 'delete', 'approve', 'cancel'
  description TEXT,
  UNIQUE(module, action)
);

CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE(role_id, permission_id)
);

CREATE TABLE company_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id),
  branch_ids UUID[] DEFAULT '{}',  -- sucursales donde puede operar
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(user_id, company_id)
);
CREATE INDEX idx_company_users_company ON company_users(company_id);
CREATE INDEX idx_company_users_user ON company_users(user_id);

-- ============================================
-- CATÁLOGOS COMERCIALES
-- ============================================

CREATE TABLE customer_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  rfc VARCHAR(13),
  legal_name VARCHAR(255),
  tax_regime_code VARCHAR(10),
  cfdi_use_code VARCHAR(10),
  customer_type_id UUID REFERENCES customer_types(id),
  credit_limit DECIMAL(12,2) DEFAULT 0,
  balance DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_customers_company ON customers(company_id);
CREATE INDEX idx_customers_name ON customers(company_id, name);
CREATE INDEX idx_customers_rfc ON customers(company_id, rfc);

CREATE TABLE customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label VARCHAR(100),
  street TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  zip_code VARCHAR(10),
  country VARCHAR(50) DEFAULT 'México',
  is_default BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  rfc VARCHAR(13),
  payment_terms_days INT DEFAULT 0,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_suppliers_company ON suppliers(company_id);

-- ============================================
-- PRODUCTOS
-- ============================================

CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  parent_id UUID REFERENCES product_categories(id),
  sort_order INT DEFAULT 0,
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_categories_company ON product_categories(company_id);

CREATE TABLE product_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE product_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  abbreviation VARCHAR(10) NOT NULL,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE tax_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  rate DECIMAL(5,4) NOT NULL,    -- 0.1600 = 16%
  type VARCHAR(20) DEFAULT 'IVA',
  is_included BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  sku VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES product_categories(id),
  brand_id UUID REFERENCES product_brands(id),
  unit_id UUID REFERENCES product_units(id),
  tax_profile_id UUID REFERENCES tax_profiles(id),
  cost DECIMAL(12,4) DEFAULT 0,
  base_price DECIMAL(12,4) NOT NULL,
  track_stock BOOLEAN DEFAULT true,
  allow_fractions BOOLEAN DEFAULT false,
  min_stock DECIMAL(12,4) DEFAULT 0,
  max_stock DECIMAL(12,4) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_published_online BOOLEAN DEFAULT false,   -- para e-commerce
  image_url TEXT,
  sat_product_code VARCHAR(10),                -- clave SAT para CFDI
  sat_unit_code VARCHAR(10),                   -- clave unidad SAT
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_products_company ON products(company_id);
CREATE INDEX idx_products_sku ON products(company_id, sku);
CREATE INDEX idx_products_name ON products(company_id, name);
CREATE INDEX idx_products_category ON products(company_id, category_id);
CREATE INDEX idx_products_brand ON products(company_id, brand_id);

CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  attributes JSONB DEFAULT '{}',   -- {"color": "rojo", "medida": "1/2"}
  cost DECIMAL(12,4),
  price DECIMAL(12,4),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_variants_product ON product_variants(product_id);

CREATE TABLE product_barcodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id),
  barcode VARCHAR(100) NOT NULL,
  type VARCHAR(20) DEFAULT 'EAN13',
  UNIQUE(barcode)
);
CREATE INDEX idx_barcodes_barcode ON product_barcodes(barcode);

CREATE TABLE price_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) DEFAULT 'retail',
  is_default BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE product_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id),
  price_list_id UUID NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
  price DECIMAL(12,4) NOT NULL,
  min_qty DECIMAL(12,4) DEFAULT 1,
  UNIQUE(product_id, variant_id, price_list_id, min_qty)
);

-- ============================================
-- INVENTARIO
-- ============================================

CREATE TABLE stock_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  quantity DECIMAL(12,4) NOT NULL DEFAULT 0,
  reserved_qty DECIMAL(12,4) NOT NULL DEFAULT 0,   -- apartados
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, variant_id, warehouse_id)
);
CREATE INDEX idx_stock_warehouse ON stock_levels(warehouse_id);
CREATE INDEX idx_stock_product ON stock_levels(product_id);

CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  movement_type VARCHAR(30) NOT NULL,  -- entrada_compra, salida_venta, ajuste_positivo, etc.
  quantity DECIMAL(12,4) NOT NULL,     -- positivo=entrada, negativo=salida
  reference_type VARCHAR(30),          -- sale, purchase, adjustment, transfer
  reference_id UUID,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_movements_company ON stock_movements(company_id);
CREATE INDEX idx_movements_product ON stock_movements(product_id);
CREATE INDEX idx_movements_warehouse ON stock_movements(warehouse_id);
CREATE INDEX idx_movements_date ON stock_movements(created_at);

-- ============================================
-- COMPRAS
-- ============================================

CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  folio VARCHAR(50),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','confirmed','partial','received','cancelled')),
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_total DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  expected_date DATE,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_purchases_company ON purchases(company_id);

CREATE TABLE purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  quantity DECIMAL(12,4) NOT NULL,
  received_qty DECIMAL(12,4) DEFAULT 0,
  unit_cost DECIMAL(12,4) NOT NULL,
  tax_rate DECIMAL(5,4) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL
);

CREATE TABLE purchase_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  received_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE purchase_receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES purchase_receipts(id) ON DELETE CASCADE,
  purchase_item_id UUID NOT NULL REFERENCES purchase_items(id),
  quantity_received DECIMAL(12,4) NOT NULL
);

-- ============================================
-- VENTAS
-- ============================================

CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id),
  cash_register_id UUID REFERENCES cash_registers(id),
  cash_session_id UUID,   -- FK added after cash_sessions table
  customer_id UUID REFERENCES customers(id),
  folio VARCHAR(50),
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('draft','suspended','completed','cancelled','returned')),
  price_list_id UUID REFERENCES price_lists(id),
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_total DECIMAL(12,2) DEFAULT 0,
  tax_total DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  source VARCHAR(20) DEFAULT 'pos',  -- pos, quotation, online
  source_id UUID,                     -- quotation_id or ecommerce order id
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_sales_company ON sales(company_id);
CREATE INDEX idx_sales_branch ON sales(branch_id);
CREATE INDEX idx_sales_date ON sales(created_at);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_folio ON sales(company_id, folio);

CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  quantity DECIMAL(12,4) NOT NULL,
  unit_price DECIMAL(12,4) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  tax_rate DECIMAL(5,4) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL
);

-- ============================================
-- COTIZACIONES
-- ============================================

CREATE TABLE quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id),
  customer_id UUID REFERENCES customers(id),
  folio VARCHAR(50),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','sent','accepted','converted','expired','cancelled')),
  subtotal DECIMAL(12,2) DEFAULT 0,
  discount_total DECIMAL(12,2) DEFAULT 0,
  tax_total DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  valid_until DATE,
  notes TEXT,
  converted_sale_id UUID REFERENCES sales(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE quotation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  quantity DECIMAL(12,4) NOT NULL,
  unit_price DECIMAL(12,4) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  tax_rate DECIMAL(5,4) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL
);

-- ============================================
-- APARTADOS
-- ============================================

CREATE TABLE layaways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  folio VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','completed','cancelled','expired')),
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_total DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  remaining DECIMAL(12,2) DEFAULT 0,
  expires_at DATE,
  notes TEXT,
  converted_sale_id UUID REFERENCES sales(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE layaway_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layaway_id UUID NOT NULL REFERENCES layaways(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  quantity DECIMAL(12,4) NOT NULL,
  unit_price DECIMAL(12,4) NOT NULL,
  total DECIMAL(12,2) NOT NULL
);

CREATE TABLE layaway_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layaway_id UUID NOT NULL REFERENCES layaways(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  payment_method_id UUID,
  reference VARCHAR(100),
  received_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- PAGOS
-- ============================================

CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('cash','card','transfer','check','credit')),
  is_active BOOLEAN DEFAULT true,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES sales(id),
  payment_method_id UUID NOT NULL REFERENCES payment_methods(id),
  amount DECIMAL(12,2) NOT NULL,
  reference VARCHAR(100),
  cash_session_id UUID,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_payments_sale ON payments(sale_id);
CREATE INDEX idx_payments_session ON payments(cash_session_id);

-- ============================================
-- CAJA
-- ============================================

CREATE TABLE cash_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id),
  cash_register_id UUID NOT NULL REFERENCES cash_registers(id),
  opened_by UUID NOT NULL REFERENCES auth.users(id),
  closed_by UUID REFERENCES auth.users(id),
  opening_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  expected_amount DECIMAL(12,2) DEFAULT 0,
  counted_amount DECIMAL(12,2),
  difference DECIMAL(12,2),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open','closed')),
  opened_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ,
  notes TEXT
);
CREATE INDEX idx_sessions_company ON cash_sessions(company_id);
CREATE INDEX idx_sessions_register ON cash_sessions(cash_register_id);

-- Add FK from sales to cash_sessions
ALTER TABLE sales ADD CONSTRAINT fk_sales_cash_session 
  FOREIGN KEY (cash_session_id) REFERENCES cash_sessions(id);

CREATE TABLE cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cash_session_id UUID NOT NULL REFERENCES cash_sessions(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('sale','expense','withdrawal','deposit','refund')),
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  reference_type VARCHAR(30),
  reference_id UUID,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- DEVOLUCIONES
-- ============================================

CREATE TABLE returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  sale_id UUID NOT NULL REFERENCES sales(id),
  folio VARCHAR(50),
  reason TEXT,
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_total DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  refund_method VARCHAR(20),   -- cash, credit_note, original_method
  status VARCHAR(20) DEFAULT 'completed',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE return_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  sale_item_id UUID NOT NULL REFERENCES sale_items(id),
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  quantity DECIMAL(12,4) NOT NULL,
  unit_price DECIMAL(12,4) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  return_to_stock BOOLEAN DEFAULT true,
  warehouse_id UUID REFERENCES warehouses(id)
);

-- ============================================
-- TRASPASOS
-- ============================================

CREATE TABLE stock_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  folio VARCHAR(50),
  from_warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  to_warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','in_transit','received','cancelled')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  received_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  received_at TIMESTAMPTZ
);

CREATE TABLE stock_transfer_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID NOT NULL REFERENCES stock_transfers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  quantity DECIMAL(12,4) NOT NULL,
  received_qty DECIMAL(12,4) DEFAULT 0
);

-- ============================================
-- AJUSTES DE INVENTARIO
-- ============================================

CREATE TABLE stock_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  folio VARCHAR(50),
  reason VARCHAR(255),
  notes TEXT,
  status VARCHAR(20) DEFAULT 'applied',
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE stock_adjustment_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adjustment_id UUID NOT NULL REFERENCES stock_adjustments(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  previous_qty DECIMAL(12,4) NOT NULL,
  new_qty DECIMAL(12,4) NOT NULL,
  difference DECIMAL(12,4) NOT NULL
);

-- ============================================
-- FACTURACIÓN (PREPARACIÓN - NO TIMBRADO)
-- ============================================

CREATE TABLE invoice_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id),
  series VARCHAR(10) NOT NULL,
  current_folio INT DEFAULT 0,
  type VARCHAR(20) DEFAULT 'invoice',  -- invoice, credit_note
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES sales(id),
  series VARCHAR(10),
  folio INT,
  customer_id UUID REFERENCES customers(id),
  -- Datos fiscales emisor (snapshot)
  issuer_rfc VARCHAR(13),
  issuer_legal_name VARCHAR(255),
  issuer_tax_regime VARCHAR(10),
  issuer_zip_code VARCHAR(10),
  -- Datos fiscales receptor (snapshot)
  receiver_rfc VARCHAR(13),
  receiver_legal_name VARCHAR(255),
  receiver_tax_regime VARCHAR(10),
  receiver_cfdi_use VARCHAR(10),
  receiver_zip_code VARCHAR(10),
  -- Totales
  subtotal DECIMAL(12,2),
  tax_total DECIMAL(12,2),
  total DECIMAL(12,2),
  currency VARCHAR(3) DEFAULT 'MXN',
  -- CFDI (futuro)
  uuid_fiscal VARCHAR(36),    -- UUID del timbre (futuro)
  xml_url TEXT,
  pdf_url TEXT,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','stamped','cancelled')),
  stamped_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason VARCHAR(10),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  description TEXT NOT NULL,
  quantity DECIMAL(12,4) NOT NULL,
  unit_price DECIMAL(12,4) NOT NULL,
  sat_product_code VARCHAR(10),
  sat_unit_code VARCHAR(10),
  discount DECIMAL(12,2) DEFAULT 0,
  tax_base DECIMAL(12,2),
  tax_type VARCHAR(10),         -- 002 = IVA
  tax_rate DECIMAL(5,4),
  tax_amount DECIMAL(12,2),
  total DECIMAL(12,2)
);

-- ============================================
-- SERIES Y FOLIOS (GENERAL)
-- ============================================

CREATE TABLE document_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id),
  entity_type VARCHAR(30) NOT NULL,  -- sale, purchase, quotation, layaway, adjustment, transfer, return
  prefix VARCHAR(10) NOT NULL,
  current_folio INT DEFAULT 0,
  UNIQUE(company_id, branch_id, entity_type)
);

-- ============================================
-- AUDITORÍA
-- ============================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(50) NOT NULL,      -- create, update, delete, login, logout, open_cash, close_cash, cancel_sale, etc.
  entity_type VARCHAR(50) NOT NULL, -- sale, product, cash_session, etc.
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_audit_company ON audit_logs(company_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_date ON audit_logs(created_at);
CREATE INDEX idx_audit_user ON audit_logs(user_id);

-- ============================================
-- NOTIFICACIONES
-- ============================================

CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  type VARCHAR(50) NOT NULL,     -- low_stock, payment_due, layaway_expiring, subscription_expiring
  title VARCHAR(255) NOT NULL,
  message TEXT,
  entity_type VARCHAR(50),
  entity_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_notifications_user ON notification_logs(user_id, is_read);

-- ============================================
-- SUSCRIPCIONES SAAS
-- ============================================

CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2),
  stripe_product_id VARCHAR(100),
  stripe_price_monthly_id VARCHAR(100),
  stripe_price_yearly_id VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE plan_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  feature_key VARCHAR(50) NOT NULL,    -- max_branches, max_users, max_products, max_warehouses
  limit_value INT NOT NULL,            -- -1 = unlimited
  UNIQUE(plan_id, feature_key)
);

CREATE TABLE plan_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  module_key VARCHAR(50) NOT NULL,     -- layaways, transfers, reports_advanced, ecommerce
  is_enabled BOOLEAN DEFAULT false,
  UNIQUE(plan_id, module_key)
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  plan_id UUID NOT NULL REFERENCES plans(id),
  stripe_subscription_id VARCHAR(100),
  stripe_customer_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('trialing','active','past_due','cancelled','suspended')),
  billing_cycle VARCHAR(20) DEFAULT 'monthly',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- E-COMMERCE INTEGRACIÓN (OPCIONAL)
-- ============================================

CREATE TABLE ecommerce_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL DEFAULT 'evershop',
  api_url TEXT,
  api_key_ref VARCHAR(100),     -- reference to secret, not the key itself
  is_active BOOLEAN DEFAULT false,
  sync_products BOOLEAN DEFAULT true,
  sync_stock BOOLEAN DEFAULT true,
  sync_prices BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ecommerce_product_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES ecommerce_integrations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  external_id VARCHAR(100),
  sync_status VARCHAR(20) DEFAULT 'pending',
  last_synced_at TIMESTAMPTZ,
  UNIQUE(integration_id, product_id)
);

CREATE TABLE ecommerce_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES ecommerce_integrations(id) ON DELETE CASCADE,
  direction VARCHAR(10) NOT NULL,   -- push, pull
  entity_type VARCHAR(50),
  entity_id UUID,
  status VARCHAR(20),
  error_message TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ecommerce_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES ecommerce_integrations(id),
  external_order_id VARCHAR(100),
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  total DECIMAL(12,2),
  status VARCHAR(20) DEFAULT 'pending',   -- pending, processing, converted, cancelled
  converted_sale_id UUID REFERENCES sales(id),
  order_data JSONB,
  received_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);
```

### Clasificación de tablas

| Capa | Tablas |
|---|---|
| **Núcleo POS** | companies, branches, warehouses, cash_registers, products, product_*, stock_*, sales, sale_items, purchases, purchase_*, quotations, quotation_items, layaways, layaway_*, payments, payment_methods, cash_sessions, cash_movements, returns, return_items, stock_transfers, stock_adjustments, document_series |
| **Seguridad** | user_profiles, company_users, roles, permissions, role_permissions, audit_logs |
| **Configuración SaaS** | plans, plan_features, plan_modules, subscriptions |
| **Fiscal (preparación)** | tax_profiles, invoice_series, invoices, invoice_items |
| **E-commerce (opcional)** | ecommerce_integrations, ecommerce_product_mappings, ecommerce_sync_logs, ecommerce_orders |
| **Soporte** | customers, customer_*, suppliers, notification_logs |

---

# 7. MULTI-TENANT + RLS

## 7.1 Modelo de Relación

```
Company (tenant)
├── Branches (sucursales)
│   ├── Warehouses (almacenes)
│   └── Cash Registers (cajas)
├── Company Users (usuarios asignados)
│   ├── User Profile (auth.users)
│   └── Role → Permissions
├── Products, Customers, Suppliers, etc.
└── Subscription → Plan → Features/Modules
```

## 7.2 Reglas de Segregación

| Columna | Propósito | Tablas que la llevan |
|---|---|---|
| `company_id` | Segregación por empresa (obligatorio en casi todas las tablas) | Todas excepto user_profiles, permissions, plans |
| `branch_id` | Filtro por sucursal (operaciones) | sales, purchases, quotations, layaways, cash_sessions, warehouses, cash_registers |
| `warehouse_id` | Filtro por almacén (inventario) | stock_levels, stock_movements, sale_items, purchase_receipts, stock_transfers |
| `created_by` | Quién creó el registro | Todas las transaccionales |
| `updated_by` | Quién modificó | products, purchases, sales |

## 7.3 Usuarios Multi-Sucursal

Un usuario puede operar en varias sucursales mediante `company_users.branch_ids[]` (array de UUIDs). El frontend presenta un selector de sucursal activa y las queries filtran por la sucursal seleccionada.

## 7.4 Políticas RLS Conceptuales

### Función auxiliar (SECURITY DEFINER)

```sql
-- Obtener company_id del usuario actual
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM company_users 
  WHERE user_id = auth.uid() AND is_active = true 
  LIMIT 1
$$;

-- Verificar si tiene rol específico
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM company_users cu
    JOIN roles r ON r.id = cu.role_id
    WHERE cu.user_id = _user_id AND r.name = _role::text AND cu.is_active = true
  )
$$;

-- Verificar permiso
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _module TEXT, _action TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM company_users cu
    JOIN role_permissions rp ON rp.role_id = cu.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE cu.user_id = _user_id 
      AND cu.is_active = true
      AND p.module = _module 
      AND p.action = _action
  )
$$;

-- Verificar si es superadmin SaaS
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM company_users 
    WHERE user_id = auth.uid() 
      AND role_id IN (SELECT id FROM roles WHERE name = 'superadmin' AND is_system = true)
  )
$$;
```

### Políticas por tipo de operación

**SELECT — Solo datos de tu empresa:**
```sql
CREATE POLICY "Users see own company data" ON products
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id() AND deleted_at IS NULL);
```

**INSERT — Solo en tu empresa con permiso:**
```sql
CREATE POLICY "Users create in own company" ON products
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.get_user_company_id() 
    AND public.has_permission(auth.uid(), 'products', 'create')
  );
```

**UPDATE — Solo tu empresa con permiso:**
```sql
CREATE POLICY "Users update own company" ON products
  FOR UPDATE TO authenticated
  USING (company_id = public.get_user_company_id())
  WITH CHECK (public.has_permission(auth.uid(), 'products', 'update'));
```

**DELETE lógico** — No se permite DELETE físico. Solo UPDATE de `deleted_at`:
```sql
-- No crear política DELETE. Solo UPDATE con deleted_at.
```

**Superadmin SaaS — Ve todo:**
```sql
CREATE POLICY "Superadmin full access" ON companies
  FOR ALL TO authenticated
  USING (public.is_superadmin());
```

**Restricción por sucursal (transacciones):**
```sql
CREATE POLICY "Users see own branch sales" ON sales
  FOR SELECT TO authenticated
  USING (
    company_id = public.get_user_company_id()
    AND (
      branch_id = ANY(
        (SELECT branch_ids FROM company_users WHERE user_id = auth.uid() AND is_active = true LIMIT 1)
      )
      OR public.has_permission(auth.uid(), 'sales', 'read_all_branches')
    )
  );
```

## 7.5 Eventos que DEBEN auditarse

| Evento | Entidad | Datos a guardar |
|---|---|---|
| Login / Logout | auth | user_id, ip, timestamp |
| Crear/editar producto | product | old_data, new_data |
| Cambio de precio | product_prices | old_price, new_price, who |
| Venta completada | sale | total, items_count, payment_methods |
| Venta cancelada | sale | reason, who |
| Devolución | return | sale_id, amount, items |
| Apertura de caja | cash_session | opening_amount, who |
| Cierre/corte de caja | cash_session | expected, counted, difference |
| Gasto de caja | cash_movement | amount, description |
| Ajuste de inventario | stock_adjustment | items, quantities, reason |
| Traspaso | stock_transfer | from, to, items |
| Descuento manual | sale_items | discount_percent, reason, who |
| Cambio de rol/permisos | company_users / role_permissions | old, new |
| Suscripción cambiada | subscription | old_plan, new_plan |

---

# 8. FLUJOS CRÍTICOS

## Flujo 1: Alta de Empresa SaaS

**Actor:** Nuevo usuario  
**Precondiciones:** Ninguna  
**Pasos:**
1. Usuario se registra (email + password + hCaptcha)
2. Confirma email
3. Se crea `user_profile`
4. Se presenta pantalla de onboarding: nombre empresa, giro, RFC (opcional)
5. Edge Function crea: `company`, `branch` (principal), `warehouse` (principal), `cash_register` (Caja 1)
6. Se crea `company_user` con rol `owner`
7. Se crea `subscription` en plan trial/free
8. Se crean catálogos default (métodos de pago, unidades básicas, tax_profile IVA 16%)
9. Redirect a `/dashboard`

**Validaciones:** Email único, nombre empresa no vacío, slug único  
**Auditoría:** company_created, user_registered

## Flujo 10: Venta en Mostrador

**Actor:** Cajero  
**Precondiciones:** Sesión de caja abierta, productos en catálogo con stock  
**Pasos:**
1. Cajero abre POS (`/pos`)
2. Sistema verifica sesión de caja activa → si no hay, forzar apertura
3. Buscar producto (F2): por nombre, SKU o código de barras
4. Sistema muestra resultados con precio según lista activa y stock disponible
5. Seleccionar producto → se agrega al ticket con qty=1
6. Repetir para más productos
7. Opcionalmente: seleccionar cliente (F4), cambiar lista de precios, aplicar descuento
8. Presionar Cobrar (F12)
9. Se abre modal de cobro: total, seleccionar método de pago, ingresar monto
10. Si efectivo: calcular cambio
11. Si mixto: registrar cada método con su monto
12. Confirmar cobro
13. Edge Function (o RPC):
    a. Generar folio (incrementar `document_series`)
    b. Insertar `sale` + `sale_items`
    c. Insertar `payments`
    d. Descontar stock (`stock_levels.quantity -= qty`)
    e. Registrar `stock_movements` (salida_venta)
    f. Registrar `cash_movements` en la sesión activa
    g. Insertar `audit_log`
14. Mostrar ticket para impresión
15. Limpiar pantalla POS

**Validaciones:**
- Stock suficiente (si `track_stock = true`)
- Sesión de caja abierta
- Precio > 0
- Cantidad > 0
- Total de pagos ≥ total de venta
- Permisos de descuento si aplica

**Errores:**
- Stock insuficiente → alerta, no permite venta del producto
- Sin sesión de caja → redirigir a apertura
- Falla de red → ticket queda en estado `draft` local, reintentar

## Flujo 11: Cobro Mixto

**Actor:** Cajero  
**Precondiciones:** Ticket con productos, modal de cobro abierto  
**Pasos:**
1. Mostrar total a cobrar
2. Cajero selecciona primer método (ej: tarjeta $500)
3. Ingresar monto → se muestra restante
4. Seleccionar segundo método (ej: efectivo $350)
5. Ingresar monto → restante = $0
6. Si efectivo y monto > restante → calcular cambio
7. Confirmar → se generan 2 registros en `payments`

## Flujo 12: Cotización a Venta

**Actor:** Vendedor  
**Precondiciones:** Cotización en estado `draft` o `sent`  
**Pasos:**
1. Abrir cotización
2. Verificar vigencia
3. Clic "Convertir a venta"
4. Sistema copia items al POS como nuevo ticket
5. Verificar stock actual (puede haber cambiado desde cotización)
6. Proceder a cobro normal
7. Al completar: actualizar `quotation.status = 'converted'`, guardar `converted_sale_id`
8. Auditar conversión

## Flujo 17: Apertura de Caja

**Actor:** Cajero  
**Precondiciones:** Caja asignada, sin sesión abierta  
**Pasos:**
1. Cajero entra a `/pos` o `/cash-register`
2. Sistema detecta que no hay sesión abierta para esta caja
3. Modal de apertura: seleccionar caja, ingresar fondo inicial
4. Crear `cash_session` con `opening_amount` y `status = 'open'`
5. Auditar apertura
6. Cajero puede comenzar a vender

## Flujo 18: Corte de Caja

**Actor:** Cajero/Supervisor  
**Precondiciones:** Sesión de caja abierta  
**Pasos:**
1. Cajero solicita corte
2. Sistema calcula `expected_amount`:
   - opening_amount + sum(ventas_efectivo) - sum(gastos) - sum(retiros) + sum(entradas)
3. Cajero ingresa `counted_amount` (efectivo contado)
4. Sistema calcula `difference = counted_amount - expected_amount`
5. Si diferencia ≠ 0: mostrar advertencia, cajero debe agregar nota
6. Confirmar corte
7. `cash_session.status = 'closed'`, guardar montos y notas
8. Generar resumen imprimible
9. Auditar corte

## Flujo 20: Suscripción SaaS (Stripe)

**Actor:** Dueño/Admin  
**Precondiciones:** Empresa activa  
**Pasos:**
1. Ir a `/subscription`
2. Ver plan actual y límites
3. Clic "Cambiar plan"
4. Mostrar planes disponibles con precios y features
5. Seleccionar plan → redirigir a Stripe Checkout
6. Stripe procesa pago
7. Webhook (Edge Function) recibe `checkout.session.completed`
8. Actualizar `subscription` con nuevo plan, `stripe_subscription_id`, periodo
9. Actualizar `company.status` si estaba suspendida
10. Auditar cambio de plan

## Flujo 21: Suspensión por Falta de Pago

**Actor:** Sistema (webhook)  
**Pasos:**
1. Stripe envía `invoice.payment_failed` o `customer.subscription.updated` con `past_due`
2. Edge Function actualiza `subscription.status = 'past_due'`
3. Crear notificación al owner
4. Después de X días grace period → `subscription.status = 'suspended'`, `company.status = 'suspended'`
5. En frontend: pantalla de bloqueo con mensaje y botón para actualizar pago
6. Solo permite acceso a `/subscription` para regularizar

## Flujos restantes (resumen de pasos clave)

| Flujo | Actor | Resultado |
|---|---|---|
| 2. Crear sucursal | Admin | Nueva branch + warehouse default |
| 3. Crear almacén | Admin | Nuevo warehouse vinculado a branch |
| 4. Alta de caja | Admin | Nuevo cash_register vinculado a branch |
| 5. Alta de usuario | Admin | Invitar por email, asignar rol y sucursales |
| 6. Alta de producto | Admin/Supervisor | Crear product + variantes + precios + barcodes |
| 7. Compra a proveedor | Comprador | Crear purchase con items, enviar a proveedor |
| 8. Recepción | Almacenista | Registrar cantidades recibidas vs pedidas |
| 9. Entrada a inventario | Sistema | stock_levels += received_qty, crear stock_movements |
| 13. Apartado | Cajero | Crear layaway, reservar stock, registrar anticipo |
| 14. Devolución | Cajero | Crear return, reingresar stock, generar reembolso |
| 15. Ajuste | Almacenista | Registrar diferencias de conteo, auditar |
| 16. Traspaso | Almacenista | Crear transfer, descontar origen, sumar destino |

---

# 9. INTEGRACIÓN OPCIONAL CON EVERSHOP

## 9.1 Qué SÍ Resuelve EverShop

| Función | Valor |
|---|---|
| Storefront web responsive | Catálogo atractivo para clientes finales |
| Carrito y checkout | Experiencia de compra en línea estándar |
| SEO y rendimiento web | Optimización para buscadores |
| Portal B2B/B2C | Pedidos en línea con precios segmentados |

## 9.2 Qué NO Debe Resolver EverShop

| Función | Por qué NO |
|---|---|
| Gestión de inventario | El POS es la fuente de verdad de stock |
| Precios maestros | Se definen en el POS, se publican al e-commerce |
| Clientes y datos fiscales | El POS gestiona la relación completa |
| Facturación | No es función de un storefront |
| Caja y cortes | Operación física, no aplica |
| Compras a proveedor | Proceso interno del negocio |

## 9.3 Fuente de Verdad

| Dato | Fuente de verdad | Dirección de sync |
|---|---|---|
| Productos y catálogo | **POS** | POS → EverShop (push) |
| Precios | **POS** | POS → EverShop (push) |
| Stock disponible | **POS** | POS → EverShop (push, solo disponible publicado) |
| Pedidos online | **EverShop** (los crea) → **POS** (los procesa) | EverShop → POS (pull/webhook) |
| Clientes registrados online | EverShop los crea → POS los importa | EverShop → POS (pull) |
| Pagos online | EverShop (Stripe directo) | Se notifica al POS |

## 9.4 Arquitectura de Integración

```
┌──────────────┐         ┌──────────────────┐
│   POS SaaS   │────────>│   Edge Function   │
│  (fuente de  │  push   │  /sync-products   │──── API ───>  EverShop
│   verdad)    │<────────│  /receive-orders  │<─── webhook ─  (storefront)
└──────────────┘  pull   └──────────────────┘
```

- **Push (POS → EverShop):** Edge Function programada o manual que envía productos con `is_published_online = true`, precios de lista pública, y stock disponible (no reservado).
- **Pull (EverShop → POS):** Webhook o polling que trae nuevos pedidos como `ecommerce_orders` con status `pending`. Un operador los convierte en ventas.

## 9.5 Reglas de Desacoplamiento

1. Si EverShop se cae, el POS sigue operando al 100%
2. Si la sincronización falla, se loguea el error y se reintenta — nunca bloquea operaciones del POS
3. Los pedidos online entran como "órdenes pendientes" — no se procesan automáticamente sin intervención humana
4. Stock publicado puede tener un "buffer" configurable (publicar 90% del stock real para evitar sobre-venta)
5. Precios en e-commerce se toman de una lista de precios específica para canal online
6. Promociones del e-commerce NO afectan precios del POS físico

---

# 10. UX/UI

## 10.1 Layout Principal

```
┌─────────────────────────────────────────────────┐
│ TopBar: Logo | Empresa/Sucursal | Notificaciones | Avatar │
├──────────┬──────────────────────────────────────┤
│          │                                      │
│ Sidebar  │       Main Content Area              │
│ (nav)    │       (React Router outlet)          │
│          │                                      │
│ • Dashboard                                     │
│ • POS                                           │
│ • Ventas                                        │
│ • Cotizaciones                                  │
│ • Compras                                       │
│ • Inventario                                    │
│ • Productos                                     │
│ • Clientes                                      │
│ • Proveedores                                   │
│ • Caja                                          │
│ • Reportes                                      │
│ • Config                                        │
│          │                                      │
└──────────┴──────────────────────────────────────┘
```

- **Sidebar:** Colapsable, iconos con labels, agrupado por secciones. shadcn `Sidebar` component.
- **TopBar:** Company/branch selector (dropdown), notifications bell, user avatar con dropdown (perfil, cerrar sesión).
- **POS:** Layout especial sin sidebar — pantalla completa con panel de búsqueda (izquierda) y ticket (derecha).

## 10.2 Patrones de Componentes

### Tablas (DataTable)

```tsx
// Patrón estándar para listas
<DataTable
  columns={columns}           // TanStack Table column defs
  data={data}
  isLoading={isLoading}
  emptyState={<EmptyState icon={Package} message="No hay productos" action={<Button>Crear producto</Button>} />}
  searchPlaceholder="Buscar por nombre, SKU..."
  filters={<Filters />}       // Dropdowns, date range
  actions={<Button>Nuevo</Button>}
  pagination={pagination}
/>
```

### Formularios

```tsx
// React Hook Form + Zod
const schema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  sku: z.string().optional(),
  price: z.number().positive("Precio debe ser mayor a 0"),
});

// Form layout: 2 columnas en desktop, 1 en mobile
// Buttons: Guardar (primary) | Cancelar (outline) — siempre al final
// Validación en tiempo real, mensajes en español
```

### Modales y Confirmaciones

```tsx
// Para acciones destructivas o irreversibles
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Cancelar venta</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>¿Cancelar esta venta?</AlertDialogTitle>
      <AlertDialogDescription>
        Esta acción no se puede deshacer. El stock se reingresará al inventario.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>No, volver</AlertDialogCancel>
      <AlertDialogAction>Sí, cancelar venta</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Feedback Visual

| Acción | Feedback |
|---|---|
| Guardado exitoso | Toast (Sonner) verde, auto-dismiss 3s |
| Error | Toast rojo persistente con botón reintentar |
| Acción destructiva | AlertDialog con confirmación explícita |
| Loading | Skeleton en tablas, Spinner en botones |
| Empty state | Ilustración + texto + CTA |
| Validación form | Mensajes inline debajo del campo en rojo |

## 10.3 Consideraciones POS

- **Optimizado para teclado:** Todo el flujo de venta debe poder hacerse sin mouse
- **Fuentes grandes** en precios y totales (text-2xl a text-4xl)
- **Colores semánticos:** Verde = cobrado/exitoso, Amarillo = pendiente, Rojo = cancelado
- **Búsqueda instantánea:** Debounce 200ms, resultados en dropdown
- **Código de barras:** Integración con lectores USB (input auto-detect)
- **Responsive:** Desktop first, adaptable a tablet (iPad 10"+). No mobile para POS.
- **Impresión:** Generar HTML de ticket optimizado para impresoras térmicas 80mm, usar `window.print()` con CSS print.

## 10.4 Accesibilidad

- Labels en todos los inputs
- Focus visible en todos los controles interactivos
- aria-labels en botones con solo iconos
- Contraste mínimo 4.5:1
- Navegación completa por teclado
- Mensajes de error asociados al campo (aria-describedby)

---

# 11. SEGURIDAD Y CALIDAD

## 11.1 Checklist de Producción

### TypeScript y Código

- [ ] `strict: true` en tsconfig
- [ ] ESLint con reglas de React Hooks y TypeScript
- [ ] Zod para validación en frontend y Edge Functions
- [ ] No `any` types (enforce con ESLint rule)
- [ ] No `console.log` / `debugger` en producción (ESLint rule + Vite strip)

### Seguridad

- [ ] RLS activo en TODAS las tablas con datos de empresa
- [ ] `company_id` en todas las queries — nunca acceso cruzado
- [ ] Edge Functions validan JWT en código
- [ ] Edge Functions validan input con Zod
- [ ] Secretos en Lovable Cloud Secrets — nunca en código
- [ ] hCaptcha en login y registro
- [ ] Rate limiting en edge functions críticas
- [ ] CORS configurado correctamente
- [ ] No ejecutar SQL raw — solo typed client APIs

### Datos e Inventario

- [ ] Transacciones atómicas para ventas (sale + items + payments + stock en una operación)
- [ ] Verificación de stock ANTES de completar venta (en edge function, no solo frontend)
- [ ] Bloqueo optimista o pesimista para evitar doble venta del mismo stock
- [ ] Soft delete en lugar de delete físico
- [ ] Auditoría de movimientos financieros y de inventario
- [ ] Folios secuenciales sin huecos (usar `FOR UPDATE` en document_series)

### Permisos

- [ ] Verificar permisos en frontend (UI) Y backend (RLS/Edge Functions)
- [ ] No confiar en frontend para control de acceso
- [ ] Roles almacenados en tabla separada (nunca en user profile)
- [ ] Superadmin solo configurable por sistema

### Performance

- [ ] Lazy loading de rutas (`React.lazy` + `Suspense`)
- [ ] Code splitting por feature
- [ ] React Query con `staleTime` apropiado por tipo de dato
- [ ] Paginación server-side para tablas con >100 registros
- [ ] Índices en columnas de búsqueda y filtro
- [ ] Debounce en búsquedas

### Testing

- [ ] Vitest para lógica de negocio, hooks, utils
- [ ] Playwright para flujos críticos (login, venta, cobro, corte de caja)
- [ ] Tests de RLS policies
- [ ] Tests de edge functions

### Monitoreo

- [ ] Error boundary global en React
- [ ] Logging de errores en edge functions
- [ ] Alertas de stock negativo (nunca debería pasar)
- [ ] Alerta de diferencias en corte de caja > umbral
- [ ] Monitoreo de suscripciones vencidas

---

# 12. ROADMAP POR FASES

## Fase 0: Descubrimiento y Arquitectura (1-2 semanas)

**Objetivo:** Definir y documentar la arquitectura completa  
**Entregables:**
- Documento de arquitectura (este documento)
- Estructura de carpetas del proyecto
- Design system (tokens, componentes base)
- Schema de base de datos inicial
- Configuración de ESLint, TypeScript strict, Vitest, Playwright

**Criterios de salida:** Proyecto compila sin errores, estructura lista, design system implementado

## Fase 1: Base Técnica y Multi-Tenant (2-3 semanas)

**Objetivo:** Auth, multi-tenant, roles y permisos  
**Entregables:**
- Login / registro / recuperar contraseña
- Onboarding: crear empresa
- Tablas: companies, branches, warehouses, cash_registers, user_profiles, company_users, roles, permissions, role_permissions
- RLS policies base
- Layout principal (sidebar + topbar)
- Selector de empresa/sucursal
- Auditoría base (audit_logs)
- Edge function para onboarding (crear empresa + datos default)

**Dependencias:** Lovable Cloud habilitado  
**Riesgos:** RLS recursivo en funciones, performance de funciones SECURITY DEFINER  
**Criterios de salida:** Usuario se registra, crea empresa, ve dashboard vacío, tiene RLS funcionando

## Fase 2: Catálogos Maestros (2 semanas)

**Objetivo:** Catálogos necesarios para operar  
**Entregables:**
- CRUD: categorías, marcas, unidades, métodos de pago, listas de precios, tax_profiles, customer_types, supplier_types
- Tablas + RLS
- Pantallas de configuración
- Importación básica (CSV) para catálogos

**Dependencias:** Fase 1  
**Criterios de salida:** Todos los catálogos operativos con CRUD funcional

## Fase 3: Productos e Inventario (3 semanas)

**Objetivo:** Catálogo de productos completo con control de stock  
**Entregables:**
- CRUD productos con variantes, atributos, barcodes
- Listas de precios por producto
- Stock levels por almacén
- Vista de inventario con filtros
- Búsqueda de productos (nombre, SKU, barcode)

**Dependencias:** Fase 2  
**Criterios de salida:** Productos creados, con stock asignado, buscables por múltiples criterios

## Fase 4: Compras y Entradas (2 semanas)

**Objetivo:** Ciclo completo de compra a proveedor  
**Entregables:**
- CRUD proveedores
- Crear orden de compra
- Recepción de mercancía (parcial y total)
- Entrada automática a inventario
- Stock movements registrados

**Dependencias:** Fase 3  
**Criterios de salida:** Compra creada → recibida → stock actualizado correctamente

## Fase 5: Ventas POS (3-4 semanas)

**Objetivo:** Venta completa en mostrador  
**Entregables:**
- Pantalla POS (layout especial, búsqueda rápida, ticket)
- Agregar productos al ticket
- Seleccionar cliente / público general
- Descuentos por línea y generales
- Cobro (efectivo, tarjeta, mixto)
- Generación de folio
- Desconteo de stock atómico
- Ticket imprimible
- Historial de ventas con filtros
- Detalle de venta
- Cotizaciones con conversión a venta
- Suspender/retomar tickets

**Dependencias:** Fase 3, Fase 1 (caja)  
**Riesgos:** Performance de búsqueda, consistencia de stock, concurrencia  
**Criterios de salida:** Venta end-to-end funcional, stock consistente, ticket generado

## Fase 6: Caja y Cortes (1-2 semanas)

**Objetivo:** Control de caja completo  
**Entregables:**
- Apertura de caja (fondo inicial)
- Gastos de caja con motivo
- Retiros y entradas de efectivo
- Corte de caja (esperado vs contado)
- Historial de cortes
- Impresión de corte

**Dependencias:** Fase 5  
**Criterios de salida:** Apertura → ventas → gastos → corte con diferencia = 0

## Fase 7: Clientes, Proveedores y Cuentas (2 semanas)

**Objetivo:** Gestión completa de contrapartes  
**Entregables:**
- CRUD clientes con datos fiscales
- Direcciones de cliente
- Historial de compras por cliente
- Saldo de cliente (crédito)
- CxC básico
- CxP básico

**Dependencias:** Fase 5  
**Criterios de salida:** Cliente con historial y saldo visible

## Fase 8: Reportes (2 semanas)

**Objetivo:** Reportes operativos y de gestión  
**Entregables:**
- Reporte de ventas (por periodo, sucursal, cajero, producto)
- Reporte de inventario (existencias, valorización, movimientos)
- Reporte de compras
- Reporte de caja
- Reporte de utilidad bruta
- Dashboard mejorado con gráficas (Recharts)

**Dependencias:** Fases 5, 6, 7  
**Criterios de salida:** Reportes generan datos correctos, exportables

## Fase 9: Suscripciones SaaS (2 semanas)

**Objetivo:** Monetización y control de planes  
**Entregables:**
- Planes con features y límites
- Integración Stripe (checkout, webhooks)
- Pantalla de suscripción
- Suspensión/reactivación automática
- Enforcement de límites (max_users, max_products, etc.)
- Panel superadmin SaaS

**Dependencias:** Stripe habilitado, Fase 1  
**Riesgos:** Webhooks, edge cases de billing  
**Criterios de salida:** Empresa puede suscribirse, pagar, upgrade/downgrade, suspensión funciona

## Fase 10: Integración Opcional EverShop (3 semanas)

**Objetivo:** Canal de e-commerce complementario  
**Entregables:**
- Configuración de integración por empresa
- Edge function de sincronización de productos
- Edge function de recepción de pedidos
- Vista de pedidos online en POS
- Conversión de pedido online a venta
- Logs de sincronización
- Buffer de stock configurable

**Dependencias:** Fase 5, EverShop desplegado  
**Riesgos:** Latencia de sync, inconsistencias  
**Criterios de salida:** Producto publicado visible en storefront, pedido online aparece en POS

## Fase 11: Endurecimiento para Producción (2-3 semanas)

**Objetivo:** Listo para usuarios reales  
**Entregables:**
- Tests E2E de flujos críticos (Playwright)
- Tests unitarios de lógica de negocio (Vitest)
- Revisión de RLS policies (test de acceso cruzado)
- Eliminación de console/debugger
- Lazy loading de todas las rutas
- Error boundaries
- Optimización de queries (EXPLAIN)
- Documentación de API interna
- Apartados y abonos (P1)
- Devoluciones (P1)
- Traspasos (P1)
- Ajustes de inventario mejorados

**Criterios de salida:** Checklist de producción 100% completado

---

# 13. RECOMENDACIÓN FINAL DE IMPLEMENTACIÓN

## Qué Construir Primero

1. **Design system + estructura de carpetas** — base de todo
2. **Auth + multi-tenant + roles** — sin esto no hay nada
3. **Catálogos + productos** — sin productos no hay ventas
4. **POS + cobro + caja** — el corazón del sistema
5. **Suscripciones SaaS** — monetización

## Qué Dejar Fuera del MVP

- Apartados y abonos (P1)
- Devoluciones (P1)
- Traspasos entre sucursales (P1)
- CxC / CxP (P1)
- Facturación electrónica (P2 — solo preparar estructura)
- EverShop (P2 — canal complementario)
- Notificaciones push (P2)
- Importación masiva (P2)
- Reportes avanzados (P1)

## Cómo Limitar EverShop

- Solo se activa si la empresa lo contrata (módulo habilitado en plan)
- Sincronización unidireccional POS → EverShop para catálogo/stock
- Pedidos online entran como órdenes pendientes — procesamiento manual
- Falla del e-commerce ≠ falla del POS

## Riesgos Más Importantes

| Riesgo | Mitigación |
|---|---|
| Inconsistencia de stock | Transacciones atómicas en edge functions, verificación server-side |
| Acceso cruzado entre empresas | RLS estricto, tests automatizados de aislamiento |
| Performance en búsqueda de productos | Índices full-text, debounce, paginación |
| Concurrencia en caja | Una sesión por caja, validación antes de cada operación |
| Complejidad de RLS | Funciones SECURITY DEFINER simples, tests de policies |
| Scope creep | Respetar prioridades P0/P1/P2/P3, MVP disciplinado |

## Primeras 5 Acciones Concretas

1. **Habilitar Lovable Cloud** — provisionar backend
2. **Implementar design system** — tokens en index.css, componentes base personalizados
3. **Crear estructura de carpetas** — features/, components/shared/, services/, types/
4. **Implementar auth + onboarding** — registro → crear empresa → dashboard
5. **Crear tablas base** — companies, branches, warehouses, user_profiles, company_users, roles, permissions + RLS

## Secuencia Semanal Recomendada para Iniciar

| Semana | Foco |
|---|---|
| 1 | Design system, estructura, config TypeScript/ESLint |
| 2 | Auth, login, registro, crear empresa (edge function) |
| 3 | Layout principal, sidebar, topbar, selector empresa/sucursal |
| 4 | Roles, permisos, RLS policies base |
| 5-6 | Catálogos maestros (categorías, marcas, unidades, impuestos, métodos de pago) |
| 7-8 | Productos CRUD completo (variantes, precios, barcodes) |
| 9 | Inventario (stock levels, vista por almacén) |
| 10 | Compras + recepción de mercancía |
| 11-12 | POS: pantalla de venta, búsqueda, ticket |
| 13-14 | Cobro, generación de folio, desconteo de stock |
| 15 | Caja: apertura, gastos, corte |
| 16 | Cotizaciones |
| 17-18 | Clientes, proveedores, dashboard con KPIs |
| 19-20 | Suscripciones SaaS + Stripe |

---

## DIFERENCIAS OPERATIVAS POR GIRO

| Aspecto | Ferretería | Refaccionaria | Casa de materiales | Autopartes |
|---|---|---|---|---|
| SKUs típicos | 5,000-20,000 | 10,000-50,000 | 3,000-15,000 | 15,000-80,000 |
| Unidades principales | pza, kg, m, rollo | pza | m³, m², m, saco, bulto, pza | pza |
| Variantes comunes | Medida, color, calibre | Marca, modelo, año, motor | Calibre, acabado, largo | Marca, modelo, año, motor, posición |
| Fracciones | Sí (clavos/kg, cable/m) | Raro | Sí (arena/m³, varilla/m) | Raro |
| Códigos de barras | Parcial | Alto | Bajo | Alto |
| Cotizaciones | Muy frecuente | Frecuente | Muy frecuente (obras) | Frecuente |
| Apartados | Común | Común | Muy común (material para obra) | Común |
| Crédito a clientes | Frecuente (contratistas) | Moderado | Muy frecuente | Moderado |
| Búsqueda | Por nombre popular + código | Por compatibilidad vehículo | Por uso/aplicación | Por compatibilidad vehículo |

**Configurables por giro:**
- Unidades de medida activas
- Permitir fracciones en venta
- Atributos de producto (año, modelo, calibre, etc.)
- Categorías predefinidas por giro
- Listas de precios (menudeo, mayoreo, contratista)
- Reglas de descuento
- Campos de búsqueda priorizados

---

*Documento generado el 2026-04-05. Este documento es la base de trabajo para el desarrollo del POS SaaS. Cada fase debe ejecutarse secuencialmente respetando las dependencias. La arquitectura y las decisiones aquí documentadas son obligatorias y no deben cambiarse sin revisión formal.*
