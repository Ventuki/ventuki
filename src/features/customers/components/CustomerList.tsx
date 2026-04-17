import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CustomerRow, customerDisplayName } from "@/features/customers/services/customerService";

interface CustomerListProps {
  search: string;
  onSearchChange: (value: string) => void;
  customers: CustomerRow[];
  loading: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function CustomerList({
  search,
  onSearchChange,
  customers,
  loading,
  onEdit,
  onDelete,
}: CustomerListProps) {
  return (
    <Card className="pos-shadow-sm h-fit">
      <CardHeader>
        <CardTitle>Listado de clientes</CardTitle>
        <CardDescription>{customers.length} registros</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input 
          placeholder="Buscar por nombre, razon social, RFC o email" 
          value={search} 
          onChange={(e) => onSearchChange(e.target.value)} 
        />
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Codigo</TableHead>
                <TableHead>Nombre / Razon Social</TableHead>
                <TableHead>RFC</TableHead>
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
              ) : customers.length > 0 ? (
                customers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.code || "---"}</TableCell>
                    <TableCell className="font-medium">{customerDisplayName(c)}</TableCell>
                    <TableCell>{c.tax_id || "---"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        c.is_active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                      }`}>
                        {c.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => onEdit(c.id)}>
                          Editar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => onDelete(c.id)}>
                          Eliminar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No se encontraron clientes.
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
