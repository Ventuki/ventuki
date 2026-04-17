import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Search, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createLayawaySchema, type CreateLayawayFormValues } from "../schemas/layaway.schema";
import { useCreateLayaway } from "../hooks/useLayaways";
import { useAuth } from "@/features/auth";
import { searchCustomers } from "@/features/customers/services/customerService";
import { searchProducts, type ProductRow } from "@/features/products/services/productService";
import { formatCurrency } from "../utils";
import { toast } from "sonner";

interface CreateLayawayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface LayawayLine {
  product_id: string;
  product_name: string;
  product_sku: string | null;
  quantity: number;
  unit_price: number;
}

export function CreateLayawayDialog({ open, onOpenChange }: CreateLayawayDialogProps) {
  const { company } = useAuth();
  const createLayaway = useCreateLayaway();
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const [productResults, setProductResults] = useState<ProductRow[]>([]);
  const [lines, setLines] = useState<LayawayLine[]>([]);
  const [showCustomerResults, setShowCustomerResults] = useState(false);
  const [showProductResults, setShowProductResults] = useState(false);

  const form = useForm<CreateLayawayFormValues>({
    resolver: zodResolver(createLayawaySchema),
    defaultValues: {
      branch_id: "",
      customer_id: "",
      items: [],
      due_date: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset();
      setLines([]);
      setCustomerSearch("");
      setProductSearch("");
      setCustomerResults([]);
      setProductResults([]);
    }
  }, [open, form]);

  useEffect(() => {
    if (!company?.id || customerSearch.length < 2) return;
    const timer = setTimeout(() => {
      searchCustomers(company.id, customerSearch).then(({ data }) => {
        setCustomerResults(data);
        setShowCustomerResults(true);
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [company?.id, customerSearch]);

  useEffect(() => {
    if (!company?.id || productSearch.length < 2) return;
    const timer = setTimeout(() => {
      searchProducts(company.id, productSearch).then(({ data }) => {
        setProductResults(data);
        setShowProductResults(true);
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [company?.id, productSearch]);

  const addProduct = (product: ProductRow) => {
    if (lines.find((l) => l.product_id === product.id)) {
      toast.warning("Este producto ya fue agregado");
      return;
    }
    setLines((prev) => [
      ...prev,
      {
        product_id: product.id,
        product_name: product.name,
        product_sku: product.sku,
        quantity: 1,
        unit_price: Number(product.base_price ?? 0),
      },
    ]);
    setProductSearch("");
    setShowProductResults(false);
  };

  const removeLine = (product_id: string) => {
    setLines((prev) => prev.filter((l) => l.product_id !== product_id));
  };

  const updateLine = (product_id: string, field: "quantity" | "unit_price", value: number) => {
    setLines((prev) =>
      prev.map((l) => (l.product_id === product_id ? { ...l, [field]: value } : l))
    );
  };

  const total = lines.reduce((sum, l) => sum + l.quantity * l.unit_price, 0);

  const handleSubmit = form.handleSubmit(async (values) => {
    if (lines.length === 0) {
      toast.error("Agrega al menos un producto");
      return;
    }
    try {
      await createLayaway.mutateAsync({
        branch_id: values.branch_id,
        customer_id: values.customer_id,
        items: lines.map((l) => ({
          product_id: l.product_id,
          quantity: l.quantity,
          unit_price: l.unit_price,
        })),
        due_date: values.due_date,
        notes: values.notes,
      });
      onOpenChange(false);
    } catch (e) {
      // Error already handled in hook
    }
  });

  const selectedCustomer = customerResults.find(
    (c) => c.id === form.watch("customer_id")
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Apartado</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer selector */}
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <Input
              placeholder="Buscar cliente por nombre, RFC o código..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              onFocus={() => setShowCustomerResults(true)}
            />
            {showCustomerResults && customerResults.length > 0 && (
              <div className="z-10 rounded-md border bg-popover p-1 shadow-md">
                {customerResults.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-accent"
                    onClick={() => {
                      form.setValue("customer_id", c.id, { shouldValidate: true });
                      setCustomerSearch(
                        c.business_name || [c.first_name, c.last_name].join(" ")
                      );
                      setShowCustomerResults(false);
                    }}
                  >
                    <span className="font-medium">
                      {c.business_name || [c.first_name, c.last_name].join(" ")}
                    </span>
                    {c.email && (
                      <span className="ml-2 text-xs text-muted-foreground">{c.email}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
            {form.formState.errors.customer_id && (
              <p className="text-xs text-destructive">
                {form.formState.errors.customer_id.message}
              </p>
            )}
            {!company?.id && (
              <p className="text-xs text-muted-foreground">
                Primero registra un cliente para poder crear apartados
              </p>
            )}
          </div>

          {/* Product search */}
          <div className="space-y-2">
            <Label>Agregar productos</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar producto por nombre o SKU..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                onFocus={() => setShowProductResults(true)}
                className="pl-9"
              />
            </div>
            {showProductResults && productResults.length > 0 && (
              <div className="z-10 rounded-md border bg-popover p-1 shadow-md">
                {productResults.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-accent flex items-center justify-between"
                    onClick={() => addProduct(p)}
                  >
                    <span>{p.name}</span>
                    {p.sku && (
                      <span className="text-xs text-muted-foreground">SKU: {p.sku}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Lines table */}
          {lines.length > 0 && (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 text-left font-medium">Producto</th>
                    <th className="px-3 py-2 text-center font-medium w-20">Cantidad</th>
                    <th className="px-3 py-2 text-right font-medium w-28">Precio Unit.</th>
                    <th className="px-3 py-2 text-right font-medium w-28">Subtotal</th>
                    <th className="px-3 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line) => (
                    <tr key={line.product_id} className="border-b last:border-0">
                      <td className="px-3 py-2">
                        <span className="font-medium">{line.product_name}</span>
                        {line.product_sku && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            {line.product_sku}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(e) =>
                            updateLine(line.product_id, "quantity", Number(e.target.value))
                          }
                          className="w-20 text-center"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={line.unit_price}
                          onChange={(e) =>
                            updateLine(line.product_id, "unit_price", Number(e.target.value))
                          }
                          className="w-28 text-right"
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        {formatCurrency(line.quantity * line.unit_price)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeLine(line.product_id)}
                          className="rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/30">
                    <td colSpan={3} className="px-3 py-2 text-right font-semibold">Total:</td>
                    <td className="px-3 py-2 text-right font-bold text-lg">{formatCurrency(total)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Due date & notes */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha esperada de entrega</Label>
              <Input type="date" {...form.register("due_date")} />
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Input placeholder="Notas adicionales..." {...form.register("notes")} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createLayaway.isPending || lines.length === 0}
            >
              {createLayaway.isPending ? "Creando..." : "Crear Apartado"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}