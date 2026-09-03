import { useState, useEffect } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  FileText,
  // Download,
  AlertTriangle,
  Printer,
  Calendar as CalendarIcon,
  Loader2,
  CheckCircle
} from "lucide-react";
import { apiService } from "@/services/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import type { LoanType } from "@/types/loan";

interface LoanApplication {
  id: number;
  loan_number: string;
  principal_amount: string;
  interest_amount: string;
  balance: string;
  loan_status: string;
  created_at: string;
  loan_release_date?: string;
  loan_due_date: string;
  loan_duration: number;
  purpose: string;
  monthly_payment: string;
  days_in_arrears: number;
  loan_type_id: number;
  borrower_id: number;
  loan_type?: LoanType;
  borrower?: {
    id: number;
    full_name: string;
    email: string;
    phone: string;
  };
}

interface MonthlyData {
  month: string;
  applications: number;
  approved: number;
  disbursed: number;
  rejected: number;
  amount: number;
}

interface LoanPurposeData {
  name: string;
  value: number;
  count: number;
  [key: string]: string | number;
}

interface RiskCategory {
  category: string;
  count: number;
  percentage: number;
  amount: number;
  [key: string]: string | number;
}

interface LoanTypeStats {
  type: string;
  count: number;
  totalAmount: number;
  avgAmount: number;
  interestRate: number;
  outstandingBalance: number;
  [key: string]: string | number;
}

interface Transaction {
  id: number;
  transaction_type?: string;
  type: string;
  amount: string;
  reference: string;
  notes: string;
  transaction_date: string;
  loan_application_id?: number;
  borrower_id?: number;
  created_at: string;
  updated_at: string;
}


