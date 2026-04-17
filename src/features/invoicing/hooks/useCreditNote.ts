import { useMutation } from "@tanstack/react-query";
import { createCreditNoteUseCase } from "../application/createCreditNote.usecase";
import type { CreateCreditNoteCommand, InvoicePermission } from "../types/invoice.types";

export function useCreditNote(permissions: InvoicePermission[]) {
  return useMutation({
    mutationFn: (command: CreateCreditNoteCommand) => createCreditNoteUseCase(command, permissions),
  });
}
