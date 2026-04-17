import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/features/auth";
import { ProtectedRoute } from "@/features/auth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "@/features/auth/pages/LoginPage";
import RegisterPage from "@/features/auth/pages/RegisterPage";
import ForgotPasswordPage from "@/features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/features/auth/pages/ResetPasswordPage";
import SelectCompanyPage from "@/features/auth/pages/SelectCompanyPage";
import OnboardingPage from "@/features/auth/pages/OnboardingPage";
import CatalogsSettingsPage from "@/features/settings/pages/CatalogsSettingsPage";
import ProductsPage from "@/features/products/pages/ProductsPage";
import InventoryPage from "@/features/inventory/pages/InventoryPage";
import SuppliersPage from "@/features/suppliers/pages/SuppliersPage";
import PurchasesPage from "@/features/purchases/pages/PurchasesPage";
import POSPage from "@/features/pos/pages/POSPage";
import CustomersPage from "@/features/customers/pages/CustomersPage";
import ReportsPage from "@/features/reports/pages/ReportsPage";
import CashRegisterPage from "@/features/cash-register/pages/CashRegisterPage";
import InvoicingPage from "@/features/invoicing/pages/InvoicingPage";
import LayawaysPage from "@/features/layaways/pages/LayawaysPage";
import LayawayDetailPage from "@/features/layaways/pages/LayawayDetailPage";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  { path: "/auth/login", element: <LoginPage /> },
  { path: "/auth/register", element: <RegisterPage /> },
  { path: "/auth/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  { path: "/auth/select-company", element: <SelectCompanyPage /> },
  { path: "/onboarding", element: <OnboardingPage /> },
  {
    path: "/",
    element: <ProtectedRoute><Index /></ProtectedRoute>,
  },
  {
    path: "/settings",
    element: <ProtectedRoute><CatalogsSettingsPage /></ProtectedRoute>,
  },
  {
    path: "/products",
    element: <ProtectedRoute><ProductsPage /></ProtectedRoute>,
  },
  {
    path: "/inventory",
    element: <ProtectedRoute><InventoryPage /></ProtectedRoute>,
  },
  {
    path: "/suppliers",
    element: <ProtectedRoute><SuppliersPage /></ProtectedRoute>,
  },
  {
    path: "/customers",
    element: <ProtectedRoute><CustomersPage /></ProtectedRoute>,
  },
  {
    path: "/purchases",
    element: <ProtectedRoute><PurchasesPage /></ProtectedRoute>,
  },
  {
    path: "/pos",
    element: <ProtectedRoute><POSPage /></ProtectedRoute>,
  },
  {
    path: "/reports",
    element: <ProtectedRoute><ReportsPage /></ProtectedRoute>,
  },
  {
    path: "/cash-register",
    element: <ProtectedRoute><CashRegisterPage /></ProtectedRoute>,
  },
  {
    path: "/invoicing",
    element: <ProtectedRoute><InvoicingPage /></ProtectedRoute>,
  },
  {
    path: "/layaways",
    element: <ProtectedRoute><LayawaysPage /></ProtectedRoute>,
  },
  {
    path: "/layaways/:id",
    element: <ProtectedRoute><LayawayDetailPage /></ProtectedRoute>,
  },
  { path: "*", element: <NotFound /> }
]);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;