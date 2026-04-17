import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, company, branch } = useAuth();
  const location = useLocation();
  const [initialUser, setInitialUser] = useState(user);

  useEffect(() => {
    if (user && !initialUser) setInitialUser(user);
  }, [user, initialUser]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user && !initialUser) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if ((!company || !branch) && location.pathname !== "/auth/select-company") {
    return <Navigate to="/auth/select-company" replace />;
  }

  const isSessionExpired = initialUser && !user;

  return (
    <>
      {isSessionExpired && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-background p-6 rounded-lg text-center max-w-sm border shadow-xl">
             <h2 className="text-xl font-bold mb-2">Sesión Expirada</h2>
             <p className="text-sm text-muted-foreground mb-4">Tu sesión de seguridad ha caducado. Por favor, renuévala en otra pestaña o vuelve a Iniciar Sesión para no desechar tus cambios.</p>
             <button onClick={() => window.location.href = '/auth/login'} className="bg-primary text-primary-foreground text-sm px-4 py-2 rounded-md font-semibold w-full hover:opacity-90 transition-opacity">
                Ir al Login
             </button>
          </div>
        </div>
      )}
      <div className={isSessionExpired ? "pointer-events-none opacity-50 blur-sm select-none transition-all duration-300" : ""}>
        {children}
      </div>
    </>
  );
}
