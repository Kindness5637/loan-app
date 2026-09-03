import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type ViewType = "admin" | "client";

interface ViewContextType {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  switchUser: () => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export function ViewProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<ViewType>(() => {
    // Initialize from localStorage or default to admin
    const stored = localStorage.getItem("currentView");
    return (stored === "client" || stored === "admin") ? stored : "admin";
  });

  // Direct setter that updates both state and localStorage
  const setView = useCallback((view: ViewType) => {
    console.log(`🔄 ViewContext: Setting view to ${view}`);
    setCurrentView(view);
    localStorage.setItem("currentView", view);
  }, []);

  // Toggle between admin and client views
  const switchUser = useCallback(() => {
    const newView = currentView === "admin" ? "client" : "admin";
    console.log(`🔄 ViewContext: Switching view from ${currentView} to ${newView}`);
    setView(newView);
  }, [currentView, setView]);

  const value = {
    currentView,
    setView,
    switchUser,
  };

  return (
    <ViewContext.Provider value={value}>
      {children}
    </ViewContext.Provider>
  );
}

export function useView() {
  const context = useContext(ViewContext);
  if (!context) {
    throw new Error("useView must be used within a ViewProvider");
  }
  return context;
}