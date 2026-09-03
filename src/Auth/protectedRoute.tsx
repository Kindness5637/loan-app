import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useView } from "@/contexts/viewContext";
import { isClientOnly } from "@/utils/roleUtils";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { currentView, setView } = useView();
  const location = useLocation();

  // Ensure view matches user roles
  useEffect(() => {
    if (user && isAuthenticated) {
      const shouldBeClient = isClientOnly(user.roles);
      const correctView = shouldBeClient ? "client" : "admin";

      if (currentView !== correctView) {
        setView(correctView);
      }
    }
  }, [user, isAuthenticated, currentView, setView]);

  // Show nothing while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Prevent client-only users from accessing admin routes
  if (user && isClientOnly(user.roles) && !location.pathname.startsWith("/client")) {
    return <Navigate to="/client" replace />;
  }

  if (user && !isClientOnly(user.roles) && location.pathname.startsWith("/client") && currentView === "admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}