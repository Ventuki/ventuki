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
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
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
