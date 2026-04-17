import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getLayaways, getLayawayDetail, createLayaway, cancelLayaway } from "../services/layawayService";
import type { CreateLayawayInput, LayawayFilters } from "../types";

export function useLayaways(filters: LayawayFilters = {}) {
  return useQuery({
    queryKey: ["layaways", filters],
    queryFn: () => getLayaways(filters),
    staleTime: 30_000,
  });
}

export function useLayawayDetail(id: string | null) {
  return useQuery({
    queryKey: ["layaway", id],
    queryFn: () => (id ? getLayawayDetail(id) : null),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useCreateLayaway() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateLayawayInput) => createLayaway(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["layaways"] });
      toast.success("Apartado creado correctamente");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Error al crear el apartado");
    },
  });
}

export function useCancelLayaway() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cancelLayaway(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["layaways"] });
      qc.invalidateQueries({ queryKey: ["layaway", id] });
      toast.success("Apartado cancelado");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Error al cancelar el apartado");
    },
  });
}