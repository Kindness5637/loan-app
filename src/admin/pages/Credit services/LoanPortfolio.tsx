import {DataTable, type DataTableConfig} from '@/components/DataTablePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiService } from '@/services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Wallet,
  HandCoins,
  Banknote,
  Send,
  Download,
  FileText,
  FileCode,
  CheckCircle,
  XCircle,
  Eye,
  Trash,
  CreditCard,
} from 'lucide-react';
import { RepaymentDialog } from '@/components/loans/RepaymentDialog';
import { PayoffDialog } from '@/components/loans/PayoffDialog';
import { OffsetDialog } from '@/components/loans/OffsetDialog';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '@/components/confirmDialog';
import { type LoanApplication } from '@/types/loan';
import { formatDate } from '@/lib/utils';
import { useState } from 'react';
import { toast } from 'sonner';
import { useNotifications } from '@/user/contexts/NotificationContext';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';

const formatCurrency = (amount: number | string) => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
  }).format(numAmount);
};

const getStatusBadge = (status: string) => {
  const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    'pending-approval': { variant: 'secondary', label: 'Pending Approval' },
    'approved': { variant: 'default', label: 'Approved' },
    'disbursed': { variant: 'default', label: 'Disbursed' },
    'active': { variant: 'default', label: 'Active' },
    'rejected': { variant: 'destructive', label: 'Rejected' },
    'completed': { variant: 'outline', label: 'Completed' },
    'defaulted': { variant: 'destructive', label: 'Defaulted' },
  };

  const statusInfo = statusMap[status] || { variant: 'outline', label: status };
  
  return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
};

