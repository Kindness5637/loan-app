import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { apiService } from '@/services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Wallet,
  DollarSign,
  HandCoins,
  AlertTriangle,
  FileText,
  Eye,
  RefreshCw,
  CreditCard,
  Search,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import type { LoanApplication } from '@/types/loan';
import { formatDate } from '@/lib/utils';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';

// KES formatter with 2 fraction digits — unlike the 0-digit variant used in
// LoanPortfolio, a balance report must show exact cents.
// NaN-safe: all money fields arrive from the API as strings.
const formatCurrency = (amount: number | string) => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const safe = Number.isFinite(numAmount) ? numAmount : 0;
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2,
  }).format(safe);
};

// Statuses that represent money actually lent out — only these can carry a
// balance. 'pending-approval', 'approved' and 'rejected' loans have not been
// disbursed, so they hold no balance and are excluded by default.
const BALANCE_STATUSES = ['active', 'disbursed', 'defaulted', 'completed'];

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

// Safe parse of string money fields from the API ("0" | "1234.56" | null)
const toNumber = (value: string | number | null | undefined): number => {
  const parsed = typeof value === 'string' ? parseFloat(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : 0;
};

// Aggregated balance per customer across all their (filtered) loans
interface CustomerBalanceSummary {
  borrowerId: number;
  fullName: string;
  phone: string;
  email: string | null;
  loanCount: number;
  totalPrincipal: number;
  totalInterest: number;
  totalBalance: number;
  totalArrears: number;
  loansInArrears: number;
  maxDaysInArrears: number;
}

export default function LoanBalances() {
  const navigate = useNavigate();

  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('balance-bearing');
  const [view, setView] = useState('customers');

  // Set breadcrumbs
  useBreadcrumbs([
    { label: 'Dashboard', href: '/' },
    { label: 'Credit Services', href: '/loan-portfolio' },
    { label: 'Loan Balances', icon: <Wallet className="h-4 w-4" /> },
  ]);

  const fetchLoans = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const response = await apiService.get('/loan-applications');
      const dataList: LoanApplication[] = Array.isArray(response) ? response : (response?.data || []);
      setLoans(dataList);

      if (isRefresh) {
        toast.success('Balances refreshed successfully');
      }
    } catch (error: any) {
      console.error('Failed to fetch loan balances:', error);
      toast.error('Failed to load loan balances', {
        description: error?.message || 'Please try again later.',
      });
      setLoans([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  // Apply status filter + search (search matches customer, loan #, phone, type)
  const filteredLoans = useMemo(() => {
    let result = [...loans];

    if (statusFilter === 'balance-bearing') {
      result = result.filter((l) => BALANCE_STATUSES.includes(l.loan_status));
    } else if (statusFilter !== 'all') {
      result = result.filter((l) => l.loan_status === statusFilter);
    }

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter((l) =>
        [
          l.loan_number,
          l.borrower?.full_name,
          l.borrower?.phone,
          l.loan_type?.loanType,
          l.loan_type?.loanCode,
        ].some((value) => value && String(value).toLowerCase().includes(query))
      );
    }

    return result;
  }, [loans, statusFilter, searchQuery]);

  // Per-customer aggregation over the filtered loans
  const customerSummaries = useMemo(() => {
    const map = new Map<number, CustomerBalanceSummary>();

    for (const loan of filteredLoans) {
      const borrowerId = loan.borrower_id;
      const existing = map.get(borrowerId);
      const principal = toNumber(loan.principal_amount);
      const interest = toNumber(loan.interest_amount);
      const balance = toNumber(loan.balance);
      const arrears = toNumber(loan.arrears_amount);
      const daysInArrears = loan.days_in_arrears || 0;

      if (existing) {
        existing.loanCount += 1;
        existing.totalPrincipal += principal;
        existing.totalInterest += interest;
        existing.totalBalance += balance;
        existing.totalArrears += arrears;
        existing.maxDaysInArrears = Math.max(existing.maxDaysInArrears, daysInArrears);
        if (arrears > 0 || daysInArrears > 0) existing.loansInArrears += 1;
      } else {
        map.set(borrowerId, {
          borrowerId,
          fullName: loan.borrower?.full_name || 'Unknown',
          phone: loan.borrower?.phone || 'N/A',
          email: loan.borrower?.email ?? null,
          loanCount: 1,
          totalPrincipal: principal,
          totalInterest: interest,
          totalBalance: balance,
          totalArrears: arrears,
          loansInArrears: arrears > 0 || daysInArrears > 0 ? 1 : 0,
          maxDaysInArrears: daysInArrears,
        });
      }
    }

    // Highest exposure first
    return Array.from(map.values()).sort((a, b) => b.totalBalance - a.totalBalance);
  }, [filteredLoans]);

  // Summary stats over the filtered loans
  const totalOutstanding = useMemo(
    () => filteredLoans.reduce((sum, l) => sum + toNumber(l.balance), 0),
    [filteredLoans]
  );
  const totalPrincipal = useMemo(
    () => filteredLoans.reduce((sum, l) => sum + toNumber(l.principal_amount), 0),
    [filteredLoans]
  );
  const totalInterest = useMemo(
    () => filteredLoans.reduce((sum, l) => sum + toNumber(l.interest_amount), 0),
    [filteredLoans]
  );
  const arrearsLoans = useMemo(
    () =>
      filteredLoans.filter(
        (l) => toNumber(l.arrears_amount) > 0 || (l.days_in_arrears || 0) > 0
      ),
    [filteredLoans]
  );
  const totalArrears = useMemo(
    () => arrearsLoans.reduce((sum, l) => sum + toNumber(l.arrears_amount), 0),
    [arrearsLoans]
  );

  // PDF export — exports the currently selected view + applied filters/search.
  // Balance totals come straight from the API's `balance` field (maintained
  // server-side on repay/pay-off/offset); they are NOT recomputed client-side.
  const exportToPDF = () => {
    try {
      const doc = new jsPDF('landscape');

      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Customer Loan Balance Report', 14, 22);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 32);

      const startY = 40;

      if (view === 'customers') {
        const tableData = customerSummaries.map((c, idx) => [
          String(idx + 1),
          c.fullName,
          c.phone,
          String(c.loanCount),
          formatCurrency(c.totalPrincipal),
          formatCurrency(c.totalInterest),
          formatCurrency(c.totalBalance),
          formatCurrency(c.totalArrears),
          String(c.maxDaysInArrears),
        ]);

        // Add totals row
        tableData.push([
          '',
          'TOTALS',
          '',
          String(filteredLoans.length),
          formatCurrency(totalPrincipal),
          formatCurrency(totalInterest),
          formatCurrency(totalOutstanding),
          formatCurrency(totalArrears),
          String(arrearsLoans.length),
        ]);

        autoTable(doc, {
          head: [['#', 'Customer', 'Phone', 'Loans', 'Principal', 'Interest', 'Balance', 'Arrears', 'Days in Arrears']],
          body: tableData,
          startY,
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [66, 66, 66], fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          columnStyles: {
            0: { halign: 'center', cellWidth: 10 },
            4: { halign: 'right' },
            5: { halign: 'right' },
            6: { halign: 'right' },
            7: { halign: 'right' },
            8: { halign: 'center' },
          },
          didParseCell: (data) => {
            if (data.row.index === tableData.length - 1) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [230, 230, 230];
            }
          },
        });
      } else {
        const tableData = filteredLoans.map((loan, idx) => [
          String(idx + 1),
          loan.loan_number,
          loan.borrower?.full_name || 'Unknown',
          loan.loan_type?.loanType || 'N/A',
          formatCurrency(loan.principal_amount),
          formatCurrency(loan.interest_amount),
          formatCurrency(loan.balance),
          formatCurrency(loan.arrears_amount),
          String(loan.days_in_arrears || 0),
          loan.loan_status,
          formatDate(loan.loan_due_date),
        ]);

        // Add totals row
        tableData.push([
          '',
          'TOTALS',
          '',
          '',
          formatCurrency(totalPrincipal),
          formatCurrency(totalInterest),
          formatCurrency(totalOutstanding),
          formatCurrency(totalArrears),
          String(arrearsLoans.length),
          '',
          '',
        ]);

        autoTable(doc, {
          head: [['#', 'Loan #', 'Customer', 'Type', 'Principal', 'Interest', 'Balance', 'Arrears', 'Days', 'Status', 'Due Date']],
          body: tableData,
          startY,
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [66, 66, 66], fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          columnStyles: {
            0: { halign: 'center', cellWidth: 10 },
            4: { halign: 'right' },
            5: { halign: 'right' },
            6: { halign: 'right' },
            7: { halign: 'right' },
            8: { halign: 'center' },
          },
          didParseCell: (data) => {
            if (data.row.index === tableData.length - 1) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [230, 230, 230];
            }
          },
        });
      }

      // Footer
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

      doc.save(`loan-balances-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to generate PDF: ' + (error as Error).message);
    }
  };

  const hasData = filteredLoans.length > 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wallet className="h-8 w-8 text-primary" />
            Loan Balances
          </h1>
          <p className="text-muted-foreground mt-1">
            Customer loan balance report — outstanding balances per customer and per loan
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLoans(true)}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToPDF}
            disabled={!hasData}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold text-orange-600">{formatCurrency(totalOutstanding)}</div>
                <p className="text-xs text-muted-foreground">{filteredLoans.length} loans</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Principal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(totalPrincipal)}</div>
                <p className="text-xs text-muted-foreground">Disbursed principal</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Interest Accrued</CardTitle>
            <HandCoins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(totalInterest)}</div>
                <p className="text-xs text-muted-foreground">Total interest on loans</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Arrears</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold text-destructive">{formatCurrency(totalArrears)}</div>
                <p className="text-xs text-muted-foreground">{arrearsLoans.length} loans past due</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer, loan number, phone, or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="balance-bearing">Balance-bearing loans</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="disbursed">Disbursed</SelectItem>
                <SelectItem value="defaulted">Defaulted</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="all">All statuses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Report Views */}
      <Tabs value={view} onValueChange={setView}>
        <TabsList className="grid w-full grid-cols-2 sm:w-[400px]">
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Per Customer
          </TabsTrigger>
          <TabsTrigger value="loans" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Per Loan
          </TabsTrigger>
        </TabsList>

        {/* Per-Customer View */}
        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Balances</CardTitle>
              <CardDescription>
                Aggregated outstanding balance per customer across all their loans
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : customerSummaries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <Users className="h-10 w-10 text-muted-foreground mb-3" />
                  <h3 className="text-lg font-semibold mb-1">No customer balances found</h3>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting the search or status filter
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead className="text-center">Loans</TableHead>
                        <TableHead className="text-right">Principal</TableHead>
                        <TableHead className="text-right">Interest</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead className="text-right">Arrears</TableHead>
                        <TableHead className="text-center">Days in Arrears</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customerSummaries.map((c, idx) => (
                        <TableRow key={c.borrowerId}>
                          <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell className="font-medium">{c.fullName}</TableCell>
                          <TableCell>{c.phone}</TableCell>
                          <TableCell className="text-center">{c.loanCount}</TableCell>
                          <TableCell className="text-right">{formatCurrency(c.totalPrincipal)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(c.totalInterest)}</TableCell>
                          <TableCell className="text-right font-semibold text-orange-600">
                            {formatCurrency(c.totalBalance)}
                          </TableCell>
                          <TableCell className={`text-right ${c.totalArrears > 0 ? 'text-destructive font-semibold' : ''}`}>
                            {formatCurrency(c.totalArrears)}
                          </TableCell>
                          <TableCell className="text-center">
                            {c.maxDaysInArrears > 0 ? (
                              <Badge variant="destructive">{c.maxDaysInArrears} days</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const customerLoans = filteredLoans.filter(
                                  (l) => l.borrower_id === c.borrowerId
                                );
                                const activeLoan =
                                  customerLoans.find(
                                    (l) => l.loan_status === "active" || l.loan_status === "disbursed"
                                  ) || customerLoans[0];
                                if (activeLoan) {
                                  navigate(`/loan-portfolio/${activeLoan.loan_number}`);
                                }
                              }}
                              title="View loan details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell colSpan={3}>Totals</TableCell>
                        <TableCell className="text-center">{filteredLoans.length}</TableCell>
                        <TableCell className="text-right">{formatCurrency(totalPrincipal)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(totalInterest)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(totalOutstanding)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(totalArrears)}</TableCell>
                        <TableCell className="text-center">{arrearsLoans.length}</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Per-Loan View */}
        <TabsContent value="loans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Loan Balances</CardTitle>
              <CardDescription>
                Outstanding balance per loan, with arrears and due dates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : filteredLoans.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <CreditCard className="h-10 w-10 text-muted-foreground mb-3" />
                  <h3 className="text-lg font-semibold mb-1">No loan balances found</h3>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting the search or status filter
                  </p>
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Loan #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Principal</TableHead>
                        <TableHead className="text-right">Interest</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead className="text-right">Arrears</TableHead>
                        <TableHead className="text-center">Days in Arrears</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLoans.map((loan, idx) => (
                        <TableRow key={loan.id}>
                          <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell className="font-medium">{loan.loan_number}</TableCell>
                          <TableCell>{loan.borrower?.full_name || 'Unknown'}</TableCell>
                          <TableCell>{loan.loan_type?.loanType || 'N/A'}</TableCell>
                          <TableCell className="text-right">{formatCurrency(loan.principal_amount)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(loan.interest_amount)}</TableCell>
                          <TableCell className="text-right font-semibold text-orange-600">
                            {formatCurrency(loan.balance)}
                          </TableCell>
                          <TableCell className={`text-right ${toNumber(loan.arrears_amount) > 0 ? 'text-destructive font-semibold' : ''}`}>
                            {formatCurrency(loan.arrears_amount)}
                          </TableCell>
                          <TableCell className="text-center">
                            {(loan.days_in_arrears || 0) > 0 ? (
                              <Badge variant="destructive">{loan.days_in_arrears} days</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(loan.loan_status)}</TableCell>
                          <TableCell>{formatDate(loan.loan_due_date)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/loan-portfolio/${loan.loan_number}`)}
                              title="View loan details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell colSpan={4}>Totals</TableCell>
                        <TableCell className="text-right">{formatCurrency(totalPrincipal)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(totalInterest)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(totalOutstanding)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(totalArrears)}</TableCell>
                        <TableCell className="text-center">{arrearsLoans.length}</TableCell>
                        <TableCell colSpan={3}></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
