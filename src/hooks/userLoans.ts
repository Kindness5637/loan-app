import { useState, useEffect, useCallback } from "react";
import { apiService } from "@/services/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export interface Loan {
  id: number;
  loan_number: string;
  purpose: string;
  loan_status: string;
  principal_amount: string;
  interest_amount: string;
  balance: string;
  monthly_payment: string;
  loan_duration: number;
  loan_release_date: string;
  loan_due_date: string;
  loan_type_id: number;
  loan_type?: {
    loanType: string;
    interest_rate: number;
  };
  borrower?: {
    id: number;
    CardCode: string;
    full_name: string;
  };
}

export interface LoanMetrics {
  activeLoans: Loan[];
  pendingLoans: Loan[];
  completedLoans: Loan[];
  rejectedLoans: Loan[];
  allLoans: Loan[];
  totalBorrowed: number;
  totalOutstanding: number;
  totalPaid: number;
  repaymentRate: number;
  lifetimeBorrowed: number;
}

export function useUserLoans() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLoans = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const userCardCode = user?.businesspartner?.CardCode;

      if (!userCardCode) {
        console.warn("User CardCode not found");
        setLoans([]);
        return;
      }


      const response = await apiService.get('/loan-applications');

      // Normalize and filter loans by borrower's CardCode
      const userLoans = response.data.filter((loan: Loan) => {
        const borrowerCardCode = loan.borrower?.CardCode;

        // Normalize both values for robust comparison
        const normalizedUserCode = String(userCardCode).trim().toLowerCase();
        const normalizedBorrowerCode = String(borrowerCardCode || '').trim().toLowerCase();

        return normalizedBorrowerCode === normalizedUserCode;
      });

      setLoans(userLoans);

      if (userLoans.length === 0) {
        console.warn(" No loans found for this user");
      }
    } catch (err) {
      console.error(" Failed to fetch loans:", err);
      setError("Failed to load loans. Please try again later.");
      toast.error("Failed to load loans", {
        description: "Please try again later or contact support.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Auto-fetch on mount and when user changes
  useEffect(() => {
    if (user?.businesspartner?.CardCode) {
      fetchLoans();
    }
  }, [user?.businesspartner?.CardCode, fetchLoans]);

  // Calculate metrics from loans
  const metrics: LoanMetrics = {
    activeLoans: loans.filter((loan) => loan.loan_status === "active"),
    pendingLoans: loans.filter(
      (loan) =>
        loan.loan_status === "pending" ||
        loan.loan_status === "pending-approval" ||
        loan.loan_status === "under_review"
    ),
    completedLoans: loans.filter((loan) => loan.loan_status === "completed"),
    rejectedLoans: loans.filter((loan) => loan.loan_status === "rejected"),
    allLoans: loans,
    totalBorrowed: 0,
    totalOutstanding: 0,
    totalPaid: 0,
    repaymentRate: 0,
    lifetimeBorrowed: 0,
  };

  // Calculate active loan metrics
  const activeLoans = metrics.activeLoans;
  metrics.totalBorrowed = activeLoans.reduce(
    (sum, loan) => sum + parseFloat(loan.principal_amount),
    0
  );

  metrics.totalOutstanding = activeLoans.reduce(
    (sum, loan) => sum + parseFloat(loan.balance),
    0
  );

  metrics.totalPaid = metrics.totalBorrowed - metrics.totalOutstanding;

  metrics.repaymentRate =
    metrics.totalBorrowed > 0
      ? (metrics.totalPaid / metrics.totalBorrowed) * 100
      : 0;

  // Calculate lifetime borrowed (including completed loans)
  metrics.lifetimeBorrowed = [...activeLoans, ...metrics.completedLoans].reduce(
    (sum, loan) => sum + parseFloat(loan.principal_amount),
    0
  );

  return {
    loans,
    metrics,
    isLoading,
    error,
    refetch: fetchLoans,
  };
}