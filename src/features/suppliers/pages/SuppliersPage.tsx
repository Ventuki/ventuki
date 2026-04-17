import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { useManageSuppliers } from "../hooks/useManageSuppliers";
import { SupplierForm, SupplierFormValues, emptySupplierForm } from "../components/SupplierForm";
import { SupplierList } from "../components/SupplierList";

export default function SuppliersPage() {
  const {
    search,
    setSearch,
    suppliers,
    loading,
    saving,
    removeSupplier,
    saveSupplier,
    getSupplierDetails,
  } = useManageSuppliers();

  const [initialValues, setInitialValues] = useState<SupplierFormValues>(emptySupplierForm);

  const handleClear = () => {
    setInitialValues(emptySupplierForm);
  };

  const handleEdit = async (id: string) => {
    const details = await getSupplierDetails(id);
    if (!details) return;

    setInitialValues({
      id: details.id,
      code: details.code || "",
      name: details.name,
      contact_name: details.contact_name || "",
      phone: details.phone || "",
      email: details.email || "",
      tax_id: details.tax_id || "",
      address: details.address || "",
      notes: details.notes || "",
      is_active: Boolean(details.is_active),
    });
  };

  const handleDelete = async (id: string) => {
    const success = await removeSupplier(id);
    if (success && initialValues.id === id) {
      handleClear();
    }
  };

  const handleSubmit = async (data: SupplierFormValues) => {
    const success = await saveSupplier(data);
    if (success) {
      handleClear();
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proveedores</h1>
          <p className="text-muted-foreground">CRUD de proveedores para ciclo de compras.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 items-start opacity-0 animate-[fade-in_0.5s_ease-out_0.2s_forwards]">
          <SupplierForm
            initialValues={initialValues}
            onSubmit={handleSubmit}
            onClear={handleClear}
            saving={saving}
          />

          <SupplierList
            search={search}
            onSearchChange={setSearch}
            suppliers={suppliers}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </AppLayout>
  );
}
