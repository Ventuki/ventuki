import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/features/auth";
import { toast } from "sonner";
import {
  deleteSupplier,
  getSupplierById,
  searchSuppliers,
  SupplierRow,
  upsertSupplier
} from "@/features/suppliers/services/supplierService";
import { SupplierFormValues } from "../components/SupplierForm";

export function useManageSuppliers() {
  const { company } = useAuth();
  const [search, setSearch] = useState("");
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSuppliers = useCallback(async () => {
    if (!company?.id) return;
    setLoading(true);
    try {
      const { data, error } = await searchSuppliers(company.id, search);
      if (error) {
        toast.error(error.message);
        return;
      }
      setSuppliers(data);
    } finally {
      setLoading(false);
    }
  }, [company?.id, search]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  const removeSupplier = async (id: string) => {
    if (!company?.id) return false;
    const { error } = await deleteSupplier(id, company.id);
    if (error) {
      toast.error(error.message);
      return false;
    }
    toast.success("Proveedor eliminado");
    loadSuppliers();
    return true;
  };

  const saveSupplier = async (data: SupplierFormValues) => {
    if (!company?.id) return false;
    setSaving(true);
    const { error } = await upsertSupplier(data.id || "", {
      company_id: company.id,
      code: data.code?.trim() || null,
      name: data.name.trim(),
      contact_name: data.contact_name?.trim() || null,
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
      tax_id: data.tax_id?.trim() || null,
      address: data.address?.trim() || null,
      notes: data.notes?.trim() || null,
      is_active: data.is_active,
    });
    setSaving(false);

    if (error) {
      toast.error(error.message);
      return false;
    }

    toast.success(data.id ? "Proveedor actualizado" : "Proveedor creado");
    loadSuppliers();
    return true;
  };

  const getSupplierDetails = async (id: string) => {
    if (!company?.id) return null;
    const { data, error } = await getSupplierById(id, company.id);
    if (error || !data) {
      toast.error(error?.message || "No se pudo cargar el proveedor");
      return null;
    }
    return data;
  };

  return {
    search,
    setSearch,
    suppliers,
    loading,
    saving,
    refreshSuppliers: loadSuppliers,
    removeSupplier,
    saveSupplier,
    getSupplierDetails,
  };
}
