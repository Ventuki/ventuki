import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, ShoppingBag, Plus } from "lucide-react";
import { CartSnapshot } from "../types/cart.types";
import type { PaymentDraft } from "../hooks/usePOSCart";

const moneyFormatter = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

interface POSCartProps {
  cart: CartSnapshot;
  totals: {
    subtotal: number;
    tax_total: number;
    grand_total: number;
  };
  onRemoveFromCart: (lineId: string) => void;
  onCompleteSale: () => void;
  processing: boolean;
  onClearCart: () => void;
  customerSearch: string;
  onCustomerSearchChange: (value: string) => void;
  onSearchCustomers: () => void;
  customers: Array<{ id: string; full_name: string; tax_id?: string }>;
  selectedCustomerId: string;
  onCustomerChange: (customerId: string) => void;
  paymentMethods: Array<{ id: string; name: string; code: string | null }>;
  paymentLines: PaymentDraft[];
  onAddPaymentLine: () => void;
  onRemovePaymentLine: (lineId: string) => void;
  onUpdatePaymentLine: (lineId: string, patch: Partial<PaymentDraft>) => void;
  totalPaid: number;
}

export function POSCart({
  cart,
  totals,
  onRemoveFromCart,
  onCompleteSale,
  processing,
  onClearCart,
  customerSearch,
  onCustomerSearchChange,
  onSearchCustomers,
  customers,
  selectedCustomerId,
  onCustomerChange,
  paymentMethods,
  paymentLines,
  onAddPaymentLine,
  onRemovePaymentLine,
  onUpdatePaymentLine,
  totalPaid,
}: POSCartProps) {
  const isSufficientFunds = totalPaid >= totals.grand_total;
  const change = Math.max(0, totalPaid - totals.grand_total);

  return (
    <Card className="pos-shadow-sm h-full flex flex-col border-primary/20 shadow-md">
      <CardHeader className="pb-3 border-b bg-muted/20">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              Ticket Actual
            </CardTitle>
            <CardDescription>{cart.lines.length} conceptos</CardDescription>
          </div>
          {cart.lines.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onClearCart} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
              Limpiar [Esc]
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0 shadow-sm z-10">
              <TableRow>
                <TableHead>Concepto</TableHead>
                <TableHead className="w-[60px] text-center">Cant.</TableHead>
                <TableHead className="w-[80px] text-right">Monto</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cart.lines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-[200px] text-center text-muted-foreground">
                    El carrito está vacío. Agrega productos.
                  </TableCell>
                </TableRow>
              ) : (
                cart.lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="font-medium text-sm leading-tight">
                      {line.product_name}
                      <span className="block text-[11px] text-muted-foreground font-normal">
                        {moneyFormatter.format(line.unit_price)} c/u
                      </span>
                    </TableCell>
                    <TableCell className="text-center">{line.quantity}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {moneyFormatter.format(line.quantity * line.unit_price)}
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onRemoveFromCart(line.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        aria-label={`Eliminar ${line.product_name} del carrito`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="bg-muted/30 p-4 border-t">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{moneyFormatter.format(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Impuestos (16%)</span>
              <span>{moneyFormatter.format(totals.tax_total)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold">Total a Cobrar</span>
              <span className="text-3xl font-black text-primary">{moneyFormatter.format(totals.grand_total)}</span>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="space-y-1">
              <Label>Cliente (opcional)</Label>
              <div className="flex gap-2">
                <Input
                  value={customerSearch}
                  onChange={(e) => onCustomerSearchChange(e.target.value)}
                  placeholder="Buscar cliente por nombre o RFC"
                />
                <Button type="button" variant="secondary" onClick={onSearchCustomers}>
                  Buscar
                </Button>
              </div>
              <Select value={selectedCustomerId || "none"} onValueChange={(v) => onCustomerChange(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin cliente</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.full_name}{customer.tax_id ? ` · ${customer.tax_id}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label>Métodos de pago (multipago)</Label>
                <Button type="button" variant="secondary" size="sm" onClick={onAddPaymentLine}>
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar pago
                </Button>
              </div>
              <div className="space-y-2">
                {paymentLines.map((line) => {
                  const isCash = ["cash", "efectivo", "cash_mxn"].includes(line.method.trim().toLowerCase());
                  return (
                    <div key={line.id} className="grid grid-cols-12 gap-2">
                      <div className="col-span-4">
                        <Select value={line.method || "none"} onValueChange={(v) => onUpdatePaymentLine(line.id, { method: v === "none" ? "" : v })}>
                          <SelectTrigger><SelectValue placeholder="Método" /></SelectTrigger>
                          <SelectContent>
                            {paymentMethods.length === 0 ? (
                              <SelectItem value="none">Sin métodos activos</SelectItem>
                            ) : (
                              paymentMethods.map((method) => (
                                <SelectItem key={method.id} value={method.code || method.id}>
                                  {method.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Monto"
                          value={line.amount || ""}
                          onChange={(e) => onUpdatePaymentLine(line.id, { amount: Number(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="col-span-4">
                        <Input
                          placeholder={isCash ? "Referencia (opcional)" : "Referencia requerida"}
                          value={line.reference}
                          onChange={(e) => onUpdatePaymentLine(line.id, { reference: e.target.value })}
                        />
                      </div>
                      <div className="col-span-1">
                        <Button type="button" variant="ghost" size="icon" onClick={() => onRemovePaymentLine(line.id)} aria-label="Eliminar línea de pago">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 text-sm">
              <span className="text-muted-foreground">Total pagado</span>
              <span className="font-semibold">{moneyFormatter.format(totalPaid)}</span>
            </div>

            {totalPaid > 0 && (
              <div className="flex justify-between items-center pt-1 text-sm">
                <span className="text-muted-foreground">Cambio</span>
                <span className={`text-lg font-bold ${isSufficientFunds ? "text-success" : "text-destructive"}`}>
                  {moneyFormatter.format(change)}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 bg-card border-t border-primary/10">
        <Button
          size="lg"
          className="w-full text-lg h-14 font-semibold tracking-wide shadow-md"
          onClick={onCompleteSale}
          disabled={cart.lines.length === 0 || !isSufficientFunds || processing || paymentLines.length === 0}
        >
          {processing ? "Procesando cobro..." : "COBRAR [F1]"}
        </Button>
      </CardFooter>
    </Card>
  );
}
