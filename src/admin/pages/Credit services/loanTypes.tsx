import { useState } from 'react';
import { Eye, XCircle } from 'lucide-react';
import { DataTable, type DataTableConfig } from "@/components/DataTablePage"
import { LoanTypeModal } from '@/components/LoanModal';
import type { LoanType } from '@/types/loan';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

//  interface LoanProfile {
//   repaymentMethod: string;
//   repayPeriod: number;
//   minLoan: number;
//   maxLoan: number;
//   requiresConsecutiveSavings: boolean;
//   consecutiveSavingsMonths: number;
//   minimumSavings: number;
//   requiresGuarantors: boolean;
//   requiredGuaranties: number;
//   requiresCollateral: boolean;
//   attractsPenalty: boolean;
//   penaltyRate: number;
//   requiresCrbCertificate: boolean;
//   crbPoints: number;
//   loanFormCost: number;
// }


export default function LoanTypes() {
  const [selectedLoanCode, setSelectedLoanCode] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleViewDetails = (loanType: LoanType) => {
    setSelectedLoanCode(loanType.loanCode);
    setModalOpen(true);
  };

  const DeleteLoan = async () => {
    //delete Loan type
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const config: DataTableConfig<LoanType> = {
    title: 'Loan Types',
    description: 'Manage and view all available loan products',
    emptyStateMessage: 'No loan types have been configured yet',
    apiEndpoint: '/loan-types',
    
    searchPlaceholder: 'Search by loan code or type...',
    searchKeys: ['loanCode', 'loanType'],
    
    stats: [
      {
        label: 'Total Loan Types',
        getValue: (data) => data.length,
      },
      {
        label: 'Active Loans',
        getValue: (data) => data.filter((loan: LoanType) => loan.is_active === 1).length,
      },
      {
        label: 'Avg Interest Rate',
        getValue: (data) => {
          if (data.length === 0) return '0%';
          const avg = data.reduce((sum: number, loan: LoanType) => 
            sum + parseFloat(loan.interest_rate), 0) / data.length;
          return `${avg.toFixed(2)}%`;
        },
      },
      {
        label: 'Max Loan Amount',
        getValue: (data) => {
          if (data.length === 0) return formatCurrency(0);
          const max = Math.max(...data.map((loan: LoanType) => loan.profile.maxLoan));
          return formatCurrency(max);
        },
      },
    ],
    
    columns: [
      {
        key: 'loanCode',
        label: 'Loan Code',
        render: (item) => (
          <Badge variant="outline" className="font-mono">
            {item.loanCode}
          </Badge>
        ),
      },
      {
        key: 'loanType',
        label: 'Loan Type',
        render: (item) => (
          <span className="font-medium">{item.loanType}</span>
        ),
      },
      {
        key: 'interest_rate',
        label: 'Interest Rate',
        render: (item) => (
          <span className="font-semibold text-primary">{item.interest_rate}%</span>
        ),
      },
      {
        key: 'profile',
        label: 'Loan Range',
        render: (item) => (
          <div className="text-sm">
            <div>{formatCurrency(item.profile.minLoan)}</div>
            <div className="text-muted-foreground">to {formatCurrency(item.profile.maxLoan)}</div>
          </div>
        ),
      },
      {
        key: 'profile',
        label: 'Repayment',
        render: (item) => (
          <div className="text-sm">
            <div>{item.profile.repayPeriod} months</div>
            <div className="text-muted-foreground">{item.profile.repaymentMethod}</div>
          </div>
        ),
      },
      {
        key: 'is_active',
        label: 'Status',
        render: (item) => (
          <span
            className={cn(
              "px-4 py-1 rounded-full text-white text-xs font-medium",
              item.is_active ? "bg-green-500" : "bg-yellow-400"
            )}
          >
            {item.is_active ? "Active" : "Inactive"}
          </span>

        ),
      },
    ],
    
    actions: [
      {
        label: 'View Details',
        icon: <Eye className="h-4 w-4" />,
        onClick: handleViewDetails,
      },
      {
        label: 'Reject Loan',
        icon: <XCircle className="h-4 w-4" />,
        onClick: DeleteLoan,
      },
    ],
  };

  return (
    <>
      <DataTable<LoanType> config={config} />
      <LoanTypeModal
        loanCode={selectedLoanCode}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedLoanCode(null);
        }}
      />
    </>
  );
}
