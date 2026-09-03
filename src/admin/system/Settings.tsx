import { useEffect, useState } from "react";
import { apiService } from "@/services/api";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, AlertCircle, CheckCircle2, Loader2, Info, RotateCcw } from "lucide-react";

interface Setting {
  setting_key: string;
  setting_value: string;
  description?: string;
  updated_at?: string;
}

export default function SystemSettings() {
  const [settings, setSettings] = useState({
    top_up_loan_coverage: "",
  });
  const [originalSettings, setOriginalSettings] = useState({
    top_up_loan_coverage: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Fetch current settings
  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const res = await apiService.get<{ data: Setting }>("/settings/top_up_loan_coverage");
      
      if (res?.data) {
        const coverageValue = res.data.setting_value || "";
        setSettings({ top_up_loan_coverage: coverageValue });
        setOriginalSettings({ top_up_loan_coverage: coverageValue });
        setLastUpdated(res.data.updated_at || null);
      }
    } catch (error: any) {
      console.error("Failed to load settings:", error);
      toast.error("Failed to load settings", {
        description: error?.response?.data?.message || "Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Check for changes
  useEffect(() => {
    const changed = settings.top_up_loan_coverage !== originalSettings.top_up_loan_coverage;
    setHasChanges(changed);
  }, [settings, originalSettings]);

  // Validate input
  const validateCoverage = (value: string): boolean => {
    setValidationError("");
    
    if (!value || value.trim() === "") {
      setValidationError("Coverage percentage is required");
      return false;
    }

    const numValue = parseFloat(value);
    
    if (isNaN(numValue)) {
      setValidationError("Please enter a valid number");
      return false;
    }

    if (numValue < 0) {
      setValidationError("Coverage percentage cannot be negative");
      return false;
    }

    if (numValue > 100) {
      setValidationError("Coverage percentage cannot exceed 100%");
      return false;
    }

    return true;
  };

  // Handle input change
  const handleInputChange = (value: string) => {
    setSettings({ top_up_loan_coverage: value });
    if (value) {
      validateCoverage(value);
    } else {
      setValidationError("");
    }
  };

  // Update setting
  const handleSave = async () => {
    if (!validateCoverage(settings.top_up_loan_coverage)) {
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        setting_key: "top_up_loan_coverage",
        setting_value: settings.top_up_loan_coverage,
        description: "Top-up loan coverage percentage",
      };

      const res = await apiService.post("/settings", payload);
      
      if (res?.message || res?.data) {
        setOriginalSettings({ ...settings });
        setLastUpdated(new Date().toISOString());
        
        toast.success("Setting updated successfully!", {
          description: `Coverage set to ${settings.top_up_loan_coverage}%`,
          icon: <CheckCircle2 className="h-4 w-4" />,
        });
      }
    } catch (error: any) {
      console.error("Failed to save setting:", error);
      toast.error("Failed to save setting", {
        description: error?.response?.data?.message || "Please try again",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to original values
  const handleReset = () => {
    setSettings({ ...originalSettings });
    setValidationError("");
    toast.info("Changes discarded");
  };

  // Format last updated date
  const formatLastUpdated = (dateString: string | null): string => {
    if (!dateString) return "Never";
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return "Unknown";
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure system-wide parameters and behaviors
        </p>
      </div>

      {/* Main Settings Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Loan Configuration</CardTitle>
              <CardDescription className="mt-1">
                Configure top-up loan eligibility and coverage settings
              </CardDescription>
            </div>
            {lastUpdated && (
              <Badge variant="outline" className="text-xs">
                Last updated: {formatLastUpdated(lastUpdated)}
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              What percentage of an existing loan balance 
              must be cleared before a member qualifies for a top-up loan.
            </AlertDescription>
          </Alert>

          <Separator />

          {/* Coverage Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="coverage" className="text-base font-semibold">
                Top-up Loan Coverage
              </Label>
              <Badge variant="secondary">Required</Badge>
            </div>
            
            <div className="space-y-2">
              <div className="relative">
                <Input
                  id="coverage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={settings.top_up_loan_coverage}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="Enter coverage percentage (0-100)"
                  className={`pr-12 ${validationError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                  %
                </div>
              </div>
              
              {validationError && (
                <div className="flex items-start gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}
              
              {!validationError && settings.top_up_loan_coverage && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Members must have cleared {settings.top_up_loan_coverage}% of their 
                  existing loan to qualify for a top-up
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges || isSaving}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>

            <Button
              onClick={handleSave}
              disabled={isSaving || !hasChanges || !!validationError}
              className="gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>

          {/* Changes Indicator */}
          {hasChanges && !isSaving && (
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                You have unsaved changes. Click "Save Changes" to apply them.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

   
    </div>
  );
}