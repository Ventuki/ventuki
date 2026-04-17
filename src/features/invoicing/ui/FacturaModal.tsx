import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import type { ReactNode } from "react";

interface FacturaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  children: ReactNode;
}

export function FacturaModal({ open, onOpenChange, onSubmit, children }: FacturaModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generar factura CFDI 4.0</DialogTitle>
        </DialogHeader>
        {children}
        <Button onClick={onSubmit}>Timbrar factura</Button>
      </DialogContent>
    </Dialog>
  );
}
