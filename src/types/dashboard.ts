export interface LoanApplication {
  id: number;
  loan_number: string;
  created_at: string;
  borrower_id: number;
  loan_type_id: number;
  principal_amount: string;
  loan_status: string;
  purpose: string;
  interest_amount: string;
  unpaid_interest: string;
  balance: string;
  monthly_payment: string;
  borrower: {
    id: number;
    full_name: string;
    phone: string;
    email: string | null;
  };
  loan_type: {
    id: number;
    loanCode: string;
    loanType: string;
    interest_rate: string;
  };
}

export interface Member {
  id: string;
  full_name: string;
  firstName: string;
  lastName: string;
  creationDate: string;
  state?: string;
  loanCycle?: number;
  _Client_Details?: {
    monthly_income?: string;
    ocupation?: string;
  };
}

export interface LoanProduct {
  id: number;
  loanCode: string;
  loanType: string;
  interest_rate: string;
  is_active: number;
}

export interface DashboardMetrics {
  [x: string]: string | number;
  totalLoans: number;
  pendingApprovals: number;
  totalPortfolioValue: number;
  totalOutstanding: number;
  activeMembers: number;
  totalMembers: number;
  averageLoanSize: number;
  collectionRate: number;
  totalInterestReceived: number; 
  disbursedLoans: number;
  // closedLoans: number;
}

export interface DashboardError {
  hasError: boolean;
  message: string;
  section?: "all" | "loans" | "members" | "products";
}