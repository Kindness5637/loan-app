import "./App.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import { ProtectedRoute } from "./Auth/protectedRoute.tsx";
import { LoginForm } from "./Auth/LoginForm.tsx";
import { ErrorBoundary } from "@/lib/errorBoundaries.tsx";
import { BreadcrumbProvider } from "@/contexts/BreadcrumbContext";
import { Toaster } from "@/components/ui/sonner";
import { ViewProvider, useView } from "./contexts/viewContext";

import AdminRoutes from "@/admin/AdminRoutes";
import UserRoutes from "./user/UserRoutes";
import { NotificationProvider } from "./user/contexts/NotificationContext.tsx";
import { Route, Routes, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { isClientOnly } from "@/utils/roleUtils";

// Component that safely uses the ViewContext
function AppContent() {
  const { currentView, setView } = useView();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Sync view with user roles - runs only when user changes
  useEffect(() => {
    if (!user || !isAuthenticated) return;

    const shouldBeClient = isClientOnly(user.roles);
    const correctView = shouldBeClient ? "client" : "admin";


    // Only update if view is incorrect
    if (currentView !== correctView) {
      setView(correctView);
      
      // Navigate to appropriate dashboard
      const targetRoute = shouldBeClient ? "/client" : "/";
      navigate(targetRoute, { replace: true });
    }
  }, [user?.id, isAuthenticated, user, currentView, setView, navigate]); // Only re-run when user ID changes

  return (
    <>
      <Routes>
        {/* Public login route */}
        <Route path="/login" element={<LoginForm />} />

        {/* Protected routes - all authenticated routes go through here */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              {currentView === "admin" ? <AdminRoutes /> : <UserRoutes />}
            </ProtectedRoute>
          }
        />
      </Routes>
      <Toaster />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider defaultTheme="system" storageKey="lams-ui-theme">
          <BreadcrumbProvider>
            <ViewProvider>
              <SidebarProvider>
                <NotificationProvider>
                  <AppContent />
                </NotificationProvider>
              </SidebarProvider>
            </ViewProvider>
          </BreadcrumbProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;