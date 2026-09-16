import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useView } from "@/contexts/viewContext";
import { Lock, Mail, Loader2, Eye, EyeOff, AlertCircle, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { isClientOnly } from "@/utils/roleUtils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SLogo from "@/components/SLogo";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
const { login, isLoading: isAuthLoading } = useAuth();
  const [error, setError] = useState("");
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  
  const { setView } = useView();
  const navigate = useNavigate();

  // Handle rate limit countdown
  const startRateLimitCountdown = (seconds: number = 60) => {
    setIsRateLimited(true);
    setRateLimitCountdown(seconds);
    
    const interval = setInterval(() => {
      setRateLimitCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsRateLimited(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isRateLimited) {
      toast.error("Too many attempts", {
        description: `Please wait for ${rateLimitCountdown} seconds before trying again.`,
      });
      return;
    }

    setError("");

    try {
      const result = await login(email, password);

      if (result.user) {
        // Determine the correct view based on user roles
        const shouldBeClient = isClientOnly(result.user.roles);
        const targetView = shouldBeClient ? "client" : "admin";
        
        // Set view context BEFORE navigation
        setView(targetView);

        
        // Determine navigation route
        const dashboardRoute = shouldBeClient ? "/client" : "/";

        setTimeout(() => {
          toast.success("Welcome back!", {
            description: `Redirecting to your ${shouldBeClient ? 'client' : 'admin'} dashboard...`,
            duration: 2000,
          });
          navigate(dashboardRoute, { replace: true });
        }, 1000);
      }

      if (!result.success) {
        // Check if it's a rate limit error
        const errorMessage = result.error?.toString() || "";
        
        if (errorMessage.toLowerCase().includes("too many") || 
            errorMessage.toLowerCase().includes("rate limit") ||
            errorMessage.toLowerCase().includes("429")) {
          setError("Too many login attempts. Please wait before trying again.");
          startRateLimitCountdown(60);
          toast.error("Rate limit exceeded", {
            description: "Too many login attempts. Please wait 60 seconds.",
            duration: 3000,
          });
        }else {
          setError("Invalid email or password. Please try again.");
          toast.error("Invalid email or password", {
            description: "Please check your credentials.",
          });
        }
        return;
      }

    } catch (error: unknown) {
      console.error("Login error:", error);
      
      // Handle network errors
      if (
        error instanceof Error && error.message.toLowerCase().includes("network") || 
        error instanceof Error && error.message.toLowerCase().includes("fetch")) {
        setError("Network error. Please check your internet connection.");
        toast.error("Connection error", {
          description: "Unable to connect to the server. Please try again.",
        });
      } else {
        setError("An unexpected error occurred. Please try again later.");
        toast.error("Login error", {
          description: "An unexpected error occurred. Please try again later.",
        });
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="light">
      <div className="min-h-screen bg-[#001D4C] flex items-center justify-center min-w-screen p-4">
        <div className="w-full max-w-md space-y-6 border border-white/30 px-4 py-6 shadow-lg rounded-lg bg-white/90 backdrop-blur-sm">
          <div className="min-w-content space-y-2">
            <SLogo />
          </div>

          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader>
              <CardTitle className="text-gray-900">Sign In</CardTitle>
              <CardDescription className="text-gray-600">
                Enter your credentials to access the dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Rate Limit Alert */}
                {isRateLimited && (
                  <Alert variant="destructive" className="bg-red-50 border-red-200">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Too many login attempts. Please wait {rateLimitCountdown} seconds.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                      required
                      disabled={isAuthLoading || isRateLimited}
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                      required
                      disabled={isAuthLoading || isRateLimited}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none disabled:opacity-50"
                      disabled={isAuthLoading || isRateLimited}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && !isRateLimited && (
                  <Alert variant="destructive" className="bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full text-white" 
                  disabled={isAuthLoading || isRateLimited}
                >
                  {isAuthLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : isRateLimited ? (
                    <>Wait {rateLimitCountdown}s</>
                  ) : (
                    "Sign In"
                  )}
                </Button>

                {/* Forgot Password Link */}
                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline focus:outline-none disabled:opacity-50"
                    disabled={isAuthLoading || isRateLimited}
                    onClick={() => {
                      toast.info("Contact Support", {
                        description: "Please contact your administrator to reset your password.",
                      });
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-xs text-gray-500">
            <p>© {new Date().getFullYear()} Stalis LoanPro. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}