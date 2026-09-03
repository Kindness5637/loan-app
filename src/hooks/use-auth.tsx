import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { apiService } from "@/services/api";
import type { User, UserResponse } from "@/lib/data";
import type { AuthContextType, AuthProviderProps } from "./types/auth.types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isAuthenticated = !!user;
const fetchUserProfile = useCallback(async (): Promise<User | null> => {
  try {
    const response = await apiService.getProfile<UserResponse>();
    const profile = response.data;
    
    // console.log('✅ User profile loaded:', profile);
    
    return profile;
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    await apiService.logout();
    return null;
  }
}, []);

  // Load user profile on initial render if token exists
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const userProfile = await fetchUserProfile();
          setUser(userProfile);
        }
      } catch (error) {
        console.error("Authentication initialization failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [fetchUserProfile]);

const login = async (email: string, password: string) => {
  try {
    setIsLoading(true);
    await apiService.login(email, password);
    const userProfile = await fetchUserProfile();

    if (!userProfile) {
      throw new Error("Failed to load user profile after login");
    }

    setUser(userProfile);
    return { success: true, user: userProfile };
  } catch (error: unknown) {
    console.error("Login failed:", error);
    // Convert error to string
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string' 
        ? error 
        : 'An unknown error occurred during login';
    
    return { 
      success: false, 
      error: errorMessage 
    };
  } finally {
    setIsLoading(false);
  }
};

  const logout = async () => {
    try {
      setIsLoading(true);
      await apiService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      setIsLoading(true);
      const userProfile = await fetchUserProfile();
      setUser(userProfile);
    } catch (error) {
      console.error("Failed to refresh user:", error);
      await logout();
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
