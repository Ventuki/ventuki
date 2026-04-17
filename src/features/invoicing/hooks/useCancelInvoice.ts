import { useMutation } from "@tanstack/react-query";
import { cancelInvoiceUseCase } from "../application/cancelInvoice.usecase";
import type { CancelInvoiceCommand, InvoicePermission } from "../types/invoice.types";

export function useCancelInvoice(permissions: InvoicePermission[]) {
  return useMutation({
    mutationFn: (command: CancelInvoiceCommand) => cancelInvoiceUseCase(command, permissions),
  });
}
