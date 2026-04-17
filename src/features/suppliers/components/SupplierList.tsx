import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SupplierRow } from "@/features/suppliers/services/supplierService";

interface SupplierListProps {
  search: string;
  onSearchChange: (value: string) => void;
  suppliers: SupplierRow[];
  loading: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SupplierList({
  search,
  onSearchChange,
  suppliers,
  loading,
  onEdit,
  onDelete,
}: SupplierListProps) {
  return (
    <Card className="pos-shadow-sm h-fit">
      <CardHeader>
        <CardTitle>Listado de proveedores</CardTitle>
        <CardDescription>{suppliers.length} registros</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input 
          placeholder="Buscar por nombre, código o email" 
          value={search} 
          onChange={(e) => onSearchChange(e.target.value)} 
        />
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Estatus</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-16" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : suppliers.length > 0 ? (
                suppliers.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.code || "—"}</TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.contact_name || s.phone || s.email || "—"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        s.is_active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                      }`}>
                        {s.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => onEdit(s.id)}>
                          Editar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => onDelete(s.id)}>
                          Eliminar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No se encontraron proveedores.
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
