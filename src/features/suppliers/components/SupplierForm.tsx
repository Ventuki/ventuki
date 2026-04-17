import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const supplierSchema = z.object({
  id: z.string().optional(),
  code: z.string().optional(),
  name: z.string().min(1, "El nombre es obligatorio"),
  contact_name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  tax_id: z.string().regex(/^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/i, "RFC / Tax ID inválido").optional().or(z.literal("")),
  address: z.string().optional(),
  notes: z.string().optional(),
  is_active: z.boolean().default(true),
});

export type SupplierFormValues = z.infer<typeof supplierSchema>;

export const emptySupplierForm: SupplierFormValues = {
  code: "",
  name: "",
  contact_name: "",
  phone: "",
  email: "",
  tax_id: "",
  address: "",
  notes: "",
  is_active: true,
};

interface SupplierFormProps {
  initialValues: SupplierFormValues;
  onSubmit: (data: SupplierFormValues) => void;
  onClear: () => void;
  saving: boolean;
}

export function SupplierForm({
  initialValues,
  onSubmit,
  onClear,
  saving,
}: SupplierFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: initialValues,
  });

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  return (
    <Card className="pos-shadow-sm h-fit">
      <CardHeader>
        <CardTitle>{initialValues.id ? "Editar proveedor" : "Nuevo proveedor"}</CardTitle>
        <CardDescription>Alta y mantenimiento de proveedores.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Código</Label>
              <Input {...register("code")} placeholder="Ej. PRV-001" />
            </div>
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input {...register("name")} placeholder="Razón social o nombre" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Contacto</Label>
              <Input {...register("contact_name")} placeholder="Nombre del contacto" />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input {...register("phone")} placeholder="Teléfono" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input {...register("email")} placeholder="correo@empresa.com" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>RFC / Tax ID</Label>
              <Input {...register("tax_id")} placeholder="RFC con homoclave" />
              {errors.tax_id && <p className="text-xs text-destructive">{errors.tax_id.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Dirección</Label>
            <Input {...register("address")} placeholder="Dirección completa" />
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Input {...register("notes")} placeholder="Condiciones, comentarios, etc." />
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
