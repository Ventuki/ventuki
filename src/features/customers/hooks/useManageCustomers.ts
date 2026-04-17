import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/features/auth";
import { toast } from "sonner";
import {
  deleteCustomer,
  getCustomerById,
  searchCustomers,
  CustomerRow,
  upsertCustomer
} from "@/features/customers/services/customerService";
import { CustomerFormValues } from "../components/CustomerForm";

export function useManageCustomers() {
  const { company } = useAuth();
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadCustomers = useCallback(async () => {
    if (!company?.id) return;
    setLoading(true);
    try {
      const { data, error } = await searchCustomers(company.id, search);
      if (error) {
        toast.error(error.message);
        return;
      }
      setCustomers(data);
    } finally {
      setLoading(false);
    }
  }, [company?.id, search]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const removeCustomer = async (id: string) => {
    if (!company?.id) return false;
    const { error } = await deleteCustomer(id, company.id);
    if (error) {
      toast.error(error.message);
      return false;
    }
    toast.success("Cliente eliminado");
    loadCustomers();
    return true;
  };

  const saveCustomer = async (data: CustomerFormValues) => {
    if (!company?.id) return false;
    setSaving(true);
    const { error } = await upsertCustomer(data.id || "", {
      company_id: company.id,
      code: data.code?.trim() || null,
      first_name: data.first_name.trim(),
      last_name: data.last_name?.trim() || null,
      business_name: data.business_name?.trim() || null,
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      tax_id: data.tax_id?.trim().toUpperCase() || null,
      address: data.address?.trim() || null,
      notes: data.notes?.trim() || null,
      is_active: data.is_active,
    });
    setSaving(false);

    if (error) {
      toast.error(error.message);
      return false;
    }

    toast.success(data.id ? "Cliente actualizado" : "Cliente creado");
    loadCustomers();
    return true;
  };

  const getCustomerDetails = async (id: string) => {
    if (!company?.id) return null;
    const { data, error } = await getCustomerById(id, company.id);
    if (error || !data) {
      toast.error(error?.message || "No se pudo cargar el cliente");
      return null;
    }
    return data;
  };

  return {
    search,
    setSearch,
    customers,
    loading,
    saving,
    refreshCustomers: loadCustomers,
    removeCustomer,
    saveCustomer,
    getCustomerDetails,
  };
}
