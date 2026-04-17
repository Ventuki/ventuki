import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function CancelFacturaModal({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar CFDI</DialogTitle>
        </DialogHeader>
        <Button variant="destructive" onClick={onConfirm}>Cancelar en SAT</Button>
      </DialogContent>
    </Dialog>
  );
}
