# Matriz global, auditoría CRUD / flujo operativo, ronda 1

## Objetivo
Distinguir con claridad la naturaleza real de las pantallas críticas del sistema para evitar diagnósticos equivocados de “CRUD roto” cuando en realidad se trata de flujos operativos o módulos híbridos.

## Resumen general
El sistema no está compuesto por un solo tipo de pantalla.
Hoy conviven al menos tres familias:

1. **CRUD real**
2. **Flujo operativo**
3. **Híbrido**

El problema principal no es únicamente que haya CRUD incompletos.
También hay una separación poco explícita entre administración de entidades y operación diaria.

---

## 1. Productos
### Tipo
CRUD real

### Lectura actual
- Sí funciona como pantalla CRUD base.
- Pero no está completamente cerrada.

### Estado por letra
- **C:** bien
- **R:** bien
- **U:** parcial
- **D:** incierto / riesgoso

### Hueco principal
La edición no cubre todo el alcance operativo percibido del producto, especialmente respecto a inventario.

### Prioridad
Alta

### Documento base
- `docs/products_crud_audit_round_1.md`

---

## 2. Compras
### Tipo
Flujo por estados

### Lectura actual
- No es CRUD administrativo clásico.
- Funciona más como proceso operativo de abastecimiento.

### Estado por letra
- **C:** bien
- **R:** parcial
- **U:** muy parcial
- **D:** reemplazado por cancelación

### Hueco principal
No existe una edición administrativa clara de compras ya creadas, especialmente drafts persistidos.

### Prioridad
Alta

### Documento base
- `docs/purchases_crud_audit_round_1.md`

---

## 3. Inventario
### Tipo
Híbrido operativo

### Lectura actual
- Fuerte para lectura y verificación.
- Las modificaciones ocurren por operaciones especializadas, no por edición CRUD clásica.

### Estado por letra
- **C:** no aplica como create clásico
- **R:** bien
- **U:** funcional por operaciones
- **D:** no aplica

### Hueco principal
Falta una capa administrativa más clara para parámetros de stock, mientras que la operación sí está más consolidada.

### Prioridad
Media-Alta

### Documento base
- `docs/inventory_crud_audit_round_1.md`

---

## 4. Caja
### Tipo
Flujo operativo

### Lectura actual
- No es CRUD.
- Es sesión operativa de apertura, arqueo y cierre.

### Estado por letra
- **C:** sí, como apertura de sesión
- **R:** bien para operación activa, parcial para administración
- **U:** sí, como cierre/arqueo
- **D:** no aplica

### Hueco principal
La operación está razonablemente clara, pero falta una capa administrativa/histórica más explícita y apareció una inconsistencia de arquitectura en la capa de aplicación.

### Prioridad
Media

### Documento base
- `docs/cash_register_crud_audit_round_1.md`

---

## 5. POS
### Tipo
Flujo transaccional

### Lectura actual
- No es CRUD.
- Es una pantalla de venta en tiempo real.

### Estado por letra
- **C:** sí, como venta transaccional
- **R:** bien para operación
- **U:** sí, sobre ticket en curso
- **D:** no aplica como delete clásico

### Hueco principal
El foco no debe estar en CRUD, sino en reglas operativas, precondiciones y eventual separación entre venta operativa y administración posterior de ventas.

### Prioridad
Media

### Documento base
- `docs/pos_crud_audit_round_1.md`

---

## Conclusiones principales

### 1. No todas las pantallas deben evaluarse como CRUD
El error de expectativa es parte del problema.

### 2. El único módulo claramente CRUD de esta ronda es Productos
Y aun así está incompleto.

### 3. Compras, Caja y POS son flujos operativos
Su problema principal no es “falta CRUD”, sino claridad operativa, administración complementaria o edición restringida.

### 4. Inventario es híbrido
Esto explica buena parte de la ambigüedad percibida.

### 5. Hace falta separar mejor dos capas del producto
- **administración**
- **operación**

---

## Prioridad sugerida de remediación
1. **Productos**
2. **Compras**
3. **Inventario**
4. **Caja**
5. **POS**

## Recomendación de siguiente paso
No seguir llamando a todo “CRUD roto”.
Conviene abrir un siguiente documento o sprint de remediación con esta clasificación:
- CRUD incompleto
- flujo operativo con administración faltante
- híbrido confuso

Y desde ahí priorizar con mucha más puntería.
