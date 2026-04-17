import type { CartSnapshot, AddProductCommand, CartLine } from "../types/cart.types";
import { productRepository } from "../infrastructure/product.repository";
import { inventoryRepository } from "../infrastructure/inventory.repository";
import { priceCacheLayer } from "../cache/price.cache";
import { validateBranch, validateStock } from "../domain/rules";

export async function addProductUseCase(snapshot: CartSnapshot, command: AddProductCommand): Promise<CartSnapshot> {
  validateBranch(command);

  // Cargar datos reales del producto (nombre, SKU, precio, impuesto, descuento máximo)
  const cacheKey = `${command.company_id}:${command.product_id}`;
  let productDetail = priceCacheLayer.getDetail(command.company_id, command.product_id);

  if (!productDetail) {
    const detail = await productRepository.getProductDetail(command, command.product_id);
    if (!detail) {
      throw new Error(`Producto ${command.product_id} no encontrado o no activo`);
    }
    productDetail = detail;
    priceCacheLayer.setDetail(command.company_id, command.product_id, detail);
  }

  // Stock real desde la DB
  const stockResult = await inventoryRepository.getStock(command, command.product_id);
  const stock = (stockResult.data as unknown as { quantity: number } | null)?.quantity ?? 0;

  // Verificar si el producto ya existe en el carrito (sumar cantidades)
  const existingLine = snapshot.lines.find((l) => l.product_id === command.product_id);
  const totalQuantity = (existingLine?.quantity ?? 0) + command.quantity;

  if (totalQuantity > stock) {
    throw new Error(
      `Stock insuficiente para ${productDetail.name}: disponible ${stock}, solicitado ${totalQuantity}`,
    );
  }

  if (existingLine) {
    // Actualizar cantidad de línea existente
    const updatedLines = snapshot.lines.map((l) =>
      l.product_id === command.product_id ? { ...l, quantity: totalQuantity, stock_available: stock } : l,
    );
    return { ...snapshot, lines: updatedLines };
  }

  const line: CartLine = {
    id: crypto.randomUUID(),
    product_id: command.product_id,
    product_name: productDetail.name,
    sku: productDetail.sku,
    quantity: command.quantity,
    unit_price: productDetail.price,
    tax_rate: productDetail.tax_rate,
    max_discount_percent: productDetail.max_discount_percent,
    discount_percent: 0,
    stock_available: stock,
  };

  validateStock(line);
  return { ...snapshot, lines: [...snapshot.lines, line] };
}

