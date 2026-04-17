export function ProductSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <input
      className="w-full rounded border px-3 py-2"
      placeholder="Buscar producto por nombre o SKU"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
