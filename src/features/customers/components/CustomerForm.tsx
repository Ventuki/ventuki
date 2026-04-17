import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const customerSchema = z.object({
  id: z.string().optional(),
  code: z.string().optional(),
  first_name: z.string().min(1, "El nombre es obligatorio"),
  last_name: z.string().optional(),
  business_name: z.string().optional(),
  tax_id: z.string().regex(/^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/i, "RFC invalido").optional().or(z.literal("")),
  email: z.string().email("Email invalido").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  is_active: z.boolean().default(true),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;

export const emptyCustomerForm: CustomerFormValues = {
  code: "",
  first_name: "",
  last_name: "",
  business_name: "",
  tax_id: "",
  email: "",
  phone: "",
  address: "",
  notes: "",
  is_active: true,
};

interface CustomerFormProps {
  initialValues: CustomerFormValues;
  onSubmit: (data: CustomerFormValues) => void;
  onClear: () => void;
  saving: boolean;
}

export function CustomerForm({
  initialValues,
  onSubmit,
  onClear,
  saving,
}: CustomerFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: initialValues,
  });

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  return (
    <Card className="pos-shadow-sm h-fit">
      <CardHeader>
        <CardTitle>{initialValues.id ? "Editar cliente" : "Nuevo cliente"}</CardTitle>
        <CardDescription>Catalogo comercial con datos fiscales.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Codigo</Label>
              <Input {...register("code")} placeholder="Ej. CLI-001" />
            </div>
            <div className="space-y-2">
              <Label>Razon Social</Label>
              <Input {...register("business_name")} placeholder="Nombre comercial o empresa" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input {...register("first_name")} placeholder="Nombre(s)" />
              {errors.first_name && <p className="text-xs text-destructive">{errors.first_name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Apellido</Label>
              <Input {...register("last_name")} placeholder="Apellido(s)" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input {...register("email")} placeholder="cliente@correo.com" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Telefono</Label>
              <Input {...register("phone")} placeholder="Telefono" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>RFC</Label>
              <Input {...register("tax_id")} placeholder="RFC con homoclave" />
              {errors.tax_id && <p className="text-xs text-destructive">{errors.tax_id.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Direccion</Label>
              <Input {...register("address")} placeholder="Domicilio fiscal" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Input {...register("notes")} placeholder="Notas adicionales" />
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <Label>Estatus Operativo</Label>
            <Select value={watch("is_active") ? "true" : "false"} onValueChange={(v) => setValue("is_active", v === "true")}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Activo</SelectItem>
                <SelectItem value="false">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : initialValues.id ? "Actualizar" : "Crear"}
            </Button>
            <Button type="button" variant="outline" onClick={onClear} disabled={saving}>
              Limpiar
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
