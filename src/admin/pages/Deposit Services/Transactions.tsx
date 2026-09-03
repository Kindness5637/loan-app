import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type DataTableConfig } from '@/components/DataTablePage';
import { format } from 'date-fns';
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Calendar,
  FileText,
  FileSpreadsheet,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';

//  TYPE DEFINITIONS 

interface Transaction {
  id: number;
  transaction_type: string;
  type?: string;
  amount: number;
  reference: string;
  notes: string;
  transaction_date: string;
  principal_component?: number;
  interest_component?: number;
  payment_method?: string;
  reference_number?: string;
  status?: string;
}

//  HELPER FUNCTIONS 

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  try {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  } catch {
    return dateString;
  }
};

const getTransactionTypeBadge = (transaction: Transaction) => {
  const type = transaction.type || transaction.transaction_type;
  
  if (type === 'disbursement') {
    return (
      <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
        <ArrowDownCircle className="h-3 w-3 mr-1" />
        Disbursement
      </Badge>
    );
  } else if (type === 'repayment' || transaction.transaction_type === 'repayment') {
    return (
      <Badge variant="default" className="bg-green-500 hover:bg-green-600">
        <ArrowUpCircle className="h-3 w-3 mr-1" />
        Repayment
      </Badge>
    );
  }
  return (
    <Badge variant="outline">
      {type || transaction.transaction_type}
    </Badge>
  );
};

const getStatusBadge = (status?: string) => {
  if (!status) return null;
  
  const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    approved: { variant: 'default', label: 'Approved' },
    pending: { variant: 'secondary', label: 'Pending' },
    rejected: { variant: 'destructive', label: 'Rejected' },
  };
  
  const config = statusConfig[status.toLowerCase()] || { variant: 'outline', label: status };
  
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

//  EXPORT FUNCTIONS 

const exportToPDF = (data: Transaction[]) => {
  try {
    const doc = new jsPDF('landscape');
    
    // Add header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Transaction Report', 14, 22);
    
    // Add metadata
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${format(new Date(), 'PPP')}`, 14, 32);
    doc.text(`Total Transactions: ${data.length}`, 14, 38);
    
    // Calculate totals
    const totalDisbursed = data
      .filter(t => (t.type || t.transaction_type) === 'disbursement')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalRepayments = data
      .filter(t => (t.type || t.transaction_type) === 'repayment')
      .reduce((sum, t) => sum + t.amount, 0);
    
    doc.text(`Total Disbursed: ${formatCurrency(totalDisbursed)}`, 14, 44);
    doc.text(`Total Repayments: ${formatCurrency(totalRepayments)}`, 14, 50);
    doc.text(`Net Outstanding: ${formatCurrency(totalDisbursed - totalRepayments)}`, 14, 56);
    
    // Prepare table data
    const tableData = data.map(t => [
      t.id.toString(),
      formatDate(t.transaction_date),
      (t.type || t.transaction_type).toUpperCase(),
      formatCurrency(t.amount),
      t.reference || t.reference_number || '-',
      t.payment_method || '-',
      t.status || '-',
      t.notes.substring(0, 40) + (t.notes.length > 40 ? '...' : ''),
    ]);
    
    // Add table
    autoTable(doc, {
      startY: 64,
      head: [['ID', 'Date', 'Type', 'Amount', 'Reference', 'Method', 'Status', 'Notes']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [59, 130, 246],
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: { 
        fontSize: 8, 
        cellPadding: 3,
        overflow: 'linebreak'
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 35 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 30 },
        5: { cellWidth: 25 },
        6: { cellWidth: 20, halign: 'center' },
        7: { cellWidth: 'auto' },
      },
    });
    
    // Add footer with page numbers
    const pageCount = (doc as any).internal.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(150);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(
        `Page ${i} of ${pageCount} | Generated by Loan Management System`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
    
    // Save the PDF
    doc.save(`transactions-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success('PDF downloaded successfully');
  } catch (error) {
    console.error('PDF export error:', error);
    toast.error('Failed to generate PDF');
  }
};

