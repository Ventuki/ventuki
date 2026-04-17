import { Input } from "@/components/ui/input";

export function FacturaFilters({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Buscar por RFC o folio" />;
}
