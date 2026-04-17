# Inventario de pantallas del proyecto (2026-04-15)

## 1) Resumen ejecutivo

- **Total de componentes de pantalla detectados**: **18** archivos `*.tsx` orientados a página.
- **Total de rutas registradas** en el router principal: **18** (incluye ruta comodín `*`).
- **Pantallas autenticadas (ProtectedRoute)**: 11 rutas funcionales.
- **Pantallas públicas de autenticación/recuperación**: 6 rutas.
- **Pantalla de error/ruta no encontrada**: 1 ruta (`*`).

> Fuente base del inventario: `src/App.tsx` (rutas), `src/components/layout/AppSidebar.tsx` (navegación visible por rol), y estructura `src/**/pages/*.tsx`.

---

## 2) Inventario de rutas y pantallas en producción

| Ruta | Pantalla | Archivo | Acceso | Aparece en sidebar | Observaciones |
|---|---|---|---|---|---|
| `/auth/login` | Login | `src/features/auth/pages/LoginPage.tsx` | Público | No | Inicio de sesión |
| `/auth/register` | Registro | `src/features/auth/pages/RegisterPage.tsx` | Público | No | Alta de usuario/cuenta |
| `/auth/forgot-password` | Recuperar contraseña | `src/features/auth/pages/ForgotPasswordPage.tsx` | Público | No | Solicitud de recuperación |
| `/reset-password` | Restablecer contraseña | `src/features/auth/pages/ResetPasswordPage.tsx` | Público | No | Cambio final de contraseña |
| `/auth/select-company` | Seleccionar compañía | `src/features/auth/pages/SelectCompanyPage.tsx` | Público (flujo auth) | No | Selección de contexto empresarial |
| `/onboarding` | Onboarding | `src/features/auth/pages/OnboardingPage.tsx` | Público (flujo auth) | No | Configuración inicial |
| `/` | Dashboard / Inicio | `src/pages/Index.tsx` | Protegido | Sí (`Dashboard`) | Vista principal |
| `/settings` | Configuración de catálogos | `src/features/settings/pages/CatalogsSettingsPage.tsx` | Protegido | Sí (`Configuracion`) | Ajustes del sistema |
| `/products` | Productos | `src/features/products/pages/ProductsPage.tsx` | Protegido | Sí (`Productos`) | Gestión de catálogo |
| `/inventory` | Inventario | `src/features/inventory/pages/InventoryPage.tsx` | Protegido | Sí (`Inventario`) | Stock, kardex, conteos |
| `/suppliers` | Proveedores | `src/features/suppliers/pages/SuppliersPage.tsx` | Protegido | Sí (`Proveedores`) | Gestión de proveedores |
| `/customers` | Clientes | `src/features/customers/pages/CustomersPage.tsx` | Protegido | Sí (`Clientes`) | Gestión de clientes |
| `/purchases` | Compras | `src/features/purchases/pages/PurchasesPage.tsx` | Protegido | Sí (`Compras`) | Flujo de compras |
| `/pos` | Punto de venta | `src/features/pos/pages/POSPage.tsx` | Protegido | Sí (`Punto de Venta`) | Venta, carrito, cobro |
| `/reports` | Reportes | `src/features/reports/pages/ReportsPage.tsx` | Protegido | Sí (`Reportes`) | KPIs y análisis |
| `/cash-register` | Caja | `src/features/cash-register/pages/CashRegisterPage.tsx` | Protegido | Sí (`Caja`) | Apertura/cierre/movimientos |
| `/invoicing` | Facturación | `src/features/invoicing/pages/InvoicingPage.tsx` | Protegido | Sí (`Facturacion`) | CFDI, cancelaciones, envío |
| `*` | Not Found | `src/pages/NotFound.tsx` | Público | No | Fallback de rutas |

---

## 3) Pantallas visibles por menú lateral (sidebar)

El menú lateral operativo de la app autenticada contiene 11 entradas funcionales:

1. Dashboard (`/`)
2. Punto de Venta (`/pos`)
3. Caja (`/cash-register`)
4. Productos (`/products`)
5. Inventario (`/inventory`)
6. Compras (`/purchases`)
7. Clientes (`/customers`)
8. Proveedores (`/suppliers`)
9. Reportes (`/reports`)
10. Facturacion (`/invoicing`)
11. Configuracion (`/settings`)

> Estas entradas se filtran por rol (`admin`, `manager`, `cashier`, etc.) en tiempo de ejecución.

---

## 4) Subpantallas / vistas internas relevantes (no enrutable directo)

Además de las rutas principales, se detectan vistas internas tipo "subpantalla" en features clave:

### POS (`src/features/pos/ui` y `src/features/pos/components`)
- `POSScreen.tsx`
- `POSLayout.tsx`
- `CartView.tsx`
- `ProductSearch.tsx`
- `PaymentModal.tsx`
- `TicketPreview.tsx`
- `TotalsView.tsx`
- `POSCatalog.tsx`
- `POSCart.tsx`

### Inventario (`src/features/inventory/ui`)
- `InventoryTable.tsx`
- `KardexTable.tsx`
- `TransferStockPanel.tsx`
- `StockAlertsPanel.tsx`
- `PhysicalCountPanel.tsx`
- `AdjustInventoryModal.tsx`

### Facturación (`src/features/invoicing/ui`)
- `FacturaTable.tsx`
- `FacturaFilters.tsx`
- `FacturaModal.tsx`
- `FacturaPreview.tsx`
- `CancelFacturaModal.tsx`
- `NotaCreditoModal.tsx`
- `DescargaXMLButton.tsx`
- `DescargarPDFButton.tsx`
- `EnviarEmailButton.tsx`

### Catálogos CRUD (componentes auxiliares)
- Productos: `ProductList.tsx`, `ProductForm.tsx`
- Clientes: `CustomerList.tsx`, `CustomerForm.tsx`
- Proveedores: `SupplierList.tsx`, `SupplierForm.tsx`

---

## 5) Cobertura funcional del inventario

Con base en rutas + subpantallas, el proyecto cubre estas áreas de UI:

- Autenticación y acceso
- Onboarding y selección de empresa
- Dashboard
- Operación comercial (POS, caja)
- Catálogos (productos, clientes, proveedores)
- Inventario y movimientos
- Compras
- Facturación
- Reportes
- Configuración
- Manejo de rutas inválidas

---

## 6) Nota metodológica

Este inventario es **estructural** (basado en código fuente y router actual), no una validación visual/manual de cada pantalla renderizada en runtime. Para una versión 2 del inventario se recomienda agregar:

- estado de completitud por pantalla (MVP / parcial / completa),
- owner responsable,
- prioridad de QA,
- cobertura de pruebas E2E por pantalla.
