import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "../AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, MapPin, Plus, LogOut } from "lucide-react";

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

export default function SelectCompanyPage() {
  const navigate = useNavigate();
  const { user, setCompany, setBranch, signOut } = useAuth();
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"company" | "branch">("company");

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
      // No branches, go straight to dashboard
      finalize(company, null);
    }
  };

  const finalize = (company: CompanyOption, branch: BranchOption | null) => {
    setCompany({ id: company.id, name: company.name, slug: company.slug, role: company.role });
    if (branch) setBranch({ id: branch.id, name: branch.name });
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
              Tu cuenta no está asociada a ninguna empresa. Contacta al administrador o crea una nueva empresa.
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
            {step === "company" ? "Selecciona tu empresa" : `Sucursal de ${selectedCompany?.name}`}
          </CardTitle>
          <CardDescription>
            {step === "company"
              ? "Elige la empresa con la que deseas trabajar"
              : "Elige la sucursal donde operarás"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
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
