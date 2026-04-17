import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { addLayawayPayment } from "../services/layawayService";
import type { AddPaymentInput } from "../types";

export function useAddLayawayPayment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: AddPaymentInput) => addLayawayPayment(input),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["layaways"] });
      qc.invalidateQueries({ queryKey: ["layaway", variables.layaway_id] });
      toast.success("Pago registrado correctamente");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Error al registrar el pago");
    },
  });
}