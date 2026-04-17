-- Smoke checks sugeridos para Fase 4 (ejecución manual)
-- Objetivo de salida: compra creada -> recibida -> stock actualizado correctamente.

-- 1) Crear proveedor (admin/manager/purchaser) en company A => OK
-- 2) Crear compra + items en company A => status confirmed
-- 3) Ejecutar receive_purchase con una parte de los items => status partial
-- 4) Verificar stock_levels(producto,almacén) aumentó exactamente lo recibido
-- 5) Verificar stock_movements con movement_type='purchase' y referencia a compra
-- 6) Ejecutar receive_purchase con remanente => status received
-- 7) Usuario company B no puede ver/editar suppliers/purchases de company A
