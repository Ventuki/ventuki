import { AppLayout } from "@/components/layout";
import { LayawayList } from "../components/LayawayList";

export default function LayawaysPage() {
  return (
    <AppLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Apartados</h1>
          <p className="text-muted-foreground">
            Reserva mercancía con pagos parciales. Controla abonos, completados y cancelaciones.
          </p>
        </div>

        <div className="opacity-0 animate-[fade-in_0.5s_ease-out_0.2s_forwards]">
          <LayawayList />
        </div>
      </div>
    </AppLayout>
  );
}