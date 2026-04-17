import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, MapPin, Warehouse, AlertCircle, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

const companySchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(100),
  slug: z.string().min(2, "Mínimo 2 caracteres").max(50)
    .regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  phone: z.string().max(20).optional().or(z.literal("")),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
});

const branchSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(100),
  address: z.string().max(200).optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
});

const warehouseSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(100),
});

type CompanyForm = z.infer<typeof companySchema>;
type BranchForm = z.infer<typeof branchSchema>;
type WarehouseForm = z.infer<typeof warehouseSchema>;

const steps = [
  { title: "Empresa", description: "Datos de tu negocio", icon: Building2 },
  { title: "Sucursal", description: "Tu primera sucursal", icon: MapPin },
  { title: "Almacén", description: "Tu primer almacén", icon: Warehouse },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, setCompany, setBranch } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [companyData, setCompanyData] = useState<CompanyForm | null>(null);
  const [branchData, setBranchData] = useState<BranchForm | null>(null);

  const companyForm = useForm<CompanyForm>({
    resolver: zodResolver(companySchema),
    defaultValues: { name: "", slug: "", phone: "", email: "" },
  });

  const branchForm = useForm<BranchForm>({
    resolver: zodResolver(branchSchema),
    defaultValues: { name: "Principal", address: "", phone: "" },
  });

  const warehouseForm = useForm<WarehouseForm>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: { name: "Almacén Principal" },
  });

  // Auto-generate slug from company name
  const watchName = companyForm.watch("name");
  const generateSlug = () => {
    const slug = watchName
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    companyForm.setValue("slug", slug);
  };

  const handleCompanyNext = (data: CompanyForm) => {
    setCompanyData(data);
    setStep(1);
  };

  const handleBranchNext = (data: BranchForm) => {
    setBranchData(data);
    setStep(2);
  };

  const handleFinish = async (warehouseData: WarehouseForm) => {
    if (!companyData || !branchData || !user) return;

    setLoading(true);
    setError("");

    try {
      const { data, error: fnError } = await supabase.functions.invoke("onboard-company", {
        body: {
          company_name: companyData.name,
          company_slug: companyData.slug,
          company_phone: companyData.phone || null,
          company_email: companyData.email || null,
          branch_name: branchData.name,
          branch_address: branchData.address || null,
          branch_phone: branchData.phone || null,
          warehouse_name: warehouseData.name,
        },
      });

      if (fnError) throw fnError;

      const result = (data as { data?: any })?.data;
      if (!result?.company_id || !result?.branch_id) {
        throw new Error("Respuesta inválida del onboarding");
      }
      setCompany({ id: result.company_id, name: result.company_name, slug: result.company_slug, role: "admin" });
      setBranch({ id: result.branch_id, name: result.branch_name });
      toast.success("¡Empresa creada exitosamente!");
      navigate("/");
    } catch (err: any) {
      const msg = err?.message || "Error al crear la empresa";
      if (msg.includes("duplicate key") && msg.includes("slug")) {
        setError("Ese identificador (slug) ya está en uso. Elige otro.");
        setStep(0);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-lg space-y-6">
        {/* Stepper */}
        <div className="flex items-center justify-center gap-2">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  i < step
                    ? "bg-success text-success-foreground"
                    : i === step
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i < step ? <CheckCircle className="h-5 w-5" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`h-0.5 w-8 ${i < step ? "bg-success" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Step 0: Company */}
        {step === 0 && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                <Building2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle>Crea tu empresa</CardTitle>
              <CardDescription>Ingresa los datos de tu negocio</CardDescription>
            </CardHeader>
            <form onSubmit={companyForm.handleSubmit(handleCompanyNext)}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre de la empresa *</Label>
                  <Input
                    id="name"
                    placeholder="Ferretería El Tornillo"
                    {...companyForm.register("name")}
                    onBlur={generateSlug}
                  />
                  {companyForm.formState.errors.name && (
                    <p className="text-xs text-destructive">{companyForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Identificador único *</Label>
                  <Input id="slug" placeholder="ferreteria-el-tornillo" {...companyForm.register("slug")} />
                  <p className="text-xs text-muted-foreground">Se usa como identificador interno. Solo letras minúsculas, números y guiones.</p>
                  {companyForm.formState.errors.slug && (
                    <p className="text-xs text-destructive">{companyForm.formState.errors.slug.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input id="phone" placeholder="(55) 1234-5678" {...companyForm.register("phone")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="contacto@empresa.com" {...companyForm.register("email")} />
                  </div>
                </div>
              </CardContent>
              <div className="flex justify-end px-6 pb-6">
                <Button type="submit">
                  Siguiente <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Step 1: Branch */}
        {step === 1 && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                <MapPin className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle>Primera sucursal</CardTitle>
              <CardDescription>Configura tu sucursal principal</CardDescription>
            </CardHeader>
            <form onSubmit={branchForm.handleSubmit(handleBranchNext)}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="branchName">Nombre de la sucursal *</Label>
                  <Input id="branchName" placeholder="Sucursal Centro" {...branchForm.register("name")} />
                  {branchForm.formState.errors.name && (
                    <p className="text-xs text-destructive">{branchForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input id="address" placeholder="Av. Reforma 123, Col. Centro" {...branchForm.register("address")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branchPhone">Teléfono</Label>
                  <Input id="branchPhone" placeholder="(55) 1234-5678" {...branchForm.register("phone")} />
                </div>
              </CardContent>
              <div className="flex justify-between px-6 pb-6">
                <Button type="button" variant="outline" onClick={() => setStep(0)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Atrás
                </Button>
                <Button type="submit">
                  Siguiente <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Step 2: Warehouse */}
        {step === 2 && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                <Warehouse className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle>Primer almacén</CardTitle>
              <CardDescription>Crea el almacén de tu sucursal</CardDescription>
            </CardHeader>
            <form onSubmit={warehouseForm.handleSubmit(handleFinish)}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="warehouseName">Nombre del almacén *</Label>
                  <Input id="warehouseName" placeholder="Almacén Principal" {...warehouseForm.register("name")} />
                  {warehouseForm.formState.errors.name && (
                    <p className="text-xs text-destructive">{warehouseForm.formState.errors.name.message}</p>
                  )}
                </div>
              </CardContent>
              <div className="flex justify-between px-6 pb-6">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Atrás
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creando..." : "Finalizar"}
                  {!loading && <CheckCircle className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
