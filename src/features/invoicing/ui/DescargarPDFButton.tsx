import { Button } from "@/components/ui/button";

export function DescargarPDFButton({ onDownload }: { onDownload: () => void }) {
  return <Button variant="outline" onClick={onDownload}>Descargar PDF</Button>;
}
