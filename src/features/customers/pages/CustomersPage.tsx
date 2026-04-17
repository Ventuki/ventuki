import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { useManageCustomers } from "../hooks/useManageCustomers";
import { CustomerForm, CustomerFormValues, emptyCustomerForm } from "../components/CustomerForm";
import { CustomerList } from "../components/CustomerList";

export default function CustomersPage() {
  const {
    search,
    setSearch,
    customers,
    loading,
    saving,
    removeCustomer,
    saveCustomer,
    getCustomerDetails,
  } = useManageCustomers();

  const [initialValues, setInitialValues] = useState<CustomerFormValues>(emptyCustomerForm);

  const handleClear = () => {
    setInitialValues(emptyCustomerForm);
  };

  const handleEdit = async (id: string) => {
    const details = await getCustomerDetails(id);
    if (!details) return;

    setInitialValues({
      id: details.id,
      code: details.code || "",
      first_name: details.first_name || "",
      last_name: details.last_name || "",
      business_name: details.business_name || "",
      email: details.email || "",
      phone: details.phone || "",
      tax_id: details.tax_id || "",
      address: details.address || "",
      notes: details.notes || "",
      is_active: Boolean(details.is_active),
    });
  };

  const handleDelete = async (id: string) => {
    const success = await removeCustomer(id);
    if (success && initialValues.id === id) {
      handleClear();
    }
  };

  const handleSubmit = async (data: CustomerFormValues) => {
    const success = await saveCustomer(data);
    if (success) {
      handleClear();
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">Alta y mantenimiento multi-tenant de clientes con validación RFC/email.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 items-start opacity-0 animate-[fade-in_0.5s_ease-out_0.2s_forwards]">
          <CustomerForm
            initialValues={initialValues}
            onSubmit={handleSubmit}
            onClear={handleClear}
            saving={saving}
          />

          <CustomerList
            search={search}
            onSearchChange={setSearch}
            customers={customers}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </AppLayout>
  );
}
