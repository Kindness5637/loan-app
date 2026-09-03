import { useEffect, useState } from 'react';
import { DollarSign, Calendar, Shield, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { LoanType } from '@/types/loan';
import { apiService } from '@/services/api';
import { toast } from 'react-toastify';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';

interface LoanTypeModalProps {
  loanCode: string | null;
  open: boolean;
  onClose: () => void;
}

export function LoanTypeModal({ loanCode, open, onClose }: LoanTypeModalProps) {
  const [loanType, setLoanType] = useState<LoanType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && loanCode) {
      fetchLoanTypeDetails();
    }
  }, [open, loanCode]);

  const fetchLoanTypeDetails = async () => {
    if (!loanCode) return;

    try {
      setIsLoading(true);
      const response = await apiService.get<{ data: LoanType }>(`/loan-types/${loanCode}`);
      setLoanType(response.data);
    } catch (error: any) {
      console.error('Failed to fetch loan type details:', error);
      toast.error('Failed to load loan details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading loan details...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!loanType) {
    return null;
  }

  const { profile } = loanType;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold mb-2">
                {loanType.loanType}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  {loanType.loanCode}
                </Badge>
                <span
                    className={cn(
                    "px-4 py-1 rounded-full text-white text-xs font-medium",
                    loanType.is_active ? "bg-green-500" : "bg-yellow-400"
                    )}
                >
                    {loanType.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Key Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Interest Rate</h3>
              </div>
              <p className="text-2xl font-bold text-primary">{loanType.interest_rate}%</p>
            </div>

            <div className="p-4 rounded-lg bg-accent/5 border border-accent/10">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5" />
                <h3 className="font-semibold">Repayment Period</h3>
              </div>
              <p className="text-2xl font-bold ">{profile.repayPeriod} months</p>
            </div>
          </div>

          <Separator />

          {/* Loan Limits */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Loan Limits</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoCard
                label="Minimum Loan"
                value={formatCurrency(profile.minLoan)}
              />
              <InfoCard
                label="Maximum Loan"
                value={formatCurrency(profile.maxLoan)}
              />
              <InfoCard
                label="Repayment Method"
                value={profile.repaymentMethod}
              />
            </div>
          </div>

          <Separator />

          {/* Requirements */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Requirements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <RequirementItem
                label="Consecutive Savings"
                value={profile.requiresConsecutiveSavings}
                details={profile.requiresConsecutiveSavings ? `${profile.consecutiveSavingsMonths} months` : undefined}
              />
              <RequirementItem
                label="Minimum Savings"
                value={profile.requiresConsecutiveSavings}
                details={profile.requiresConsecutiveSavings ? formatCurrency(profile.minimumSavings) : undefined}
              />
              <RequirementItem
                label="Guarantors"
                value={profile.requiresGuarantors}
                details={profile.requiresGuarantors ? `${profile.requiredGuaranties}% required` : undefined}
              />
              <RequirementItem
                label="Collateral"
                value={profile.requiresCollateral}
              />
              <RequirementItem
                label="CRB Certificate"
                value={profile.requiresCrbCertificate}
                details={profile.requiresCrbCertificate ? `${profile.crbPoints} points` : undefined}
              />
            </div>
          </div>

          <Separator />

          {/* Penalties and Fees */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Penalties & Fees
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCard
                label="Penalty Rate"
                value={profile.attractsPenalty ? `${profile.penaltyRate}%` : 'No penalties'}
                variant={profile.attractsPenalty ? 'warning' : 'success'}
              />
              <InfoCard
                label="Loan Form Cost"
                value={formatCurrency(profile.loanFormCost)}
              />
            </div>
          </div>

          <Separator />

          {/* Metadata */}
          <div className="text-sm text-muted-foreground">
            <p>Created: {new Date(loanType.created_at).toLocaleString()}</p>
            <p>Last Updated: {new Date(loanType.updated_at).toLocaleString()}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper Components
interface InfoCardProps {
  label: string;
  value: string;
  variant?: 'default' | 'success' | 'warning';
}

function InfoCard({ label, value, variant = 'default' }: InfoCardProps) {
  const variantClasses = {
    default: 'bg-muted/50 border-border',
    success: 'bg-success/5 border-success/20',
    warning: 'bg-warning/5 border-warning/20',
  };

  return (
    <div className={`p-3 rounded-md border ${variantClasses[variant]}`}>
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

interface RequirementItemProps {
  label: string;
  value: boolean;
  details?: string;
}

function RequirementItem({ label, value, details }: RequirementItemProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-md border bg-card">
      <div>
        <p className="font-medium">{label}</p>
        {details && <p className="text-sm text-muted-foreground">{details}</p>}
      </div>
        <span
          className={cn(
            "px-4 py-1 rounded-full text-white text-xs font-medium",
            value ? "bg-red-500" : "bg-yellow-400"
          )}
        >
          {value ? "Required" : "Not Required"}
        </span>
    </div>
  );
}
