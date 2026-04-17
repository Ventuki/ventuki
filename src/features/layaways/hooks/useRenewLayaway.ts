import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { renewLayaway } from "../services/layawayService";
import type { RenewLayawayInput } from "../types";

export function useRenewLayaway() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: RenewLayawayInput) => renewLayaway(input),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["layaways"] });
      qc.invalidateQueries({ queryKey: ["layaway", variables.layaway_id] });
      toast.success("Apartado renovado correctamente");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Error al renovar apartado");
    },
  });
}
