import { Button } from "@/components/ui/button";

export function DescargaXMLButton({ onDownload }: { onDownload: () => void }) {
  return <Button variant="outline" onClick={onDownload}>Descargar XML</Button>;
}
