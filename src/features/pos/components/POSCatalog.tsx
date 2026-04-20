import { forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProductResult } from "../hooks/usePOSCart";
import { Search } from "lucide-react";

const moneyFormatter = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

interface POSCatalogProps {
  search: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  loadingSearch: boolean;
  products: ProductResult[];
  onAddToCart: (product: ProductResult) => void;
  warehouseReady: boolean;
  paymentConfigReady: boolean;
  cashSessionReady: boolean;
}

export const POSCatalog = forwardRef<HTMLInputElement, POSCatalogProps>(({
  search,
  onSearchChange,
  onSearchSubmit,
  loadingSearch,
  products,
  onAddToCart,
  warehouseReady,
  paymentConfigReady,
  cashSessionReady,
}, ref) => {
  return (
    <Card className="pos-shadow-sm h-full flex flex-col">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-lg">Catálogo Búsqueda [F2]</CardTitle>
        <CardDescription>Busca productos por SKU, nombre o código barras.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 p-4 flex-1">
        <form 
          className="flex gap-2" 
          onSubmit={(e) => { 
            e.preventDefault(); 
            onSearchSubmit(); 
          }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              ref={ref}
              value={search} 
              onChange={(e) => onSearchChange(e.target.value)} 
              placeholder="Escribe y presiona Enter para buscar..." 
              className="pl-8"
            />
          </div>
          <Button type="submit" disabled={loadingSearch}>
            {loadingSearch ? "Buscando..." : "Buscar"}
          </Button>
        </form>

        {(!cashSessionReady || !warehouseReady || !paymentConfigReady) && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <p className="font-medium">El catálogo puede consultarse, pero el POS todavía no está listo para cobrar.</p>
            <p className="mt-1 text-xs text-amber-800">
              {!cashSessionReady
                ? "Falta caja activa. "
                : ""}
              {!warehouseReady
                ? "Falta almacén operativo. "
                : ""}
              {!paymentConfigReady
                ? "Faltan métodos de pago activos."
                : ""}
            </p>
          </div>
        )}

        <div className="rounded-md border flex-1 overflow-auto bg-card">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="w-[80px]">Precio</TableHead>
                <TableHead className="w-[80px]">Stock</TableHead>
                <TableHead className="w-[90px] text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 && !loadingSearch && (
                <TableRow>
                  <TableCell colSpan={4} className="h-[200px] text-center text-muted-foreground">
                    {search.trim().length < 2
                      ? "Escribe al menos 2 caracteres para buscar productos."
                      : "No se encontraron productos con ese criterio. Si acabas de crear uno, verifica precio, inventario y contexto operativo."}
                  </TableCell>
                </TableRow>
              )}
              {products.map((product) => {
                const productBlockedReason = product.price <= 0
                  ? "Sin precio"
                  : product.stock <= 0
                    ? "Sin stock"
                    : !cashSessionReady
                      ? "Caja pendiente"
                      : !warehouseReady
                        ? "Sin almacén"
                        : !paymentConfigReady
                          ? "Sin pagos"
                          : null;

                return (
                <TableRow key={product.id} className="hover:bg-muted/30">
                  <TableCell>
                    <p className="font-medium text-sm leading-tight">{product.name}</p>
                    <p className="text-[11px] text-muted-foreground">{product.sku}</p>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{moneyFormatter.format(product.price)}</p>
                      {product.price <= 0 && <p className="text-[11px] text-warning">Sin precio operativo</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                        product.stock > 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                      }`}>
                        {product.stock}
                      </span>
                      {product.stock <= 0 && <p className="text-[11px] text-muted-foreground">Sin stock disponible</p>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      onClick={() => onAddToCart(product)}
                      disabled={Boolean(productBlockedReason)}
                      className="w-full h-8 px-2 text-xs"
                    >
                      {productBlockedReason || "Agregar"}
                    </Button>
                  </TableCell>
                </TableRow>
              );})}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
});

POSCatalog.displayName = "POSCatalog";
