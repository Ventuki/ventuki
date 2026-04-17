import { useMutation } from "@tanstack/react-query";
import { createInvoiceUseCase } from "../application/createInvoice.usecase";
import type { CreateInvoiceCommand, InvoicePermission } from "../types/invoice.types";

export function useCreateInvoice(permissions: InvoicePermission[]) {
  return useMutation({
    mutationFn: (command: CreateInvoiceCommand) => createInvoiceUseCase(command, permissions),
  });
}
