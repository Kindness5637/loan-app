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
  Wallet,
  TrendingUp,
} from 'lucide-react';
import { type LoanApplication } from '@/types/loan';
import { formatCurrency, formatDate } from '@/lib/utils';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { printStyles } from '@/components/common/print';
import { ConfirmDialog } from '@/components/confirmDialog';
import { RepaymentDialog } from '@/components/loans/RepaymentDialog';
import { PayoffDialog } from '@/components/loans/PayoffDialog';
import { OffsetDialog } from '@/components/loans/OffsetDialog';

interface LoanStatementData {
  loan: {
    loan_number: string
    principal_amount: string
    loan_release_date: string
    balance: string
    loan_status: string
  }
  borrower: {
    full_name: string
    phone: string
    CardCode: string
  }
  transactions: {
    date: string
    type: string
    bal_bd: number
    payment: number
    interest: number
    penalty: number
    balance: number
  }[]
  summary: {
    total_paid: number
    total_penalties: number
    total_interest: number
    current_balance: number
  }
  generated_at: string
}

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
  const [statement, setStatement] = useState<LoanStatementData | null>(null);
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
      const [loanResponse, statementResponse] = await Promise.all([
        apiService.get<LoanApplication>(`/loan-applications/${loanNumber}`),
        apiService.get<{ data: LoanStatementData }>(`/loan-statement/${loanNumber}`).catch(() => ({ data: null })),
      ]);
      setLoan(loanResponse.data);
      setStatement(statementResponse.data);
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
      {/* Print-only clean document layout */}
      <div className="print-only" style={{ display: 'none' }}>
        <div className="print-header">
          <h1>Loan Application Details</h1>
          <p>Loan Number: {loan.loan_number} | Generated: {new Date().toLocaleDateString()}</p>
        </div>

        <h2>Borrower Information</h2>
        <div className="flex justify-between"><span>Full Name</span><span>{loan.borrower.full_name}</span></div>
        <div className="flex justify-between"><span>Phone</span><span>{loan.borrower.phone}</span></div>
        <div className="flex justify-between"><span>ID Number</span><span>{loan.borrower.id_number}</span></div>
        {loan.borrower.email && <div className="flex justify-between"><span>Email</span><span>{loan.borrower.email}</span></div>}
        {loan.borrower.nationality && <div className="flex justify-between"><span>Nationality</span><span>{loan.borrower.nationality}</span></div>}

        <h2>Loan Information</h2>
        <div className="flex justify-between"><span>Loan Number</span><span>{loan.loan_number}</span></div>
        <div className="flex justify-between"><span>Loan Type</span><span>{loan.loan_type.loanType} ({loan.loan_type.loanCode})</span></div>
        <div className="flex justify-between"><span>Status</span><span>{loan.loan_status?.toUpperCase()}</span></div>
        <div className="flex justify-between"><span>Purpose</span><span>{loan.purpose}</span></div>
        <div className="flex justify-between"><span>Collateral</span><span>{loan.collateral || 'None'}</span></div>
        <div className="flex justify-between"><span>Duration</span><span>{loan.loan_duration} {loan.duration_period}</span></div>
        <div className="flex justify-between"><span>Interest Method</span><span>{loan.interest_method}</span></div>
        <div className="flex justify-between"><span>Interest Rate</span><span>{loan.loan_type.interest_rate}%</span></div>

        <h2>Financial Summary</h2>
        <div className="flex justify-between"><span>Principal Amount</span><span>{formatCurrency(loan.principal_amount)}</span></div>
        <div className="flex justify-between"><span>Interest Amount</span><span>{formatCurrency(loan.interest_amount)}</span></div>
        <div className="flex justify-between"><span>Total Repayment</span><span>{formatCurrency(loan.repayment_amount)}</span></div>
        <div className="flex justify-between"><span>Monthly Payment</span><span>{formatCurrency(loan.monthly_payment)}</span></div>
        <div className="flex justify-between"><span>Current Balance (Principal)</span><span>{formatCurrency(loan.balance)}</span></div>

        {statement && (
          <>
            <h2>Payment Summary</h2>
            <div className="flex justify-between"><span>Total Paid</span><span>{formatCurrency(statement.summary.total_paid)}</span></div>
            <div className="flex justify-between"><span>Total Interest Charged</span><span>{formatCurrency(statement.summary.total_interest)}</span></div>
            <div className="flex justify-between"><span>Total Penalties</span><span>{formatCurrency(statement.summary.total_penalties)}</span></div>
            <div className="flex justify-between"><span>Outstanding Balance</span><span>{formatCurrency(statement.summary.current_balance)}</span></div>
          </>
        )}

        {statement && statement.transactions.length > 0 && (
          <>
            <h2>Transaction History</h2>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th style={{ textAlign: 'right' }}>Balance B/D</th>
                  <th style={{ textAlign: 'right' }}>Payment</th>
                  <th style={{ textAlign: 'right' }}>Interest</th>
                  <th style={{ textAlign: 'right' }}>Penalty</th>
                  <th style={{ textAlign: 'right' }}>Balance</th>
                </tr>
              </thead>
              <tbody>
                {statement.transactions.map((t, i) => (
                  <tr key={i}>
                    <td>{formatDate(t.date)}</td>
                    <td>{t.type}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(t.bal_bd)}</td>
                    <td style={{ textAlign: 'right' }}>{t.payment > 0 ? formatCurrency(t.payment) : '-'}</td>
                    <td style={{ textAlign: 'right' }}>{t.interest > 0 ? formatCurrency(t.interest) : '-'}</td>
                    <td style={{ textAlign: 'right' }}>{t.penalty > 0 ? formatCurrency(t.penalty) : '-'}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(t.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <h2>Timeline</h2>
        <div className="flex justify-between"><span>Application Date</span><span>{formatDate(loan.created_at)}</span></div>
        <div className="flex justify-between"><span>Release Date</span><span>{loan.loan_release_date ? formatDate(loan.loan_release_date) : 'N/A'}</span></div>
        <div className="flex justify-between"><span>Due Date</span><span>{formatDate(loan.loan_due_date)}</span></div>

        {loan.guarantors && loan.guarantors.length > 0 && (
          <>
            <h2>Guarantors</h2>
            {loan.guarantors.map((g: any, i: number) => (
              <div key={i} className="flex justify-between">
                <span>{g.business_partner?.full_name || 'N/A'}</span>
                <span>{formatCurrency(g.amount_guaranteed)}</span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Screen layout below */}
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

        {/* Financial Breakdown */}
        {statement && (
          <div className="bg-card rounded-lg shadow border p-6 mt-6 break-inside-avoid">
            <div className="flex items-center mb-4">
              <TrendingUp className="text-primary mr-2" size={20} />
              <h2 className="text-xl font-semibold">Financial Breakdown</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-700 font-medium">Total Paid</p>
                  <p className="font-bold text-2xl text-green-600">{formatCurrency(statement.summary.total_paid)}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-700 font-medium">Total Interest</p>
                  <p className="font-bold text-2xl text-blue-600">{formatCurrency(statement.summary.total_interest)}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-red-700 font-medium">Total Penalties</p>
                  <p className="font-bold text-2xl text-red-600">{formatCurrency(statement.summary.total_penalties)}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <p className="text-sm text-orange-700 font-medium">Outstanding Balance</p>
                  <p className="font-bold text-2xl text-orange-600">{formatCurrency(statement.summary.current_balance)}</p>
                </div>
              </div>
            </div>
            {/* Progress bar */}
            {parseFloat(loan.repayment_amount) > 0 && (
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Repayment Progress</span>
                  <span className="text-muted-foreground">
                    {Math.round((statement.summary.total_paid / parseFloat(loan.repayment_amount)) * 100)}%
                  </span>
                </div>
                <Progress
                  value={(statement.summary.total_paid / parseFloat(loan.repayment_amount)) * 100}
                  className="h-3"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Paid: {formatCurrency(statement.summary.total_paid)}</span>
                  <span>Total: {formatCurrency(loan.repayment_amount)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Transaction History */}
        {statement && statement.transactions.length > 0 && (
          <div className="bg-card rounded-lg shadow border p-6 mt-6 break-inside-avoid">
            <div className="flex items-center mb-4">
              <Calendar className="text-primary mr-2" size={20} />
              <h2 className="text-xl font-semibold">Transaction History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Balance B/D</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Payment</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Interest</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Penalty</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {statement.transactions.map((transaction, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 text-sm">{formatDate(transaction.date)}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={transaction.type.toLowerCase() === 'payment' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {transaction.type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-right">{formatCurrency(transaction.bal_bd)}</td>
                      <td className="py-3 px-4 text-sm text-right text-green-600">
                        {transaction.payment > 0 ? formatCurrency(transaction.payment) : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-blue-600">
                        {transaction.interest > 0 ? formatCurrency(transaction.interest) : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-red-600">
                        {transaction.penalty > 0 ? formatCurrency(transaction.penalty) : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-semibold">
                        {formatCurrency(transaction.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

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