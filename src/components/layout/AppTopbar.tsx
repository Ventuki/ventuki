import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Building2, ChevronsUpDown, LogOut, MapPin, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/features/auth";
import { supabase } from "@/integrations/supabase/client";
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

export function AppTopbar() {
  const navigate = useNavigate();
  const { user, company, branch, setCompany, setBranch, signOut } = useAuth();
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [loading, setLoading] = useState(false);

  const currentRole = useMemo(() => {
    if (!company?.role) return "Usuario";
    return company.role.charAt(0).toUpperCase() + company.role.slice(1);
  }, [company?.role]);

  useEffect(() => {
    if (!user) return;

    const loadCompanies = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("company_users")
        .select("company_id, role, companies(id, name, slug)")
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (error) {
        toast.error("No se pudieron cargar tus empresas");
        setLoading(false);
        return;
      }

      const mapped = (data || []).map((cu: any) => ({
        id: cu.companies.id,
        name: cu.companies.name,
        slug: cu.companies.slug,
        role: cu.role,
      }));
      setCompanies(mapped);
      setLoading(false);
    };

    loadCompanies();
  }, [user]);

  useEffect(() => {
    if (!company?.id) {
      setBranches([]);
      return;
    }

    const loadBranches = async () => {
      const { data, error } = await supabase
        .from("branches")
        .select("id, name, address")
        .eq("company_id", company.id)
        .eq("is_active", true)
        .eq("is_deleted", false)
        .order("name", { ascending: true });

      if (error) {
        toast.error("No se pudieron cargar las sucursales");
        return;
      }

      const companyBranches = data || [];
      setBranches(companyBranches);

      const hasStoredBranch = companyBranches.some((b) => b.id === branch?.id);
      if (!hasStoredBranch && companyBranches.length > 0) {
        setBranch({ id: companyBranches[0].id, name: companyBranches[0].name });
      }
    };

    loadBranches();
  }, [company?.id, branch?.id, setBranch]);

  const handleCompanyChange = async (selected: CompanyOption) => {
    setCompany({ id: selected.id, name: selected.name, slug: selected.slug, role: selected.role });

    const { data, error } = await supabase
      .from("branches")
      .select("id, name")
      .eq("company_id", selected.id)
      .eq("is_active", true)
      .eq("is_deleted", false)
      .order("name", { ascending: true });

    if (error) {
      toast.error("No se pudieron cargar las sucursales de la empresa");
      return;
    }

    if (data && data.length > 0) {
      setBranch({ id: data[0].id, name: data[0].name });
    } else {
      setBranch(null);
    }

    toast.success(`Ahora estás en ${selected.name}`);
    navigate("/");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth/login");
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar productos, clientes, ventas... (Ctrl+K)"
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="hidden min-w-56 justify-between gap-2 lg:flex">
              <div className="truncate text-left">
                <p className="truncate text-sm font-medium">{company?.name ?? "Sin empresa"}</p>
                <p className="truncate text-xs text-muted-foreground">{branch?.name ?? "Sin sucursal"}</p>
              </div>
              <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Empresa / Sucursal</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {loading && <DropdownMenuItem disabled>Cargando empresas...</DropdownMenuItem>}

            {!loading && companies.length === 0 && (
              <DropdownMenuItem disabled>No tienes empresas asignadas</DropdownMenuItem>
            )}

            {!loading && companies.map((c) => (
              <DropdownMenuItem
                key={c.id}
                onClick={() => handleCompanyChange(c)}
                className="flex items-center justify-between gap-2"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Building2 className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate">{c.name}</span>
                </div>
                {company?.id === c.id && <span className="text-xs text-primary">Actual</span>}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">Sucursales activas</DropdownMenuLabel>
            {branches.length === 0 && <DropdownMenuItem disabled>Sin sucursales</DropdownMenuItem>}
            {branches.map((b) => (
              <DropdownMenuItem key={b.id} onClick={() => setBranch({ id: b.id, name: b.name })}>
                <MapPin className="mr-2 h-4 w-4 text-primary" />
                {b.name}
                {branch?.id === b.id && <span className="ml-auto text-xs text-primary">Actual</span>}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" className="relative" aria-label="Notificaciones">
          <Bell className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Cuenta">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="truncate text-sm">{user?.email}</p>
              <p className="text-xs font-normal text-muted-foreground">Rol: {currentRole}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/auth/select-company")}>Cambiar contexto</DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