const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function Reports() {
  const [reportType, setReportType] = useState("overview");
  const [loanData, setLoanData] = useState<LoanApplication[]>([]);
  const [loanTypes, setLoanTypes] = useState<LoanType[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date(),
  });

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [loansResponse, typesResponse, transactionsResponse] = await Promise.all([
          apiService.get<{ data: LoanApplication[] }>('/loan-applications'),
          apiService.get<{ data: LoanType[] }>('/loan-types'),
          apiService.get<{ data: Transaction[] }>('/transactions'),
        ]);

        setLoanData(loansResponse.data || []);
        setLoanTypes(typesResponse.data || []);
        setTransactions(transactionsResponse.data || []);
      } catch (error) {
        console.error('Error fetching report data:', error);
        toast.error('Failed to load report data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter loans by date range
  const filteredLoans = loanData.filter((loan) => {
    if (!dateRange.from || !dateRange.to) return true;
    const loanDate = new Date(loan.created_at);
    return loanDate >= dateRange.from && loanDate <= dateRange.to;
  });

  // Filter only disbursed loans for financial calculations
  const disbursedLoans = filteredLoans.filter((loan) => {
    const status = loan.loan_status.toLowerCase();
    return status === 'disbursed' || status === 'active' || status === 'closed';
  });

  // Calculate key metrics
  const totalPortfolio = disbursedLoans.reduce(
    (sum, loan) => sum + parseFloat(loan.principal_amount),
    0
  );

  const filteredTransactions = transactions.filter((transaction) => {
    if (!dateRange.from || !dateRange.to) return true;
    const transactionDate = new Date(transaction.transaction_date);
    return transactionDate >= dateRange.from && transactionDate <= dateRange.to;
  });
 
  const totalTransactions = filteredTransactions.length;
  const totalTransactionAmount = filteredTransactions.reduce(
    (sum, transaction) => sum + parseFloat(transaction.amount),
    0
  );
  const paymentTransactions = filteredTransactions.filter(
    t => t.transaction_type?.toLowerCase() === 'payment'
  ).length;

  //
  // Process monthly transaction data
const monthlyTransactionData = Object.values(
  filteredTransactions.reduce((acc: Record<string, {month: string, count: number, amount: number}>, transaction) => {
    const date = new Date(transaction.transaction_date);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    const month = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;

    if (!acc[monthKey]) {
      acc[monthKey] = {
        month,
        count: 0,
        amount: 0,
      };
    }

    acc[monthKey].count += 1;
    acc[monthKey].amount += parseFloat(transaction.amount);

    return acc;
  }, {})
).sort((a, b) => {
  const [aMonth, aYear] = a.month.split(' ');
  const [bMonth, bYear] = b.month.split(' ');
  return new Date(`${aMonth} 1, ${aYear}`).getTime() - new Date(`${bMonth} 1, ${bYear}`).getTime();
});

// Process transaction type data
const transactionTypeData = Object.entries(
  filteredTransactions.reduce((acc: Record<string, {count: number, amount: number}>, transaction) => {
    const type = transaction.transaction_type || 'Other';
    
    if (!acc[type]) {
      acc[type] = {
        count: 0,
        amount: 0,
      };
    }

    acc[type].count += 1;
    acc[type].amount += parseFloat(transaction.amount);

    return acc;
  }, {})
).map(([name, data]) => ({
  name,
  count: data.count,
  value: data.count,
  amount: data.amount,
  percentage: totalTransactions > 0 ? Math.round((data.count / totalTransactions) * 100) : 0,
}));

  const activeLoans = disbursedLoans.filter(
    (l) => {
      const status = l.loan_status.toLowerCase();
      return status === 'disbursed' || status === 'active';
    }
  ).length;

  const approvedLoans = filteredLoans.filter(
    (l) => {
      const status = l.loan_status.toLowerCase();
      return status === 'approved' || status === 'disbursed' || status === 'active';
    }
  ).length;

  const approvalRate = filteredLoans.length > 0 
    ? (approvedLoans / filteredLoans.length) * 100 
    : 0;

  const defaultLoans = disbursedLoans.filter((l) => l.days_in_arrears > 90);
  const defaultRate = disbursedLoans.length > 0 
    ? (defaultLoans.length / disbursedLoans.length) * 100 
    : 0;

  const totalOutstanding = disbursedLoans.reduce(
    (sum, loan) => sum + parseFloat(loan.balance),
    0
  );

  const totalInterestCollected = disbursedLoans.reduce(
    (sum, loan) => {
      const principal = parseFloat(loan.principal_amount);
      const balance = parseFloat(loan.balance);
      const interest = parseFloat(loan.interest_amount);
      const paidPrincipal = principal - balance;
      const paidRatio = principal > 0 ? paidPrincipal / principal : 0;
      return sum + (interest * paidRatio);
    },
    0
  );

  // Process monthly loan data
  const monthlyLoanData: MonthlyData[] = Object.values(
    filteredLoans.reduce((acc: Record<string, MonthlyData>, loan) => {
      const date = new Date(loan.created_at);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const month = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;

      if (!acc[monthKey]) {
        acc[monthKey] = {
          month,
          applications: 0,
          approved: 0,
          disbursed: 0,
          rejected: 0,
          amount: 0,
        };
      }

      acc[monthKey].applications += 1;

      const status = loan.loan_status.toLowerCase();
      if (status === 'approved') acc[monthKey].approved += 1;
      if (status === 'disbursed' || status === 'active' || status === 'closed') {
        acc[monthKey].disbursed += 1;
        acc[monthKey].amount += parseFloat(loan.principal_amount);
      }
      if (status === 'rejected') acc[monthKey].rejected += 1;

      return acc;
    }, {})
  ).sort((a, b) => {
    const [aMonth, aYear] = a.month.split(' ');
    const [bMonth, bYear] = b.month.split(' ');
    return new Date(`${aMonth} 1, ${aYear}`).getTime() - new Date(`${bMonth} 1, ${bYear}`).getTime();
  });

// Process loan purpose data (from disbursed loans)
const loanPurposeData: LoanPurposeData[] = Object.values(
  disbursedLoans.reduce((acc: Record<string, LoanPurposeData>, loan) => {
    const purposeRaw = loan.purpose || 'Other';
    const purposeKey = purposeRaw.toLowerCase(); // normalize for case-insensitive grouping

    if (!acc[purposeKey]) {
      acc[purposeKey] = { name: purposeRaw, value: 0, count: 0 };
    }

    acc[purposeKey].count += 1;
    return acc;
  }, {})
)
  .map((item) => ({
    ...item,
    // compute percentage
    value:
      disbursedLoans.length > 0
        ? Math.round((item.count / disbursedLoans.length) * 100)
        : 0,
    // optional: format the name nicely (capitalize first letter)
    name: item.name.charAt(0).toUpperCase() + item.name.slice(1).toLowerCase(),
  }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 8);

  // Risk analysis data (only for disbursed loans)
  const riskCategories: RiskCategory[] = [
    {
      category: 'Low Risk',
      count: disbursedLoans.filter((l) => l.days_in_arrears === 0).length,
      percentage: 0,
      amount: disbursedLoans
        .filter((l) => l.days_in_arrears === 0)
        .reduce((sum, l) => sum + parseFloat(l.balance), 0),
    },
    {
      category: 'Medium Risk',
      count: disbursedLoans.filter((l) => l.days_in_arrears > 0 && l.days_in_arrears <= 30).length,
      percentage: 0,
      amount: disbursedLoans
        .filter((l) => l.days_in_arrears > 0 && l.days_in_arrears <= 30)
        .reduce((sum, l) => sum + parseFloat(l.balance), 0),
    },
    {
      category: 'High Risk',
      count: disbursedLoans.filter((l) => l.days_in_arrears > 30 && l.days_in_arrears <= 90).length,
      percentage: 0,
      amount: disbursedLoans
        .filter((l) => l.days_in_arrears > 30 && l.days_in_arrears <= 90)
        .reduce((sum, l) => sum + parseFloat(l.balance), 0),
    },
    {
      category: 'Default',
      count: disbursedLoans.filter((l) => l.days_in_arrears > 90).length,
      percentage: 0,
      amount: disbursedLoans
        .filter((l) => l.days_in_arrears > 90)
        .reduce((sum, l) => sum + parseFloat(l.balance), 0),
    },
  ].map((cat) => ({
    ...cat,
    percentage: disbursedLoans.length > 0 ? Math.round((cat.count / disbursedLoans.length) * 100) : 0,
  }));

  // Create a lookup map for loan types
  const loanTypeMap = loanTypes.reduce((map, type) => {
    map[type.id] = type;
    return map;
  }, {} as Record<number, LoanType>);

  // Loan type statistics (only for disbursed loans)
  const loanTypeStats: LoanTypeStats[] = Object.values(
    disbursedLoans.reduce((acc: Record<string, LoanTypeStats>, loan) => {
      const loanType = loanTypeMap[loan.loan_type_id];
      const typeKey = loanType?.loanType || 'Unknown';
      
      if (!acc[typeKey]) {
        acc[typeKey] = {
          type: typeKey,
          count: 0,
          totalAmount: 0,
          avgAmount: 0,
          interestRate: parseFloat(loanType?.interest_rate || '0'),
          outstandingBalance: 0,
        };
      }
      
      acc[typeKey].count += 1;
      acc[typeKey].totalAmount += parseFloat(loan.principal_amount);
      acc[typeKey].outstandingBalance += parseFloat(loan.balance);
      
      return acc;
    }, {})
  ).map((stat) => ({
    ...stat,
    avgAmount: stat.count > 0 ? stat.totalAmount / stat.count : 0,
  })).sort((a, b) => b.totalAmount - a.totalAmount);

  // High-risk loans (only from disbursed loans)
  const highRiskLoans = disbursedLoans
    .filter((l) => l.days_in_arrears > 0)
    .sort((a, b) => b.days_in_arrears - a.days_in_arrears)
    .slice(0, 10);

  // Repayment performance data (only for disbursed loans)
  const repaymentPerformance = monthlyLoanData.map((month) => {
    const monthLoans = disbursedLoans.filter((l) => {
      const loanDate = new Date(l.created_at);
      const loanMonth = `${monthNames[loanDate.getMonth()]} ${loanDate.getFullYear()}`;
      return loanMonth === month.month;
    });

    const onTime = monthLoans.filter((l) => l.days_in_arrears === 0).length;
    const late = monthLoans.filter((l) => l.days_in_arrears > 0 && l.days_in_arrears <= 30).length;
    const defaulted = monthLoans.filter((l) => l.days_in_arrears > 30).length;
    const total = monthLoans.length || 1;

    return {
      month: month.month,
      onTime: Math.round((onTime / total) * 100),
      late: Math.round((late / total) * 100),
      defaulted: Math.round((defaulted / total) * 100),
    };
  });

  // Collection rate calculation
  const collectionRate = disbursedLoans.length > 0
    ? ((disbursedLoans.filter(l => l.days_in_arrears === 0).length / disbursedLoans.length) * 100)
    : 0;

  // Export functions
  const exportOverviewReport = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      let yPos = 20;

      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Portfolio Overview Report', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Period: ${formatDate(dateRange.from?.toISOString() || '')} - ${formatDate(dateRange.to?.toISOString() || '')}`,
        pageWidth / 2,
        yPos,
        { align: 'center' }
      );
      yPos += 15;

      // Summary metrics
      const summaryData = [
        ['Total Portfolio Value', formatCurrency(totalPortfolio)],
        ['Active Loans', activeLoans.toString()],
        ['Total Applications', filteredLoans.length.toString()],
        ['Disbursed Loans', disbursedLoans.length.toString()],
        ['Approval Rate', `${approvalRate.toFixed(1)}%`],
        ['Default Rate', `${defaultRate.toFixed(1)}%`],
        ['Collection Rate', `${collectionRate.toFixed(1)}%`],
        ['Total Outstanding', formatCurrency(totalOutstanding)],
        ['Total Interest Collected', formatCurrency(totalInterestCollected)],
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241], fontStyle: 'bold' },
        columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Loan by purpose
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Disbursed Loans by Purpose', 14, yPos);
      yPos += 7;

      const purposeData = loanPurposeData.map((p) => [
        p.name,
        p.count.toString(),
        `${p.value}%`,
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Purpose', 'Count', 'Percentage']],
        body: purposeData,
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241] },
        columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' } },
      });

      // Footer
      doc.setFontSize(8);
      doc.text(
        `Generated: ${formatDate(new Date().toISOString())}`,
        14,
        doc.internal.pageSize.height - 10
      );

      doc.save(`portfolio-overview-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Report downloaded successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    }
  };

  const exportDefaultReport = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      let yPos = 20;

      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Default Loans Report', pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;

      const summaryData = [
        ['Total Disbursed Loans', disbursedLoans.length.toString()],
        ['Defaulted Loans', defaultLoans.length.toString()],
        ['Default Rate', `${defaultRate.toFixed(2)}%`],
        ['Total Default Amount', formatCurrency(
          defaultLoans.reduce((sum, l) => sum + parseFloat(l.balance), 0)
        )],
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'striped',
        headStyles: { fillColor: [220, 53, 69] },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Default Loan Details', 14, yPos);
      yPos += 7;

      const defaultData = defaultLoans.slice(0, 20).map((loan) => [
        loan.loan_number,
        loan.borrower?.full_name || 'N/A',
        formatCurrency(loan.principal_amount),
        formatCurrency(loan.balance),
        loan.days_in_arrears.toString(),
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Loan #', 'Borrower', 'Amount', 'Outstanding', 'Days Overdue']],
        body: defaultData,
        theme: 'grid',
        headStyles: { fillColor: [220, 53, 69] },
        columnStyles: {
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'center' },
        },
      });

      doc.save(`default-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Default report downloaded');
    } catch (error) {
      console.error('Error generating default report:', error);
      toast.error('Failed to generate report');
    }
  };

