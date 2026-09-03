import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  User, 
  DollarSign, 
  Calendar, 
  FileText, 
  Clock, 
  AlertCircle,
  Printer,
  CheckCircle,
  Send,
  XCircle,
  HandCoins,
  Banknote,
  Wallet
} from 'lucide-react';
import { type LoanApplication } from '@/types/loan';
import { formatCurrency, formatDate } from '@/lib/utils';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { printStyles } from '@/components/common/print';
import { ConfirmDialog } from '@/components/confirmDialog';
import { RepaymentDialog } from '@/components/loans/RepaymentDialog';
import { PayoffDialog } from '@/components/loans/PayoffDialog';
import { OffsetDialog } from '@/components/loans/OffsetDialog';

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    'pending-approval': 'bg-yellow-100 text-yellow-800',
    'approved': 'bg-green-800 text-white',
    'active': 'bg-green-500 text-black-800',
    'closed': 'bg-gray-100 text-gray-800',
    'rejected': 'bg-red-100 text-red-800',
    'disbursed': 'bg-green-100 text-green-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

const getStatusText = (status: string) => {
  return status ? status.replace('-', ' ').toUpperCase() : 'N/A';
};

export default function LoanDetails() {
  const { loanNumber } = useParams<{ loanNumber: string }>();
  const [loan, setLoan] = useState<LoanApplication | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    loan: LoanApplication | null;
  }>({
    open: false,
    loan: null,
  });
  
  const [repaymentState, setRepaymentState] = useState<{ open: boolean; loan: LoanApplication | null }>({ open: false, loan: null });
  const [payoffState, setPayoffState] = useState<{ open: boolean; loan: LoanApplication | null }>({ open: false, loan: null });
  const [offsetState, setOffsetState] = useState<{ open: boolean; loan: LoanApplication | null }>({ open: false, loan: null });
  const [disburseDialog, setDisburseDialog] = useState<{ open: boolean; loan: LoanApplication | null }>({ open: false, loan: null });

  useEffect(() => {
    fetchLoanDetails();
  }, [loanNumber]);

  const fetchLoanDetails = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<LoanApplication>(`/loan-applications/${loanNumber}`);
      setLoan(response.data);
    } catch (error) {
      toast.error('Failed to load loan details');
      console.error('Error fetching loan:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveLoan = async (loan: LoanApplication) => {
    try {
      const response = await apiService.post(`/${loan.loan_number}/approve`, loan);
      if (response.status === 200) {
        toast.success("Loan approved successfully");
        fetchLoanDetails(); // Refresh loan details
      } else {
        toast.error('Approval not successful');
      }
    } catch (error) {
      toast.error(`Error approving loan ${loan.loan_number}`);
    }
  };

  const disburseLoan = async (loan: LoanApplication) => {
    try {
      const data = {
        amount: loan.principal_amount,
        disbursement_method: loan.transaction_reference
      };
      const response = await apiService.post(`/${loan.loan_number}/disburse`, data);
      if ((response as any)?.data != null) {
        toast.success("Loan disbursed successfully");
        fetchLoanDetails(); // Refresh loan details
      } else {
        toast.error('Disbursement not successful');
      }
    } catch (error: any) {
      toast.error(`Error disbursing loan ${loan.loan_number}`);
    }
  };

  const rejectLoan = async (loan: LoanApplication) => {
    try {
      const res = await apiService.post(`/${loan.loan_number}/reject`);
      if (res.data) {
        toast.success("Loan successfully rejected");
        fetchLoanDetails(); // Refresh loan details
      }
    } catch (error) {
      toast.error("Error rejecting loan");
    }
  };

  const handlePrint = () => {
    if (!loan) {
      toast.error('No loan data available to print');
      return;
    }

    // Create a style element and add it to the document
    const styleElement = document.createElement('style');
    styleElement.innerHTML = printStyles;
    document.head.appendChild(styleElement);

    // Add print header
    const existingPrintHeader = document.querySelector('.print-header');
    if (!existingPrintHeader) {
      const printHeader = document.createElement('div');
      printHeader.className = 'print-header';
      printHeader.innerHTML = `
        <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Loan Application Details</h1>
        <p style="margin: 5px 0; font-size: 14px;">Generated on ${new Date().toLocaleDateString()}</p>
        <p style="margin: 5px 0; font-size: 14px;">Loan Number: ${loan.loan_number}</p>
      `;
      document.body.insertBefore(printHeader, document.body.firstChild);
    }

    // Trigger print
    window.print();

    // Clean up after printing
    const cleanup = () => {
      document.head.removeChild(styleElement);
      const printHeader = document.querySelector('.print-header');
      if (printHeader) {
        document.body.removeChild(printHeader);
      }
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loan not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Hidden during print */}
      <Card className="border-b-solid p-6 shadow-lg no-print">
        <div className="border-b-solid max-w-7xl mx-auto">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-1">Loan Details</h1>
              <p className="opacity-90">Loan Number: {loan.loan_number}</p>
            </div>
            <Button 
              onClick={handlePrint}
              className="flex border border-b-solid items-center bg-background text-foreground px-4 py-2 rounded-lg hover:opacity-70 transition font-medium"
            >
              <Printer size={18} className="mr-2" />
              Print
            </Button>
          </div>
        </div>
      </Card>

      {/* Content - Visible during print */}
      <div className="max-w-8xl mx-auto p-6">
        {/* Status Badge and Action Buttons */}
        <div className="mb-6 break-inside-avoid flex justify-between items-center">
          <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(loan.loan_status)}`}>
            <AlertCircle size={16} className="mr-2" />
            {getStatusText(loan.loan_status)}
          </span>
          
          {/* Action Buttons */}
          <div className="flex gap-2 no-print">
            {/* Pending approval actions */}
            {loan.loan_status === 'pending-approval' && (
              <>
                <Button
                  onClick={() => setConfirmDialog({ open: true, loan })}
                  className="flex items-center gap-2"
                  variant="default"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve Loan
                </Button>
                <Button
                  onClick={() => rejectLoan(loan)}
                  className="flex items-center gap-2"
                  variant="destructive"
                >
                  <XCircle className="h-4 w-4" />
                  Reject Loan
                </Button>
              </>
            )}

            {/* Approved loan action */}
            {loan.loan_status === 'approved' && (
              <Button
                onClick={() => setDisburseDialog({ open: true, loan })}
                className="flex items-center gap-2"
                variant="default"
              >
                <Send className="h-4 w-4" />
                Disburse Loan
              </Button>
            )}

            {/* Active/disbursed loan actions */}
            {(loan.loan_status === 'active' || loan.loan_status === 'disbursed') && (
              <>
                <Button
                  onClick={() => setRepaymentState({ open: true, loan })}
                  className="flex items-center gap-2"
                  variant="default"
                >
                  <HandCoins className="h-4 w-4" />
                  Repay Loan
                </Button>
                <Button
                  onClick={() => setPayoffState({ open: true, loan })}
                  className="flex items-center gap-2"
                  variant="outline"
                >
                  <Banknote className="h-4 w-4" />
                  Pay Off Loan
                </Button>
                <Button
                  onClick={() => setOffsetState({ open: true, loan })}
                  className="flex items-center gap-2"
                  variant="outline"
                >
                  <Wallet className="h-4 w-4" />
                  Offset Loan
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 break-inside-avoid">
          {/* Borrower Information */}
          <div className="bg-card rounded-lg shadow border p-6 break-inside-avoid">
            <div className="flex items-center mb-4">
              <User className="text-primary mr-2" size={20} />
              <h2 className="text-xl font-semibold">Borrower Information</h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium text-lg">{loan.borrower.full_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone Number</p>
                <p className="font-medium">{loan.borrower.phone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ID Number</p>
                <p className="font-medium">{loan.borrower.id_number}</p>
              </div>
              {loan.borrower.email && (
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{loan.borrower.email}</p>
                </div>
              )}
              {loan.borrower.nationality && (
                <div>
                  <p className="text-sm text-muted-foreground">Nationality</p>
                  <p className="font-medium">{loan.borrower.nationality}</p>
                </div>
              )}
            </div>
          </div>

          {/* Loan Financial Summary */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg shadow border p-6 break-inside-avoid">
            <div className="flex items-center mb-4">
              <DollarSign className="text-primary mr-2" size={20} />
              <h2 className="text-xl font-semibold">Financial Summary</h2>
            </div>
            <div className="space-y-4">
              <div className="bg-card rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Principal Amount</p>
                <p className="font-bold text-2xl text-primary">{formatCurrency(loan.principal_amount)}</p>
              </div>
              <div className="bg-card rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Interest Amount</p>
                <p className="font-bold text-2xl text-green-600">{formatCurrency(loan.interest_amount)}</p>
              </div>
              <div className="bg-card rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Total Repayment</p>
                <p className="font-bold text-2xl text-purple-600">{formatCurrency(loan.repayment_amount)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-card rounded-lg shadow border p-6 mt-6 break-inside-avoid">
          <div className="flex items-center mb-4">
            <DollarSign className="text-primary mr-2" size={20} />
            <h2 className="text-xl font-semibold">Payment Details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Monthly Payment</p>
              <p className="font-bold text-lg">{formatCurrency(loan.monthly_payment)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className="font-bold text-lg">{formatCurrency(loan.balance)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Interest Rate</p>
              <p className="font-bold text-lg">{loan.loan_type.interest_rate}%</p>
            </div>
          </div>
        </div>

        {/* Loan Information */}
        <div className="bg-card rounded-lg shadow border p-6 mt-6 break-inside-avoid">
          <div className="flex items-center mb-4">
            <FileText className="text-primary mr-2" size={20} />
            <h2 className="text-xl font-semibold">Loan Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Loan Type</p>
              <p className="font-medium">{loan.loan_type.loanType} ({loan.loan_type.loanCode})</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Purpose</p>
              <p className="font-medium">{loan.purpose}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Collateral</p>
              <p className="font-medium">{loan.collateral}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Interest Method</p>
              <p className="font-medium">{loan.interest_method}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="font-medium">{loan.loan_duration} {loan.duration_period}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p className="font-medium">{formatDate(loan.loan_due_date)}</p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-card rounded-lg shadow border p-6 mt-6 break-inside-avoid">
          <div className="flex items-center mb-4">
            <Calendar className="text-primary mr-2" size={20} />
            <h2 className="text-xl font-semibold">Timeline</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Application Date</p>
              <p className="font-medium">{formatDate(loan.created_at)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Release Date</p>
              <p className="font-medium">{loan.loan_release_date ? formatDate(loan.loan_release_date) : 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p className="font-medium">{formatDate(loan.loan_due_date)}</p>
            </div>
          </div>
        </div>

        {/* Loan Profile */}
        {loan.loan_type.profile && (
          <div className="bg-card rounded-lg shadow border p-6 mt-6 break-inside-avoid">
            <div className="flex items-center mb-4">
              <Clock className="text-primary mr-2" size={20} />
              <h2 className="text-xl font-semibold">Loan Profile & Requirements</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Repayment Method</p>
                <p className="font-medium">{loan.loan_type.profile.repaymentMethod}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Loan Range</p>
                <p className="font-medium">
                  {formatCurrency(loan.loan_type.profile.minLoan)} - {formatCurrency(loan.loan_type.profile.maxLoan)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Requires Guarantors</p>
                <p className="font-medium">
                  {loan.loan_type.profile.requiresGuarantors ? `Yes (${loan.loan_type.profile.requiredGuaranties}% guarantee)` : 'No'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Penalty Rate</p>
                <p className="font-medium">{loan.loan_type.profile.penaltyRate}%</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDialog({ open: false, loan: null });
          }
        }}
        onConfirm={async () => {
          if (confirmDialog.loan) {
            await approveLoan(confirmDialog.loan);
            setConfirmDialog({ open: false, loan: null });
          }
        }}
        title="Approve Loan"
        description={`Are you sure you want to approve loan #${confirmDialog.loan?.loan_number}?`}
        confirmText="Approve"
        cancelText="Cancel"
      />

      <RepaymentDialog
        open={repaymentState.open}
        onOpenChange={(open) => setRepaymentState({ open, loan: open ? repaymentState.loan : null })}
        loanNumber={repaymentState.loan?.loan_number || ''}
        borrowerId={repaymentState.loan?.borrower_id || 0}
        currentBalance={repaymentState.loan?.balance || '0'}
        onSuccess={() => fetchLoanDetails()}
      />

      <PayoffDialog
        open={payoffState.open}
        onOpenChange={(open) => setPayoffState({ open, loan: open ? payoffState.loan : null })}
        loanNumber={payoffState.loan?.loan_number || ''}
        onSuccess={() => fetchLoanDetails()}
      />

      <OffsetDialog
        open={offsetState.open}
        onOpenChange={(open) => setOffsetState({ open, loan: open ? offsetState.loan : null })}
        loanNumber={offsetState.loan?.loan_number || ''}
        borrowerId={offsetState.loan?.borrower_id || 0}
        onSuccess={() => fetchLoanDetails()}
      />

      <ConfirmDialog
        open={disburseDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setDisburseDialog({ open: false, loan: null });
          }
        }}
        onConfirm={async () => {
          if (disburseDialog.loan) {
            await disburseLoan(disburseDialog.loan);
            setDisburseDialog({ open: false, loan: null });
          }
        }}
        title="Disburse Loan"
        description={`Are you sure you want to disburse loan #${disburseDialog.loan?.loan_number}?`}
        confirmText="Disburse"
        cancelText="Cancel"
      />
    </div>
  );
}