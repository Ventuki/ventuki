import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function InvoicingPage() {
  return (
    <AppLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Facturacion (CFDI)</h1>
          <p className="text-muted-foreground">Modulo de facturacion electronica con SAT.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Facturas</CardTitle>
            <CardDescription>Proximamente: generacion, cancelacion, notas de credito y descarga de CFDI.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Este modulo esta en desarrollo. Las funciones de timbrado, cancelacion y envio de CFDI
              estan implementadas en el backend y se conectaran desde esta pantalla.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
