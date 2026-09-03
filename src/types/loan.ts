import { type SetStateAction } from "react";

export interface LoanProfile {
  repaymentMethod: string;
  repayPeriod: number;
  minLoan: number;
  maxLoan: number;
  requiresConsecutiveSavings: boolean;
  consecutiveSavingsMonths: number;
  minimumSavings: number;
  requiresGuarantors: boolean;
  requiredGuaranties: number;
  requiresCollateral: boolean;
  attractsPenalty: boolean;
  penaltyRate: number;
  requiresCrbCertificate: boolean;
  crbPoints: number;
  loanFormCost: number;
}

export interface LoanType {
  id: number;
  organization_id: number;
  loanCode: string;
  loanType: string;
  profile: LoanProfile;
  is_active: number;
  created_at: string;
  updated_at: string;
  interest_rate: string;
}

export interface LoanApplication {
  transaction_reference: any;
  data: SetStateAction<LoanApplication | null>;
  id: number;
  loan_number: string;
  created_at: string;
  borrower_id: number;
  loan_type_id: number;
  principal_amount: string;
  loan_status: string;
  purpose: string;
  collateral: string;
  interest_amount: string;
  interest_method: string;
  loan_duration: number;
  duration_period: string;
  loan_release_date: string | null;
  loan_due_date: string;
  repayment_amount: string;
  balance: string;
  monthly_payment: string;
  arrears_amount: string;
  days_in_arrears: number;
  borrower: {
    id: number;
    full_name: string;
    phone: string;
    email: string | null;
    id_number: number;
    nationality?: string;
  };
  loan_type: {
    id: number;
    loanCode: string;
    loanType: string;
    interest_rate: string;
    profile?: {
      repaymentMethod: string;
      minLoan: number;
      maxLoan: number;
      requiresGuarantors: boolean;
      requiredGuaranties: number;
      penaltyRate: number;
    };
  };
  guarantors: any[];
}