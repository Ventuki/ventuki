import { useMutation } from "@tanstack/react-query";
import { sendInvoiceEmailUseCase } from "../application/sendInvoiceEmail.usecase";
import type { InvoicePermission, SendInvoiceEmailCommand } from "../types/invoice.types";

export function useInvoiceEmail(permissions: InvoicePermission[]) {
  return useMutation({
    mutationFn: (command: SendInvoiceEmailCommand) => sendInvoiceEmailUseCase(command, permissions),
  });
}