const exportTransactionReport = async (data: Transaction[]) => {
  try {
    const response = await apiService.get('/transactions');
    const transactions = response.data;
    
    if (!transactions) {
      throw new Error('Failed to fetch transactions');
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPos = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Transaction Report', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Period: ${formatDate(dateRange.from?.toISOString() || '')} - ${formatDate(dateRange.to?.toISOString() || '')}`,
      pageWidth / 2,
      yPos,
      { align: 'center' }
    );
    yPos += 15;

    // Summary metrics
    const totalAmount = transactions.reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0);
    const paymentCount = transactions.filter((t: any) => t.transaction_type?.toLowerCase() === 'payment').length;
    const disbursementCount = transactions.filter((t: any) => t.transaction_type?.toLowerCase() === 'disbursement').length;

    const summaryData = [
      ['Total Transactions', transactions.length.toString()],
      ['Total Amount', formatCurrency(totalAmount)],
      ['Payment Transactions', paymentCount.toString()],
      ['Disbursement Transactions', disbursementCount.toString()],
      ['Average Transaction', formatCurrency(transactions.length > 0 ? totalAmount / transactions.length : 0)],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241], fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Transaction type breakdown
  const typeBreakdown = Object.entries(
    data.reduce((acc: Record<string, {count: number, amount: number}>, transaction) => {
      const type = transaction.transaction_type || 'Other';
      if (!acc[type]) {
        acc[type] = { count: 0, amount: 0 };
      }
      acc[type].count += 1;
      acc[type].amount += parseFloat(transaction.amount || '0');
      return acc;
    }, {})
  ).map(([type, data]) => [type, data.count.toString(), formatCurrency(data.amount)]);
  
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Transaction Type Breakdown', 14, yPos);
    yPos += 7;

    autoTable(doc, {
      startY: yPos,
      head: [['Type', 'Count', 'Total Amount']],
      body: typeBreakdown,
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241] },
      columnStyles: { 
        1: { halign: 'center' },
        2: { halign: 'right' }
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Transaction details table
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Transaction Details', 14, yPos);
    yPos += 7;

    const transactionData = transactions.map((transaction: any) => [
      transaction.id.toString(),
      transaction.transaction_type || 'N/A',
      formatCurrency(transaction.amount || 0),
      transaction.reference || 'N/A',
      (transaction.notes || 'N/A').substring(0, 30) + (transaction.notes && transaction.notes.length > 30 ? '...' : ''),
      formatDate(transaction.transaction_date) || 'N/A',
      transaction.loan_application_id ? `#${transaction.loan_application_id}` : 'N/A'
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['ID', 'Type', 'Amount', 'Reference', 'Notes', 'Date', 'Loan #']],
      body: transactionData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25, halign: 'right' },
        3: { cellWidth: 30 },
        4: { cellWidth: 35 },
        5: { cellWidth: 25 },
        6: { cellWidth: 20, halign: 'center' }
      },
      margin: { top: 10 },
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Generated: ${formatDate(new Date().toISOString())} - Page ${i} of ${pageCount}`,
        14,
        doc.internal.pageSize.height - 10
      );
    }

    doc.save(`transactions-report-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Transaction report downloaded successfully');
  } catch (error) {
    console.error('Error exporting transaction report:', error);
    toast.error('Failed to export transaction report');
  }
};

  const handleExportReport = (format: 'pdf' | 'excel') => {
    if (format === 'pdf') {
      switch (reportType) {
        case 'overview':
        case 'performance':
        case 'risk':
          exportOverviewReport();
          break;
        case 'defaults':
          exportDefaultReport();
          break;
        case 'transactions':
          exportTransactionReport(transactions);
          break;
        default:
          toast.info('Export feature coming soon for this report type');
      }
    } else {
      toast.info('Excel export coming soon');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Report Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select report" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Portfolio Overview</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
              {/* <SelectItem value="risk">Risk Analysis</SelectItem> */}
              <SelectItem value="defaults">Defaults</SelectItem>
              <SelectItem value="transactions">Transactions</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[280px] justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {formatDate(dateRange.from.toISOString())} - {formatDate(dateRange.to.toISOString())}
                    </>
                  ) : (
                    formatDate(dateRange.from.toISOString())
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={(range) =>
                  setDateRange({
                    from: range?.from,
                    to: range?.to,
                  })
                }
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExportReport('pdf')}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          {/* <Button variant="outline" onClick={() => handleExportReport('excel')}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button> */}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Portfolio</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPortfolio)}</div>
            <p className="text-xs text-muted-foreground">{disbursedLoans.length} disbursed loans</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLoans}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{collectionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">On-time payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Default Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{defaultRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">{defaultLoans.length} loans</p>
          </CardContent>
        </Card>
      </div>

      {/* Report Tabs */}
      <Tabs value={reportType} onValueChange={setReportType}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          {/* <TabsTrigger value="risk">Risk</TabsTrigger> */}
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="defaults">Defaults</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Applications</CardTitle>
                <CardDescription>Application trends over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyLoanData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="applications" fill="#6366f1" name="Applications" />
                    <Bar dataKey="approved" fill="#10b981" name="Approved" />
                    <Bar dataKey="disbursed" fill="#8b5cf6" name="Disbursed" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Loan Purpose Distribution</CardTitle>
                <CardDescription>Disbursed loans by purpose</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={loanPurposeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {loanPurposeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

     <Card>
  <CardHeader>
    <CardTitle>Loan Type Statistics</CardTitle>
    <CardDescription>
      Performance by loan type (disbursed loans only)
    </CardDescription>
  </CardHeader>

  <CardContent>
    {loanTypeStats.length === 0 ? (
      <p className="text-center text-muted-foreground py-8">
        No disbursed loans yet
      </p>
    ) : (
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 rounded-lg">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-2 font-semibold">Loan Type</th>
              <th className="text-center px-4 py-2 font-semibold">Number of Loans</th>
              <th className="text-right px-4 py-2 font-semibold">Total Amount</th>
              <th className="text-right px-4 py-2 font-semibold">Average Amount</th>
              <th className="text-center px-4 py-2 font-semibold">Interest Rate</th>
            </tr>
          </thead>

          <tbody>
            {loanTypeStats.map((stat, index) => (
              <tr
                key={index}
                className="border-t hover:bg-muted/30 transition-colors"
              >
                <td className="px-4 py-2 font-medium">{stat.type}</td>
                <td className="text-center px-4 py-2">{stat.count} loans</td>
                <td className="text-right px-4 py-2">
                  {formatCurrency(stat.totalAmount)}
                </td>
                <td className="text-right px-4 py-2">
                  {formatCurrency(stat.avgAmount)}
                </td>
                <td className="text-center px-4 py-2">
                  <Badge variant="outline">
                    {stat.interestRate.toFixed(1)}%
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </CardContent>
</Card>

        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Disbursement Trends</CardTitle>
                <CardDescription>Monthly disbursement amounts</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyLoanData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Area type="monotone" dataKey="amount" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Repayment Performance</CardTitle>
                <CardDescription>On-time vs late payments (disbursed loans)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={repaymentPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend />
                    <Line type="monotone" dataKey="onTime" stroke="#10b981" strokeWidth={2} name="On Time" />
                    <Line type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={2} name="Late" />
                    <Line type="monotone" dataKey="defaulted" stroke="#ef4444" strokeWidth={2} name="Defaulted" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Financial Performance</CardTitle>
              <CardDescription>Key financial metrics from disbursed loans</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Interest Collected</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalInterestCollected)}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Average Interest Rate</p>
                  <p className="text-2xl font-bold">
                    {loanTypeStats.length > 0
                      ? (loanTypeStats.reduce((sum, s) => sum + s.interestRate, 0) / loanTypeStats.length).toFixed(2)
                      : '0.00'}%
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Outstanding</p>
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalOutstanding)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Portfolio Summary</CardTitle>
              <CardDescription>Overview of disbursed loan portfolio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Applications</p>
                  <p className="text-2xl font-bold">{filteredLoans.length}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Disbursed Loans</p>
                  <p className="text-2xl font-bold text-green-600">{disbursedLoans.length}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Approval Rate</p>
                  <p className="text-2xl font-bold">{approvalRate.toFixed(1)}%</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Collection Rate</p>
                  <p className="text-2xl font-bold text-green-600">{collectionRate.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

       {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalTransactions}</div>
                <p className="text-xs text-muted-foreground">In selected period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalTransactionAmount)}</div>
                <p className="text-xs text-muted-foreground">Transaction volume</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Payment Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {totalTransactions > 0 ? Math.round((paymentTransactions / totalTransactions) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">Payment transactions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Avg Transaction</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(totalTransactions > 0 ? totalTransactionAmount / totalTransactions : 0)}
                </div>
                <p className="text-xs text-muted-foreground">Per transaction</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Transaction Trends</CardTitle>
                <CardDescription>Monthly transaction volume and amount</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyTransactionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'amount' ? formatCurrency(value as number) : value,
                        name === 'amount' ? 'Amount' : 'Count'
                      ]}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="count" fill="#6366f1" name="Count" />
                    <Line yAxisId="right" type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} name="Amount" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transaction Types</CardTitle>
                <CardDescription>Distribution by transaction type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={transactionTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {transactionTypeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    <Legend />
                    </Pie>
                    <Tooltip formatter={(value, name, _props) => [
                      name === 'value' ? `${value} transactions` : formatCurrency(value as number),
                      name === 'value' ? 'Count' : 'Amount'
                    ]} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Transaction Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction Summary</CardTitle>
              <CardDescription>Key transaction metrics and breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Disbursements</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {transactionTypeData.find(t => t.name === 'Disbursement')?.count || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(transactionTypeData.find(t => t.name === 'Disbursement')?.amount || 0)}
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Payments</p>
                  <p className="text-2xl font-bold text-green-600">
                    {transactionTypeData.find(t => t.name === 'Payment')?.count || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(transactionTypeData.find(t => t.name === 'Payment')?.amount || 0)}
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Fees</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {transactionTypeData.find(t => t.name === 'Fee')?.count || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(transactionTypeData.find(t => t.name === 'Fee')?.amount || 0)}
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Other</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {transactionTypeData.find(t => t.name === 'Other')?.count || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(transactionTypeData.find(t => t.name === 'Other')?.amount || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest transactions within the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-semibold">No Transactions Found</p>
                  <p className="text-sm text-muted-foreground">No transactions match your selected criteria</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-6 gap-4 p-3 bg-muted/50 rounded-lg font-medium text-sm">
                    <div>Date</div>
                    <div>Type</div>
                    <div>Reference</div>
                    <div className="text-right">Amount</div>
                    <div>Loan #</div>
                    <div>Status</div>
                  </div>
                  {filteredTransactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="grid grid-cols-6 gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="text-sm">{formatDate(transaction.transaction_date)}</div>
                      <div>
                        <Badge variant={
                          transaction.transaction_type?.toLowerCase() === 'payment' ? 'default' :
                          transaction.transaction_type?.toLowerCase() === 'disbursement' ? 'secondary' : 
                          'outline'
                        }>
                          {transaction.transaction_type}
                        </Badge>
                      </div>
                      <div className="text-sm font-mono">{transaction.reference}</div>
                      <div className="text-right font-semibold">
                        {formatCurrency(transaction.amount)}
                      </div>
                      <div className="text-sm">
                        {transaction.loan_application_id ? `#${transaction.loan_application_id}` : 'N/A'}
                      </div>
                      <div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Completed
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* Risk Tab */}
        <TabsContent value="risk" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Risk Distribution</CardTitle>
                <CardDescription>Disbursed portfolio by risk category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={riskCategories} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="category" type="category" width={100} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#6366f1" name="Count" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Amount Distribution</CardTitle>
                <CardDescription>Outstanding by risk level</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={riskCategories}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percentage }) => `${category}: ${percentage}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {riskCategories.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            entry.category === 'Low Risk' ? '#10b981' :
                            entry.category === 'Medium Risk' ? '#f59e0b' :
                            entry.category === 'High Risk' ? '#ef4444' :
                            '#7f1d1d'
                          } 
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Risk Summary</CardTitle>
              <CardDescription>Detailed risk breakdown (disbursed loans only)</CardDescription>
            </CardHeader>
            <CardContent>
              {disbursedLoans.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No disbursed loans to analyze</p>
              ) : (
                <div className="space-y-3">
                  {riskCategories.map((risk, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4 flex-1">
                        <Badge
                          variant={
                            risk.category === 'Low Risk' ? 'default' :
                            risk.category === 'Medium Risk' ? 'secondary' :
                            risk.category === 'High Risk' ? 'destructive' :
                            'destructive'
                          }
                          className="w-24 justify-center"
                        >
                          {risk.category}
                        </Badge>
                        <div className="flex-1">
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="h-2 rounded-full"
                              style={{
                                width: `${risk.percentage}%`,
                                backgroundColor:
                                  risk.category === 'Low Risk' ? '#10b981' :
                                  risk.category === 'Medium Risk' ? '#f59e0b' :
                                  risk.category === 'High Risk' ? '#ef4444' :
                                  '#7f1d1d',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-semibold">{risk.count} loans</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(risk.amount)}</p>
                        <p className="text-xs text-muted-foreground">{risk.percentage}% of portfolio</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>High-Risk Loans</CardTitle>
              <CardDescription>Disbursed loans requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              {highRiskLoans.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <p className="text-lg font-semibold">No High-Risk Loans</p>
                  <p className="text-sm text-muted-foreground">All disbursed loans are performing well</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {highRiskLoans.map((loan) => (
                    <div key={loan.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <Badge variant={loan.days_in_arrears > 90 ? 'destructive' : 'secondary'}>
                          {loan.days_in_arrears > 90 ? 'DEFAULT' : 'HIGH RISK'}
                        </Badge>
                        <div>
                          <p className="font-medium">{loan.loan_number}</p>
                          <p className="text-sm text-muted-foreground">{loan.borrower?.full_name || 'Unknown'}</p>
                          <p className="text-sm">{formatCurrency(loan.principal_amount)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-destructive">{loan.days_in_arrears} days</p>
                        <p className="text-sm text-muted-foreground">overdue</p>
                        <p className="text-sm font-medium">{formatCurrency(loan.balance)} due</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Defaults Tab */}
        <TabsContent value="defaults" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Defaults</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{defaultLoans.length}</div>
                <p className="text-xs text-muted-foreground">Out of {disbursedLoans.length} disbursed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Default Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{defaultRate.toFixed(2)}%</div>
                <p className="text-xs text-muted-foreground">Of disbursed portfolio</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Default Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {formatCurrency(defaultLoans.reduce((sum, l) => sum + parseFloat(l.balance), 0))}
                </div>
                <p className="text-xs text-muted-foreground">Total outstanding</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Default</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(
                    defaultLoans.length > 0
                      ? defaultLoans.reduce((sum, l) => sum + parseFloat(l.balance), 0) / defaultLoans.length
                      : 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Per loan</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Default Loans Details</CardTitle>
              <CardDescription>Disbursed loans in default status (90+ days overdue)</CardDescription>
            </CardHeader>
            <CardContent>
              {defaultLoans.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <p className="text-lg font-semibold">No Loans in Default</p>
                  <p className="text-sm text-muted-foreground">All disbursed loans are performing well</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-7 gap-4 p-3 bg-muted/50 rounded-lg font-medium text-sm">
                    <div>Loan Number</div>
                    <div>Borrower</div>
                    <div className="text-right">Principal</div>
                    <div className="text-right">Outstanding</div>
                    <div className="text-center">Days Overdue</div>
                    <div>Due Date</div>
                    <div className="text-center">Status</div>
                  </div>
                  {defaultLoans.map((loan) => (
                    <div key={loan.id} className="grid grid-cols-7 gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="font-medium">{loan.loan_number}</div>
                      <div>{loan.borrower?.full_name || 'N/A'}</div>
                      <div className="text-right font-semibold">{formatCurrency(loan.principal_amount)}</div>
                      <div className="text-right font-semibold text-destructive">{formatCurrency(loan.balance)}</div>
                      <div className="text-center">
                        <Badge variant="destructive">{loan.days_in_arrears}</Badge>
                      </div>
                      <div className="text-sm">{formatDate(loan.loan_due_date)}</div>
                      <div className="text-center">
                        <Badge variant="destructive">DEFAULT</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}