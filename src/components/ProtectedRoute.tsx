import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setTimedOut(true), 10000);
      return () => clearTimeout(timer);
    }
    setTimedOut(false);
  }, [isLoading]);

  if (isLoading && !timedOut) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if ((!isLoading && !isAuthenticated) || timedOut) {
    return <Navigate to="/login" replace />;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">Unable to connect. Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