const exportToExcel = (data: Transaction[]) => {
  try {
    // Prepare data for Excel
    const excelData = data.map(t => ({
      'ID': t.id,
      'Date': formatDate(t.transaction_date),
      'Type': (t.type || t.transaction_type).toUpperCase(),
      'Amount': t.amount,
      'Reference': t.reference || t.reference_number || '',
      'Payment Method': t.payment_method || '',
      'Status': t.status || '',
      'Principal Component': t.principal_component || 0,
      'Interest Component': t.interest_component || 0,
      'Notes': t.notes,
    }));
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 8 },  // ID
      { wch: 20 }, // Date
      { wch: 15 }, // Type
      { wch: 15 }, // Amount
      { wch: 25 }, // Reference
      { wch: 15 }, // Payment Method
      { wch: 12 }, // Status
      { wch: 15 }, // Principal
      { wch: 15 }, // Interest
      { wch: 50 }, // Notes
    ];
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    
    // Calculate summary data
    const totalDisbursed = data
      .filter(t => (t.type || t.transaction_type) === 'disbursement')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalRepayments = data
      .filter(t => (t.type || t.transaction_type) === 'repayment')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalPrincipal = data.reduce((sum, t) => sum + (t.principal_component || 0), 0);
    const totalInterest = data.reduce((sum, t) => sum + (t.interest_component || 0), 0);
    
    // Create summary sheet
    const summaryData = [
      ['Transaction Summary Report'],
      [''],
      ['Generated On', format(new Date(), 'PPP')],
      ['Total Transactions', data.length],
      [''],
      ['Financial Summary'],
      ['Total Disbursed', totalDisbursed],
      ['Total Repayments', totalRepayments],
      ['Net Outstanding', totalDisbursed - totalRepayments],
      [''],
      ['Component Breakdown'],
      ['Total Principal', totalPrincipal],
      ['Total Interest', totalInterest],
    ];
    
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
    
    // Save the Excel file
    XLSX.writeFile(wb, `transactions-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast.success('Excel file downloaded successfully');
  } catch (error) {
    console.error('Excel export error:', error);
    toast.error('Failed to generate Excel file');
  }
};

//  MAIN COMPONENT 

export default function TransactionsPage() {
  // Set breadcrumbs
  useBreadcrumbs([
    { label: 'Dashboard', href: '/' },
    { label: 'Financial', href: '/transactions' },
    { label: 'Transactions', icon: <DollarSign className="h-4 w-4" /> },
  ]);

  //  DATATABLE CONFIGURATION 

  const transactionsConfig: DataTableConfig<Transaction> = {
    title: 'Transactions',
    description: 'View and manage all loan transactions including disbursements and repayments',
    emptyStateMessage: 'No transactions found. Transactions will appear here once loans are disbursed or payments are made.',
    apiEndpoint: '/transactions',
    
    //  SEARCH CONFIGURATION 
    searchPlaceholder: 'Search by reference, notes, amount, or payment method...',
    searchKeys: ['reference', 'reference_number', 'notes', 'amount', 'payment_method'],
    
    //  PAGINATION CONFIGURATION 
    defaultPageSize: 25,
    pageSizeOptions: [10, 25, 50, 100, 200],
    
    //  AUTO-REFRESH 
    refreshInterval: 60000, // Refresh every 1 minute
    
    //  STATISTICS CARDS 
    stats: [
      {
        label: 'Total Disbursed',
        getValue: (data: Transaction[]) => {
          const total = data
            .filter(t => (t.type || t.transaction_type) === 'disbursement')
            .reduce((sum, t) => sum + t.amount, 0);
          return formatCurrency(total);
        },
        description: 'Total amount disbursed to borrowers',
        trend: {
          value: '+8.2% from last month',
          isPositive: true,
        },
      },
      {
        label: 'Total Repayments',
        getValue: (data: Transaction[]) => {
          const total = data
            .filter(t => (t.type || t.transaction_type) === 'repayment')
            .reduce((sum, t) => sum + t.amount, 0);
          return formatCurrency(total);
        },
        description: 'Total amount received from borrowers',
        trend: {
          value: '+12.5% from last month',
          isPositive: true,
        },
      },
      {
        label: 'Net Outstanding',
        getValue: (data: Transaction[]) => {
          const disbursed = data
            .filter(t => (t.type || t.transaction_type) === 'disbursement')
            .reduce((sum, t) => sum + t.amount, 0);
          const repaid = data
            .filter(t => (t.type || t.transaction_type) === 'repayment')
            .reduce((sum, t) => sum + t.amount, 0);
          return formatCurrency(disbursed - repaid);
        },
        description: 'Total outstanding balance',
      },
      {
        label: 'Total Transactions',
        getValue: (data: Transaction[]) => data.length.toString(),
        description: 'All transactions recorded',
      },
    ],
    
    //  COLUMN CONFIGURATION 
    columns: [
      {
        key: 'id',
        label: 'ID',
        sortable: true,
        width: '80px',
        render: (transaction) => (
          <span className="font-mono text-sm text-muted-foreground">
            #{transaction.id}
          </span>
        ),
      },
      {
        key: 'transaction_date',
        label: 'Date & Time',
        sortable: true,
        width: '200px',
        render: (transaction) => (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{formatDate(transaction.transaction_date)}</span>
          </div>
        ),
      },
      {
        key: 'type',
        label: 'Type',
        sortable: true,
        searchable: true,
        width: '140px',
        render: (transaction) => getTransactionTypeBadge(transaction),
      },
      {
        key: 'amount',
        label: 'Amount',
        sortable: true,
        align: 'right',
        width: '150px',
        render: (transaction) => {
          const isRepayment = (transaction.type || transaction.transaction_type) === 'repayment';
          return (
            <div className="flex items-center justify-end gap-2">
              {isRepayment ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-blue-500" />
              )}
              <span className={`font-semibold ${isRepayment ? 'text-green-600' : 'text-blue-600'}`}>
                {formatCurrency(transaction.amount)}
              </span>
            </div>
          );
        },
      },
      {
        key: 'reference',
        label: 'Reference',
        searchable: true,
        width: '180px',
        render: (transaction) => (
          <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
            {transaction.reference || transaction.reference_number || 'N/A'}
          </code>
        ),
      },
      {
        key: 'payment_method',
        label: 'Payment Method',
        sortable: true,
        searchable: true,
        width: '140px',
        render: (transaction) => 
          transaction.payment_method ? (
            <Badge variant="outline" className="capitalize">
              {transaction.payment_method}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-sm">-</span>
          ),
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        width: '120px',
        render: (transaction) => getStatusBadge(transaction.status),
      },
      {
        key: 'notes',
        label: 'Notes',
        searchable: true,
        render: (transaction) => (
          <span className="text-sm text-muted-foreground max-w-xs truncate block" title={transaction.notes}>
            {transaction.notes}
          </span>
        ),
      },
      // Hidden columns for export and searchability
      {
        key: 'principal_component',
        label: 'Principal Component',
        hidden: true,
        sortable: true,
        exportable: true,
      },
      {
        key: 'interest_component',
        label: 'Interest Component',
        hidden: true,
        sortable: true,
        exportable: true,
      },
      {
        key: 'reference_number',
        label: 'Reference Number',
        hidden: true,
        searchable: true,
        exportable: true,
      },
    ],
    
    //  CSV EXPORT FORMATTER 
    exportFormatter: (data: Transaction[]) => {
      return data.map(t => ({
        'Transaction ID': t.id,
        'Date': formatDate(t.transaction_date),
        'Type': (t.type || t.transaction_type).toUpperCase(),
        'Amount': formatCurrency(t.amount),
        'Amount (Numeric)': t.amount,
        'Reference': t.reference || t.reference_number || '',
        'Payment Method': t.payment_method || '',
        'Status': t.status || '',
        'Principal Component': t.principal_component || 0,
        'Interest Component': t.interest_component || 0,
        'Total Components': (t.principal_component || 0) + (t.interest_component || 0),
        'Notes': t.notes,
      }));
    },
    
    //  ROW ACTIONS 
    // actions: [
    //   {
    //     label: 'View Details',
    //     icon: <Eye className="h-4 w-4" />,
    //     onClick: (transaction) => {
    //       // Navigate to transaction details page
    //       window.location.href = `/transactions/${transaction.id}`;
    //     },
    //   },
    //   {
    //     label: 'Download Receipt',
    //     icon: <Download className="h-4 w-4" />,
    //     onClick: (_transaction) => {
    //       toast.info('Receipt download functionality coming soon');
    //       // TODO: Implement receipt download
    //     },
    //     visible: (transaction) => 
    //       transaction.status === 'approved' || 
    //       (transaction.type || transaction.transaction_type) === 'disbursement',
    //   },
    // ],
    
    //  BULK ACTIONS 
    bulkActions: [
      {
        label: 'Export Selected to Excel',
        icon: <FileSpreadsheet className="h-4 w-4" />,
        onClick: (transactions) => {
          exportToExcel(transactions);
        },
      },
      {
        label: 'Export Selected to PDF',
        icon: <FileText className="h-4 w-4" />,
        onClick: (transactions) => {
          exportToPDF(transactions);
        },
      },
    ],
    
    //  CUSTOM HEADER ACTIONS 
    headerActions: (data: Transaction[]) => (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportToPDF(data)}
          disabled={data.length === 0}
        >
          <FileText className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportToExcel(data)}
          disabled={data.length === 0}
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export Excel
        </Button>
      </>
    ),
    
    //  ADVANCED FEATURES 
    enableRowSelection: true,
    enableExport: true,
    enableColumnVisibility: true,
    
    //  DEFAULT SORTING 
    defaultSort: {
      key: 'transaction_date',
      direction: 'desc',
    },
    
    //  CALLBACK 
    onDataLoad: (data) => {
      console.log(`Loaded ${data.length} transactions`);
      
      // Calculate and log summary statistics
      const disbursed = data
        .filter(t => (t.type || t.transaction_type) === 'disbursement')
        .reduce((sum, t) => sum + t.amount, 0);
      const repayments = data
        .filter(t => (t.type || t.transaction_type) === 'repayment')
        .reduce((sum, t) => sum + t.amount, 0);
      
      console.log('Transaction Summary:', {
        total: data.length,
        disbursed: formatCurrency(disbursed),
        repayments: formatCurrency(repayments),
        outstanding: formatCurrency(disbursed - repayments),
      });
    },
  };

  return <DataTable config={transactionsConfig} />;
}