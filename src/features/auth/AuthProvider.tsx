import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface CompanyContext {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface BranchContext {
  id: string;
  name: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  company: CompanyContext | null;
  branch: BranchContext | null;
  setCompany: (company: CompanyContext | null) => void;
  setBranch: (branch: BranchContext | null) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<CompanyContext | null>(() => {
    const stored = localStorage.getItem("pos_company");
    return stored ? JSON.parse(stored) : null;
  });
  const [branch, setBranch] = useState<BranchContext | null>(() => {
    const stored = localStorage.getItem("pos_branch");
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSetCompany = useCallback((c: CompanyContext | null) => {
    setCompany(c);
    if (c) localStorage.setItem("pos_company", JSON.stringify(c));
    else localStorage.removeItem("pos_company");
  }, []);

  const handleSetBranch = useCallback((b: BranchContext | null) => {
    setBranch(b);
    if (b) localStorage.setItem("pos_branch", JSON.stringify(b));
    else localStorage.removeItem("pos_branch");
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    handleSetCompany(null);
    handleSetBranch(null);
  }, [handleSetCompany, handleSetBranch]);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        company,
        branch,
        setCompany: handleSetCompany,
        setBranch: handleSetBranch,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
