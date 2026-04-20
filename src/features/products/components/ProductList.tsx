import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductRow } from "@/features/products/services/productService";

interface ProductListProps {
  search: string;
  onSearchChange: (value: string) => void;
  products: ProductRow[];
  loading: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ProductList({
  search,
  onSearchChange,
  products,
  loading,
  onEdit,
  onDelete,
}: ProductListProps) {
  return (
    <Card className="pos-shadow-sm h-fit">
      <CardHeader>
        <CardTitle>Listado de productos</CardTitle>
        <CardDescription>{products.length} registros</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input 
          placeholder="Buscar por nombre, SKU o barcode" 
          value={search} 
          onChange={(e) => onSearchChange(e.target.value)} 
        />
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Estatus</TableHead>
                <TableHead>Operatividad</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Skeletons for loading state
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-16" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : products.length > 0 ? (
                products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.sku}</TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        p.is_active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                      }`}>
                        {p.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${p.sale_ready ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                          {p.sale_ready ? 'Listo para POS' : 'Incompleto para POS'}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${p.has_price ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                          {p.has_price ? 'Con precio' : 'Sin precio'}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${p.has_barcode ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          {p.has_barcode ? 'Con barcode' : 'Sin barcode'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => onEdit(p.id)}>
                          Editar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => onDelete(p.id)}>
                          Eliminar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No se encontraron productos.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
