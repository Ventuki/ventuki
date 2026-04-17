import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  Truck,
  Receipt,
  Users,
  Building2,
  Settings,
  BarChart3,
  Banknote,
  FileText,
  Handshake,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth";

type AppRole =
  | "admin"
  | "manager"
  | "cashier"
  | "seller"
  | "warehouse_keeper"
  | "purchaser"
  | "accountant";

interface NavItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  allowedRoles: AppRole[];
}

const navigation: NavItem[] = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    allowedRoles: ["admin", "manager", "cashier", "seller", "warehouse_keeper", "purchaser", "accountant"],
  },
  {
    name: "Punto de Venta",
    href: "/pos",
    icon: ShoppingCart,
    allowedRoles: ["admin", "manager", "cashier", "seller"],
  },
  {
    name: "Caja",
    href: "/cash-register",
    icon: Banknote,
    allowedRoles: ["admin", "manager", "cashier"],
  },
  {
    name: "Productos",
    href: "/products",
    icon: Package,
    allowedRoles: ["admin", "manager", "warehouse_keeper", "purchaser", "seller"],
  },
  {
    name: "Inventario",
    href: "/inventory",
    icon: Warehouse,
    allowedRoles: ["admin", "manager", "warehouse_keeper", "purchaser"],
  },
  {
    name: "Compras",
    href: "/purchases",
    icon: Truck,
    allowedRoles: ["admin", "manager", "purchaser", "accountant"],
  },
  {
    name: "Clientes",
    href: "/customers",
    icon: Users,
    allowedRoles: ["admin", "manager", "cashier", "seller", "accountant"],
  },
  {
    name: "Proveedores",
    href: "/suppliers",
    icon: Building2,
    allowedRoles: ["admin", "manager", "purchaser", "accountant"],
  },
  {
    name: "Reportes",
    href: "/reports",
    icon: BarChart3,
    allowedRoles: ["admin", "manager", "accountant"],
  },
  {
    name: "Facturacion",
    href: "/invoicing",
    icon: FileText,
    allowedRoles: ["admin", "manager", "accountant"],
  },
  {
    name: "Apartados",
    href: "/layaways",
    icon: Handshake,
    allowedRoles: ["admin", "manager", "cashier", "seller"],
  },
  {
    name: "Configuracion",
    href: "/settings",
    icon: Settings,
    allowedRoles: ["admin", "manager"],
  },
];

export function AppSidebar() {
  const { company } = useAuth();
  const role = (company?.role as AppRole | undefined) ?? "seller";
  const visibleNavigation = navigation.filter((item) => item.allowedRoles.includes(role));

  return (
    <aside className="hidden w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
          <ShoppingCart className="h-4 w-4 text-sidebar-primary-foreground" />
        </div>
        <span className="text-lg font-bold text-sidebar-foreground">POS SaaS</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {visibleNavigation.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <p className="text-xs text-sidebar-foreground/50">v0.1.0</p>
      </div>
    </aside>
  );
}
