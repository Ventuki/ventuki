import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "../AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, MapPin, Plus, LogOut } from "lucide-react";
import { toast } from "sonner";

interface CompanyOption {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface BranchOption {
  id: string;
  name: string;
  address: string | null;
}

function canCreateFirstBranch(role: string) {
  const r = role.toLowerCase();
  return r === "admin" || r === "manager";
}

export default function SelectCompanyPage() {
  const navigate = useNavigate();
  const { user, setCompany, setBranch, signOut } = useAuth();
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"company" | "branch" | "needsBranch">("company");
  const [firstBranchName, setFirstBranchName] = useState("Principal");
  const [firstBranchAddress, setFirstBranchAddress] = useState("");
  const [creatingBranch, setCreatingBranch] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadCompanies();
  }, [user]);

  const loadCompanies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("company_users")
      .select("company_id, role, companies(id, name, slug)")
      .eq("user_id", user!.id)
      .eq("is_active", true);

    if (!error && data) {
      const mapped = data.map((cu: any) => ({
        id: cu.companies.id,
        name: cu.companies.name,
        slug: cu.companies.slug,
        role: cu.role,
      }));
      setCompanies(mapped);

      if (mapped.length === 1) {
        handleSelectCompany(mapped[0]);
      }
    }
    setLoading(false);
  };

  const handleSelectCompany = async (company: CompanyOption) => {
    setSelectedCompany(company);

    const { data } = await supabase
      .from("branches")
      .select("id, name, address")
      .eq("company_id", company.id)
      .eq("is_active", true)
      .eq("is_deleted", false);

    if (data && data.length > 0) {
      setBranches(data);
      if (data.length === 1) {
        finalize(company, { id: data[0].id, name: data[0].name, address: data[0].address });
      } else {
        setStep("branch");
      }
    } else {
      setBranches([]);
      setFirstBranchName("Principal");
      setFirstBranchAddress("");
      setStep("needsBranch");
    }
  };

  const createFirstOperationalBranch = async () => {
    if (!selectedCompany || !user) return;
    const name = firstBranchName.trim();
    if (name.length < 2) {
      toast.error("El nombre de la sucursal debe tener al menos 2 caracteres");
      return;
    }
    setCreatingBranch(true);
    try {
      const { data: branchRow, error: branchErr } = await supabase
        .from("branches")
        .insert({
          company_id: selectedCompany.id,
          name,
          address: firstBranchAddress.trim() || null,
          is_active: true,
          is_deleted: false,
        })
        .select("id, name, address")
        .single();

      if (branchErr) throw branchErr;
      if (!branchRow) throw new Error("No se pudo crear la sucursal");

      const { error: whErr } = await supabase.from("warehouses").insert({
        company_id: selectedCompany.id,
        branch_id: branchRow.id,
        name: "Almacén Principal",
        is_active: true,
        is_deleted: false,
      });
      if (whErr) throw whErr;

      const { error: crErr } = await supabase.from("cash_registers").insert({
        company_id: selectedCompany.id,
        branch_id: branchRow.id,
        name: "Caja 1",
        is_active: true,
        is_deleted: false,
      });
      if (crErr) throw crErr;

      const { error: cuErr } = await supabase
        .from("company_users")
        .update({ branch_id: branchRow.id })
        .eq("company_id", selectedCompany.id)
        .eq("user_id", user.id);
      if (cuErr) throw cuErr;

      finalize(selectedCompany, {
        id: branchRow.id,
        name: branchRow.name,
        address: branchRow.address,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "No se pudo crear la sucursal";
      toast.error(msg);
    } finally {
      setCreatingBranch(false);
    }
  };

  const finalize = (company: CompanyOption, branch: BranchOption) => {
    setCompany({ id: company.id, name: company.name, slug: company.slug, role: company.role });
    setBranch({ id: branch.id, name: branch.name });
    toast.success(`Contexto listo: ${company.name} — ${branch.name}`);
    navigate("/");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-warning">
              <Building2 className="h-6 w-6 text-warning-foreground" />
            </div>
            <CardTitle className="text-2xl">Sin empresa asignada</CardTitle>
            <CardDescription>
              Tu cuenta no está asociada a ninguna empresa. Contacta al administrador o crea una nueva empresa para continuar hacia el circuito operativo.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button onClick={() => navigate("/onboarding")} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Crear empresa
            </Button>
            <Button variant="outline" onClick={signOut} className="w-full">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            {step === "company" ? (
              <Building2 className="h-6 w-6 text-primary-foreground" />
            ) : (
              <MapPin className="h-6 w-6 text-primary-foreground" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {step === "company"
              ? "Selecciona tu empresa"
              : step === "needsBranch"
                ? "Sin sucursal operativa"
                : `Sucursal de ${selectedCompany?.name}`}
          </CardTitle>
          <CardDescription>
            {step === "company"
              ? "Elige la empresa con la que deseas trabajar"
              : step === "needsBranch"
                ? `La empresa "${selectedCompany?.name}" no tiene sucursales activas. Crea la primera o pide ayuda a un administrador.`
              : "Elige la sucursal donde operarás"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {step === "needsBranch" && selectedCompany && (
            <div className="space-y-4">
              {canCreateFirstBranch(selectedCompany.role) ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="first-branch-name">Nombre de la sucursal</Label>
                    <Input
                      id="first-branch-name"
                      value={firstBranchName}
                      onChange={(e) => setFirstBranchName(e.target.value)}
                      placeholder="Ej. Principal"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="first-branch-address">Dirección (opcional)</Label>
                    <Input
                      id="first-branch-address"
                      value={firstBranchAddress}
                      onChange={(e) => setFirstBranchAddress(e.target.value)}
                      placeholder="Calle, número, colonia…"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Se crearán también un almacén principal y una caja base para poder operar POS e inventario.
                  </p>
                  <Button
                    className="w-full"
                    onClick={createFirstOperationalBranch}
                    disabled={creatingBranch}
                  >
                    {creatingBranch ? "Creando…" : "Crear sucursal y continuar"}
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Tu rol no permite crear sucursales. Pide a un administrador que registre al menos una sucursal activa para esta empresa.
                </p>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setStep("company");
                  setSelectedCompany(null);
                  setBranches([]);
                }}
              >
                ← Volver a empresas
              </Button>
            </div>
          )}
          {step === "company" &&
            companies.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelectCompany(c)}
                className="flex w-full items-center gap-4 rounded-lg border border-border p-4 text-left transition-colors hover:bg-accent"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-sm text-muted-foreground capitalize">{c.role}</p>
                </div>
              </button>
            ))}

          {step === "branch" &&
            branches.map((b) => (
              <button
                key={b.id}
                onClick={() => finalize(selectedCompany!, { id: b.id, name: b.name, address: b.address })}
                className="flex w-full items-center gap-4 rounded-lg border border-border p-4 text-left transition-colors hover:bg-accent"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{b.name}</p>
                  {b.address && <p className="text-sm text-muted-foreground">{b.address}</p>}
                </div>
              </button>
            ))}

          {step === "branch" && (
            <Button variant="ghost" className="w-full" onClick={() => { setStep("company"); setBranches([]); }}>
              ← Cambiar empresa
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
