# Plan de remediación de Productos, ronda 1

## Objetivo
Cerrar el diagnóstico de Productos como módulo CRUD real pero incompleto, distinguiendo claramente:
- lo que debe resolver dentro del propio módulo,
- lo que debe delegar a Inventario u operación,
- y lo que debe comunicar mejor en UX.

---

## Diagnóstico consolidado
Productos sí es el módulo más cercano a un CRUD real.
Pero hoy tiene tres tensiones principales:

1. **Delete riesgoso**
   - Ya se corrigió con política segura mínima.
   - Si hay referencias operativas, el producto se desactiva en lugar de borrarse.

2. **Update conceptualmente borroso**
   - Mezcla catálogo base, precio/costo y onboarding operativo inicial.
   - Esto genera expectativa de que aquí también se administra inventario continuo, pero no es así.

3. **Frontera de módulo poco explícita**
   - No está suficientemente claro para el usuario cuándo está administrando producto,
   - y cuándo ya debería ir a Inventario o POS.

---

## Estado actual por frente

### 1. Create
**Estado:** funcional

### Qué sí logra
- alta de producto,
- barcode principal,
- precio/costo,
- activación,
- opcionalmente stock inicial,
- flag `control_expiration`.

### Riesgo
Medio.
No por fallo técnico grave, sino porque mezcla alta administrativa y onboarding operativo.

---

### 2. Read
**Estado:** funcional

### Qué sí logra
- búsqueda por nombre, SKU o barcode,
- visibilidad de estado activo/inactivo,
- visibilidad de readiness para POS.

### Riesgo
Bajo.

---

### 3. Update
**Estado:** funcional pero ambiguo

### Qué sí logra
- editar catálogo base,
- editar precio/costo,
- editar activación,
- editar `control_expiration`.

### Qué no logra, y no debería prometer
- ajuste continuo de inventario,
- manejo operativo posterior de stock.

### Riesgo
Medio-Alto de confusión funcional.

---

### 4. Delete
**Estado:** remediado mínimamente

### Política actual
- sin referencias: `hard delete`
- con referencias: `is_active = false`

### Riesgo restante
Bajo a Medio.
No por operación, sino por semántica pendiente en auditoría y copy.

---

## Remediaciones sugeridas por prioridad

### Prioridad 1, ya aplicada
#### Delete seguro
- política condicional de eliminación
- feedback más honesto en UI

**Estado:** hecho

---

### Prioridad 2
#### Explicitar frontera entre Productos e Inventario

### Acción recomendada
Ajustar copy/UI para dejar claro que:
- `stock inicial` solo aplica al alta,
- movimientos posteriores se hacen en Inventario,
- Productos no reemplaza Inventario.

### Beneficio
Reduce expectativa falsa y hace más legible el alcance del módulo.

---

### Prioridad 3
#### Refinar semántica de auditoría

### Acción recomendada
Separar eventos como:
- `product.deleted`
- `product.deactivated`

### Beneficio
Mejor trazabilidad funcional y menor ambigüedad en historial.

---

### Prioridad 4
#### Mejorar copy de atributos operativos persistentes

### Acción recomendada
Revisar cómo se presenta `control_expiration`.
No como flujo operativo raro, sino como atributo del producto con efecto posterior en otros módulos.

### Beneficio
Mejor consistencia conceptual.

---

### Prioridad 5
#### Revisar si precio/costo deben seguir viviendo aquí como edición principal

### Lectura actual
Sí, por ahora es razonable mantenerlos aquí.

### Pero conviene vigilar
Si en el futuro hay listas múltiples, vigencias o reglas más complejas, ese frente podría necesitar módulo o UX aparte.

---

## Decisión recomendada
### No expandir Productos hacia gestión operativa continua.

Ese sería el error más probable.
Harían el módulo más confuso en vez de más completo.

La dirección correcta parece ser:
- **Productos = catálogo + preparación comercial mínima + flags base**
- **Inventario = operación de stock**
- **POS = operación de venta**

---

## Definición más honesta del módulo
Si hubiera que nombrarlo funcionalmente, hoy Productos debería sentirse como:

### “Catálogo comercial de productos”
no como:
### “centro total de administración operativa del producto”

---

## Cierre ejecutivo
Productos sí era el mejor candidato a llamarse CRUD incompleto.
Pero después de revisar mejor:
- parte del problema sí era CRUD real,
- y parte era expectativa mal ubicada sobre su frontera con Inventario.

Eso cambia la remediación correcta:
### menos expansión ciega del módulo,
### más claridad de límites y correcciones puntuales.
