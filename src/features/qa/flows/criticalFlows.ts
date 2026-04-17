export const criticalFlows = {
  dashboard: [
    "Cargar KPIs",
    "Mostrar loading/error",
    "Actualizar tras venta",
  ],
  pos: [
    "Buscar producto",
    "Agregar carrito",
    "Seleccionar cliente",
    "Cobro multi-método",
    "Comprobante imprimible",
  ],
  inventory: [
    "Filtrar por almacén",
    "Ajustar inventario",
    "Transferir stock",
    "Verificar kardex",
  ],
  products: [
    "Alta producto",
    "Validar duplicados",
    "Editar precio/costo",
    "Eliminar con auditoría",
  ],
  purchases: [
    "Crear draft",
    "Confirmar compra",
    "Recepción parcial",
    "Recepción total",
    "Cancelar/Reabrir",
  ],
  suppliers: [
    "Alta proveedor",
    "Validación schema",
    "Baja lógica",
    "Bloqueo por compras asociadas",
  ],
} as const;
