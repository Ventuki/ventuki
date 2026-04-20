# Auditoría CRUD, Inventario, ronda 1

## Alcance revisado
- `src/features/inventory/pages/InventoryPage.tsx`
- `src/features/inventory/hooks/useInventory.ts`
- `src/features/inventory/ui/InventoryTable.tsx`
- `src/features/inventory/ui/AdjustInventoryModal.tsx`
- `src/features/inventory/ui/TransferStockPanel.tsx`
- `src/features/inventory/ui/PhysicalCountPanel.tsx`
- `src/features/inventory/services/inventoryService.ts`

## Resumen ejecutivo
Inventario no está planteado como CRUD tradicional de registros editables.
La pantalla funciona más como centro operativo de existencias con tres capas:
- lectura de stock,
- acciones excepcionales,
- flujos especializados de movimiento.

En ese sentido, si alguien espera CRUD clásico de “registro de inventario”, la pantalla sí puede sentirse incompleta.
Pero como módulo operativo, la lógica parece más coherente que en un CRUD administrativo puro.

## C, Create
### Estado
No aplica como create clásico de registro de inventario.

### Qué sí existe
- Ajuste manual de inventario.
- Conteo físico con creación de borrador.
- Transferencia interna.
- Recepción de compras y creación de stock inicial desde otros módulos.

### Observaciones
Inventario no crea “items de stock” manualmente como entidad CRUD típica.
El stock nace o cambia por operaciones.
Eso puede ser correcto por dominio.

### Riesgo
Bajo si está intencionalmente diseñado así.
Medio si el usuario espera alta directa de existencias desde esta pantalla.

## R, Read
### Estado
Funcional y relativamente fuerte.

### Evidencia
- Listado por sucursal/almacén.
- Búsqueda por producto, SKU y barcode indirecto.
- Tabla con stock, reservado, mínimos y máximos.
- Refresco manual explícito.
- Kardex de movimientos.
- Alertas de inventario.

### Observaciones
Esta es probablemente la parte más madura del módulo.
La pantalla sí sirve para leer y verificar operación.

### Riesgo
Bajo.

## U, Update
### Estado
Existe, pero no como update CRUD clásico.

### Qué sí existe
- Ajuste manual de stock.
- Transferencia entre almacenes.
- Conteo físico con publicación de diferencias.

### Observaciones
Aquí “actualizar inventario” ocurre por operación de negocio, no editando un registro de stock inline.
Eso es razonable para dominio retail.

### Huecos detectados
- No existe edición directa de mínimos/máximos desde la tabla, al menos no visible aquí.
- No existe edición inline del registro de stock.
- No se ve manejo administrativo claro de parámetros del stock por producto/almacén.

### Riesgo
Medio.
Como operación sí funciona mejor, pero como administración fina del stock parece incompleto.

## D, Delete
### Estado
No aplica como delete clásico.

### Evidencia
- No existe eliminación de registros de inventario desde esta pantalla.
- Las acciones son correctivas o de movimiento, no de borrado.

### Observaciones
Esto probablemente es correcto.
En inventario normalmente no debe existir “borrar stock” como CRUD duro.
Lo correcto suele ser ajustar, transferir o conciliar.

### Riesgo
Bajo.

## Hallazgos prioritarios

### 1. Inventario es un módulo operativo, no CRUD puro
Prioridad: Alta de claridad conceptual
- Si se evalúa como CRUD clásico, parecerá incompleto.
- Si se evalúa como centro operativo de stock, su diseño tiene más sentido.

### 2. Falta una capa administrativa clara para parámetros del stock
Prioridad: Media-Alta
- No se ve edición clara de mínimos/máximos o configuración por producto/almacén.
- Eso puede generar sensación de CRUD incompleto aunque la operación principal funcione.

### 3. Ajuste manual requiere buen criterio del operador
Prioridad: Media
- Está bien advertido en UI, pero sigue siendo una herramienta sensible.
- Conviene validar si tiene permisos y protecciones suficientes.

### 4. El módulo mezcla varias naturalezas de acción en una sola pantalla
Prioridad: Media
- consulta,
- ajuste,
- transferencia,
- conteo,
- alertas,
- kardex,
- recompra.

Esto lo hace potente, pero también puede volver difusa la expectativa del usuario sobre “qué estoy editando exactamente”.

## Veredicto
### Inventario NO está roto como módulo operativo,
pero NO es CRUD clásico y tampoco ofrece toda la administración fina que algunos usuarios podrían esperar.

Mi lectura actual sería:
- **Create:** no aplica como create clásico
- **Read:** bien
- **Update:** funcional por operaciones, no por edición CRUD directa
- **Delete:** no aplica como delete clásico

## Implicación importante
Aquí se refuerza el patrón que ya salió en Compras:
varias pantallas del sistema parecen diseñadas como operación por flujo y no como CRUD administrativo tradicional.

Eso sugiere que el problema general no es solo “hay CRUD roto”, sino también:
- expectativas de CRUD sobre pantallas operativas,
- y falta de separación explícita entre administración y operación.

## Siguiente paso recomendado
1. Auditar **Caja**.
2. Luego auditar **POS**.
3. Después construir una matriz global por pantalla:
- CRUD real
- flujo operativo
- híbrido
- confuso / incompleto