// Export to XML
const exportToXML = (data: LoanApplication[], filename: string = 'loan-portfolio') => {
  // Helper function to escape XML special characters
  const escapeXml = (unsafe: string | number | undefined | null) => {
    if (unsafe === undefined || unsafe === null) return 'N/A';
    return String(unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  // Calculate summary statistics
  const totalPrincipal = data.reduce((sum, loan) => sum + parseFloat(loan.principal_amount || '0'), 0);
  const totalBalance = data.reduce((sum, loan) => sum + parseFloat(loan.balance || '0'), 0);
  const activeLoans = data.filter(l => l.loan_status === 'active' || l.loan_status === 'disbursed').length;
  const pendingLoans = data.filter(l => l.loan_status === 'pending-approval').length;

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<LoanPortfolio exportDate="${new Date().toISOString()}" generatedBy="Loan Management System">
  <Summary>
    <TotalLoans>${data.length}</TotalLoans>
    <ActiveLoans>${activeLoans}</ActiveLoans>
    <PendingLoans>${pendingLoans}</PendingLoans>
    <TotalPrincipal currency="KES">${totalPrincipal.toFixed(2)}</TotalPrincipal>
    <TotalBalance currency="KES">${totalBalance.toFixed(2)}</TotalBalance>
  </Summary>
  <Loans>
${data.map(loan => `    <Loan id="${escapeXml(loan.id)}">
      <LoanNumber>${escapeXml(loan.loan_number)}</LoanNumber>
      <Borrower>
        <BorrowerId>${escapeXml(loan.borrower_id)}</BorrowerId>
        <FullName>${escapeXml(loan.borrower?.full_name)}</FullName>
        <Phone>${escapeXml(loan.borrower?.phone)}</Phone>
        <Email>${escapeXml(loan.borrower?.email)}</Email>
      </Borrower>
      <LoanDetails>
        <LoanType>${escapeXml(loan.loan_type?.loanType)}</LoanType>
        <LoanCode>${escapeXml(loan.loan_type?.loanCode)}</LoanCode>
        <PrincipalAmount currency="KES">${escapeXml(loan.principal_amount)}</PrincipalAmount>
        <MonthlyPayment currency="KES">${escapeXml(loan.monthly_payment)}</MonthlyPayment>
        <Balance currency="KES">${escapeXml(loan.balance)}</Balance>
        <InterestRate>${escapeXml(loan.loan_type?.interest_rate)}%</InterestRate>
      </LoanDetails>
      <Duration>
        <Amount>${escapeXml(loan.loan_duration)}</Amount>
        <Period>${escapeXml(loan.duration_period)}</Period>
        <FullDuration>${escapeXml(loan.loan_duration)} ${escapeXml(loan.duration_period)}</FullDuration>
      </Duration>
      <Status>${escapeXml(loan.loan_status)}</Status>
      <Purpose>${escapeXml(loan.purpose)}</Purpose>
      <Collateral>${escapeXml(loan.collateral)}</Collateral>
      <TransactionReference>${escapeXml(loan.transaction_reference)}</TransactionReference>
      <Dates>
        <AppliedDate>${escapeXml(loan.created_at)}</AppliedDate>
        <AppliedDateFormatted>${formatDate(loan.created_at)}</AppliedDateFormatted>
      </Dates>
    </Loan>`).join('\n')}
  </Loans>
</LoanPortfolio>`;

  const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.xml`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export to PDF
const exportToPDF = (data: LoanApplication[]) => {
  try {
    const doc = new jsPDF('landscape');
    
    // Add title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Loan Portfolio Report', 14, 22);
    
    // Add summary
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const totalPrincipal = data.reduce((sum, loan) => sum + parseFloat(loan.principal_amount), 0);
    const totalBalance = data.reduce((sum, loan) => sum + parseFloat(loan.balance), 0);
    
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 32);
    doc.text(`Total Loans: ${data.length}`, 14, 38);
    doc.text(`Total Principal: ${formatCurrency(totalPrincipal)}`, 14, 44);
    doc.text(`Total Balance: ${formatCurrency(totalBalance)}`, 14, 50);
    
    // Prepare table data
    const tableData = data.map(loan => [
      loan.loan_number,
      loan.borrower.full_name,
      loan.borrower.phone,
      loan.loan_type?.loanType || 'N/A',
      formatCurrency(loan.principal_amount),
      formatCurrency(loan.monthly_payment),
      formatCurrency(loan.balance),
      loan.loan_status,
      formatDate(loan.created_at)
    ]);
    
    // Add table
    autoTable(doc, {
      head: [['Loan #', 'Borrower', 'Phone', 'Type', 'Principal', 'Monthly', 'Balance', 'Status', 'Applied']],
      body: tableData,
      startY: 58,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [66, 66, 66], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 35 },
        2: { cellWidth: 25 },
        3: { cellWidth: 30 },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 25, halign: 'right' },
        6: { cellWidth: 25, halign: 'right' },
        7: { cellWidth: 25 },
        8: { cellWidth: 25 }
      }
    });
    
    // Add footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(150);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(
        'Report generated by Loan Management System',
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
    
    // Save the PDF
    doc.save(`loan-portfolio-report-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF downloaded successfully');
  } catch (error) {
    console.error('PDF export error:', error);
    toast.error('Failed to generate PDF: ' + (error as Error).message);
  }
};

export function LoanPortfolio() {
  const navigate = useNavigate();
  const { checkForUpdates } = useNotifications();

  // Set breadcrumbs
  useBreadcrumbs([
    { label: 'Dashboard', href: '/' },
    { label: 'Credit Services', href: '/loan-portfolio' },
    { label: 'Loan Portfolio', icon: <CreditCard className="h-4 w-4" /> },
  ]);

  // Dialog states
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    loan: LoanApplication | null;
  }>({ open: false, loan: null });

  const [repaymentState, setRepaymentState] = useState<{ 
    open: boolean; 
    loan: LoanApplication | null 
  }>({ open: false, loan: null });

  const [payoffState, setPayoffState] = useState<{ 
    open: boolean; 
    loan: LoanApplication | null 
  }>({ open: false, loan: null });

  const [offsetState, setOffsetState] = useState<{ 
    open: boolean; 
    loan: LoanApplication | null 
  }>({ open: false, loan: null });

  const [disburseDialog, setDisburseDialog] = useState<{ 
    open: boolean; 
    loan: LoanApplication | null 
  }>({ open: false, loan: null });

  // API Actions
  const approveLoan = async (loan: LoanApplication) => {
    try {
      const response = await apiService.post(`/${loan.loan_number}/approve`, loan);
      if (response.status === 200) {
        toast.success("Loan approved successfully");
        await checkForUpdates();
        // window.location.reload();
      } else {
        toast.error('Approval not successful');
      }
    } catch (error: unknown) {
      toast.error(`Error approving loan ${loan.loan_number}`);
      console.log(error)
    }
  };

  const rejectLoan = async (loan: LoanApplication) => {
    try {
      const res = await apiService.post(`/${loan.loan_number}/reject`);
      if (res.data) {
        toast.success("Loan rejected successfully");
        await checkForUpdates();
        // window.location.reload();
      }
    } catch (error: unknown) {
      toast.error("Error rejecting loan");
      console.log(error)
    }
  };

  const disburseLoan = async (loan: LoanApplication) => {
    try {
      const data = {
        amount: loan.principal_amount,
        disbursement_method: loan.transaction_reference
      };
      const response = await apiService.post(`/${loan.loan_number}/disburse`, data);
      if ((response as unknown as { data: unknown }).data != null) {
        toast.success("Loan disbursed successfully");
        await checkForUpdates();
        // window.location.reload();
      } else {
        toast.error('Disbursement not successful');
      }
    } catch (error: unknown) {
      console.log(error);
      toast.error(`Error disbursing loan ${loan.loan_number}`);
    }
  };

  const deleteLoan = async (loan: LoanApplication) => {
    try {
      const response = await apiService.delete(`/loan-applications/${loan.id}`);
      if (response) {
        toast.success("Loan deleted successfully");
        await checkForUpdates();
        // window.location.reload();
      }
    } catch (error: unknown) {
      toast.error("Error deleting loan");
      console.log(error)
    }
  };

  // Enhanced DataTable Configuration
  const loanApplicationsConfig: DataTableConfig<LoanApplication> = {
    title: 'Loan Portfolio',
    description: 'Manage and track all loan applications',
    emptyStateMessage: 'No loan applications yet. Create your first loan to get started.',
    apiEndpoint: '/loan-applications',
    
    // CSV Export Formatter - This is the key fix!
    exportFormatter: (data: LoanApplication[]) => {
      return data.map(loan => ({
        'Loan Number': loan.loan_number,
        'Borrower Name': loan.borrower.full_name,
        'Borrower Phone': loan.borrower.phone,
        'Loan Type': loan.loan_type?.loanType || 'N/A',
        'Loan Code': loan.loan_type?.loanCode || 'N/A',
        'Principal Amount': formatCurrency(loan.principal_amount),
        'Monthly Payment': formatCurrency(loan.monthly_payment),
        'Loan Duration': `${loan.loan_duration} ${loan.duration_period}`,
        'Balance': formatCurrency(loan.balance),
        'Status': loan.loan_status,
        'Applied Date': formatDate(loan.created_at),
        'Purpose': loan.purpose || 'N/A',
        'Collateral': loan.collateral || 'N/A',
      }));
    },
    
    addButton: {
      label: 'New Loan Application',
      link: '/loan-application',
    },
    
    // Custom export buttons (PDF & XML)
    headerActions: (data) => (
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportToPDF(data)}
          className="flex items-center gap-2"
          disabled={data.length === 0}
        >
          <FileText className="h-4 w-4" />
          PDF
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            exportToXML(data);
            toast.success('XML exported successfully');
          }}
          className="flex items-center gap-2"
          disabled={data.length === 0}
        >
          <FileCode className="h-4 w-4" />
          XML
        </Button>
      </div>
    ),
    
    // Statistics Cards
    stats: [
      {
        label: 'Total Applications',
        getValue: (data) => data.length,
        description: 'All time',
        trend: {
          value: '+12% from last month',
          isPositive: true,
        },
      },
      {
        label: 'Pending Approval',
        getValue: (data) => 
          data.filter((l: LoanApplication) => l.loan_status === 'pending-approval').length,
        description: 'Awaiting review',
      },
      {
        label: 'Active Loans',
        getValue: (data) => 
          data.filter((l: LoanApplication) => 
            l.loan_status === 'active' || l.loan_status === 'disbursed'
          ).length,
        description: 'Currently active',
      },
      {
        label: 'Total Disbursed',
        getValue: (data) => {
          const total = data
            .filter((l: LoanApplication) => 
              l.loan_status !== 'pending-approval' && l.loan_status !== 'rejected' && l.loan_status !== 'approved'
            )
            .reduce((sum: number, l: LoanApplication) => 
              sum + parseFloat(l.principal_amount), 0
            );
          return formatCurrency(total);
        },
        description: 'Total loan value',
      },
    ],
    
    // Column Configuration
    columns: [
      {
        key: 'loan_number',
        label: 'Loan Number',
        sortable: true,
        searchable: true,
        width: '140px',
        render: (loan) => (
          <span className="font-mono font-semibold text-blue-600">
            {loan.loan_number}
          </span>
        ),
      },
      {
        key: 'borrower.full_name',
        label: 'Borrower',
        sortable: true,
        searchable: true,
        render: (loan) => (
          <div>
            <div className="font-medium">{loan.borrower.full_name}</div>
            <div className="text-xs text-muted-foreground">{loan.borrower.phone}</div>
          </div>
        ),
      },
      {
        key: 'borrower.phone',
        label: 'Borrower Phone',
        sortable: true,
        searchable: true,
        hidden: true,
      },
      {
        key: 'loan_type.loanType',
        label: 'Loan Type',
        sortable: true,
        searchable: true,
        render: (loan) => (
          <div>
            <div className="font-medium">{loan.loan_type?.loanType || 'N/A'}</div>
            <div className="text-xs text-muted-foreground">
              {loan.loan_type?.loanCode || 'N/A'}
            </div>
          </div>
        ),
      },
      {
        key: 'loan_type.loanCode',
        label: 'Loan Code',
        sortable: true,
        hidden: true,
      },
      {
        key: 'principal_amount',
        label: 'Principal',
        sortable: true,
        align: 'right',
        render: (loan) => (
          <span className="font-semibold">
            {formatCurrency(loan.principal_amount)}
          </span>
        ),
      },
      {
        key: 'monthly_payment',
        label: 'Monthly Payment',
        sortable: true,
        align: 'right',
        render: (loan) => (
          <div className="text-sm">
            {formatCurrency(loan.monthly_payment)}
            <div className="text-xs text-muted-foreground">
              {loan.loan_duration} {loan.duration_period}
            </div>
          </div>
        ),
      },
      {
        key: 'loan_duration',
        label: 'Duration',
        sortable: true,
        hidden: true,
      },
      {
        key: 'duration_period',
        label: 'Period',
        sortable: true,
        hidden: true,
      },
      {
        key: 'balance',
        label: 'Balance',
        sortable: true,
        align: 'right',
        render: (loan) => (
          <span className={
            parseFloat(loan.balance) > 0 
              ? 'text-orange-600 font-medium' 
              : 'text-green-600'
          }>
            {formatCurrency(loan.balance)}
          </span>
        ),
      },
      {
        key: 'loan_status',
        label: 'Status',
        sortable: true,
        searchable: true,
        render: (loan) => getStatusBadge(loan.loan_status),
      },
      {
        key: 'created_at',
        label: 'Applied',
        sortable: true,
        render: (loan) => formatDate(loan.created_at),
      },
      {
        key: 'purpose',
        label: 'Purpose',
        hidden: true,
        searchable: true,
      },
      {
        key: 'collateral',
        label: 'Collateral',
        hidden: true,
        searchable: true,
      },
    ],
    
    // Row Actions
    actions: [
      {
        label: 'View Details',
        icon: <Eye className="h-4 w-4" />,
        onClick: (loan) => navigate(`/loan-portfolio/${loan.loan_number}`),
      },
      // Pending approval actions
      {
        label: 'Approve Loan',
        icon: <CheckCircle className="h-4 w-4" />,
        onClick: (loan) => setConfirmDialog({ open: true, loan }),
        visible: (loan) => loan.loan_status === 'pending-approval',
        separator: true,
      },
      {
        label: 'Reject Loan',
        icon: <XCircle className="h-4 w-4" />,
        onClick: (loan) => rejectLoan(loan),
        visible: (loan) => loan.loan_status === 'pending-approval',
        variant: 'destructive',
      },
      // Approved loan actions
      {
        label: 'Disburse Loan',
        icon: <Send className="h-4 w-4" />,
        onClick: (loan) => setDisburseDialog({ open: true, loan }),
        visible: (loan) => loan.loan_status === 'approved',
        separator: true,
      },
      // Active/disbursed loan actions
      {
        label: 'Repay Loan',
        icon: <HandCoins className="h-4 w-4" />,
        onClick: (loan) => setRepaymentState({ open: true, loan }),
        visible: (loan) => 
          loan.loan_status === 'active' || loan.loan_status === 'disbursed',
        separator: true,
      },
      {
        label: 'Pay Off Loan',
        icon: <Banknote className="h-4 w-4" />,
        onClick: (loan) => setPayoffState({ open: true, loan }),
        visible: (loan) => 
          loan.loan_status === 'active' || loan.loan_status === 'disbursed',
      },
      {
        label: 'Offset Loan',
        icon: <Wallet className="h-4 w-4" />,
        onClick: (loan) => setOffsetState({ open: true, loan }),
        visible: (loan) => 
          loan.loan_status === 'active' || loan.loan_status === 'disbursed',
      },
      // Delete action
      {
        label: 'Delete Loan',
        icon: <Trash className="h-4 w-4" />,
        onClick: (loan) => {
          if (confirm(`Are you sure you want to delete loan ${loan.loan_number}?`)) {
            deleteLoan(loan);
          }
        },
        visible: (loan) => loan.loan_status === 'pending-approval',
        variant: 'destructive',
        separator: true,
      },
    ],
    
    // Bulk Actions
    bulkActions: [
      {
        label: 'Approve Selected',
        icon: <CheckCircle className="h-4 w-4" />,
        onClick: async (loans) => {
          if (confirm(`Approve ${loans.length} loan(s)?`)) {
            for (const loan of loans) {
              if (loan.loan_status === 'pending-approval') {
                await approveLoan(loan);
              }
            }
          }
        },
      },
      {
        label: 'Export Selected',
        icon: <Download className="h-4 w-4" />,
        onClick: (loans) => {
          exportToXML(loans, 'selected-loans');
          toast.success(`Exported ${loans.length} loans`);
        },
      },
      {
        label: 'Delete Selected',
        icon: <Trash className="h-4 w-4" />,
        variant: 'destructive',
        onClick: async (loans) => {
          if (confirm(`Delete ${loans.length} loan(s)?`)) {
            for (const loan of loans) {
              if (loan.loan_status === 'pending-approval') {
                await deleteLoan(loan);
              }
            }
          }
        },
      },
    ],
    
    // Search Configuration
    searchPlaceholder: 'Search by loan number, borrower, phone, or purpose...',
    searchKeys: [
      'loan_number', 
      'borrower.full_name', 
      'borrower.phone',
      'loan_type.loanType',
      'purpose',
      'collateral'
    ],
    
    // Enhanced Features
    enableRowSelection: true,
    enableExport: true,
    enableColumnVisibility: true,
    defaultPageSize: 20,
    pageSizeOptions: [10, 20, 50, 100],
    
    // Default sorting
    defaultSort: {
      key: 'created_at',
      direction: 'desc',
    },
    
    // Auto-refresh every 5 minutes
    refreshInterval: 300000,
    
    // Callback
    onDataLoad: (data) => {
      console.log(`Loaded ${data.length} loan applications`);
    },
  };

  return (
    <>
      <DataTable config={loanApplicationsConfig} />

      {/* Approve Confirmation Dialog */}
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
        description={`Are you sure you want to approve loan #${confirmDialog.loan?.loan_number} for ${confirmDialog.loan?.borrower.full_name}?`}
        confirmText="Approve"
        cancelText="Cancel"
      />

      {/* Disburse Confirmation Dialog */}
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
        description={`Are you sure you want to disburse ${formatCurrency(disburseDialog.loan?.principal_amount || 0)} to ${disburseDialog.loan?.borrower.full_name}?`}
        confirmText="Disburse"
        cancelText="Cancel"
      />

      {/* Repayment Dialog */}
      <RepaymentDialog
        open={repaymentState.open}
        onOpenChange={(open) => 
          setRepaymentState({ open, loan: open ? repaymentState.loan : null })
        }
        loanNumber={repaymentState.loan?.loan_number || ''}
        borrowerId={repaymentState.loan?.borrower_id || 0}
        currentBalance={repaymentState.loan?.balance || '0'}
        // onSuccess={() => window.location.reload()}
      />

      {/* Payoff Dialog */}
      <PayoffDialog
        open={payoffState.open}
        onOpenChange={(open) => 
          setPayoffState({ open, loan: open ? payoffState.loan : null })
        }
        loanNumber={payoffState.loan?.loan_number || ''}
        onSuccess={() => window.location.reload()}
      />

      {/* Offset Dialog */}
      <OffsetDialog
        open={offsetState.open}
        onOpenChange={(open) => 
          setOffsetState({ open, loan: open ? offsetState.loan : null })
        }
        loanNumber={offsetState.loan?.loan_number || ''}
        borrowerId={offsetState.loan?.borrower_id || 0}
        // onSuccess={() => window.location.reload()}
      />
    </>
  );
}