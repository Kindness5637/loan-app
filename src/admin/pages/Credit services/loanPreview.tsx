import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Calendar,
  DollarSign,
  TrendingDown,
  Percent,
  FileText,
  Download,
  Printer,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { apiService } from '@/services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

interface LoanScheduleItem {
  installment_number: number;
  due_date: string;
  principal_due: number;
  interest_due: number;
  payment_amount: number;
  balance_after_payment: number;
}

interface LoanScheduleData {
  loan_type: string;
  principal_amount: number;
  interest_rate: number;
  interest_method: string;
  total_interest: number;
  total_repayment: number;
  monthly_payment: number;
  duration_months: number;
  schedule: LoanScheduleItem[];
}

interface ApiResponse {
  message: string;
  data: LoanScheduleData;
}

export default function LoanPreview() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showFullSchedule, setShowFullSchedule] = useState(false);
  const [scheduleData, setScheduleData] = useState<LoanScheduleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { loanData } = location.state || {};
  const fetchPreview = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.post<ApiResponse>("/loan-schedule-preview", loanData);
      
      if (response.data) {
        setScheduleData(response.data);
      } else {
        toast.error("Invalid response format:" + response.message);
      }
    } catch (error) {
      toast.error("Error fetching loan preview: " + (error instanceof Error ? error.message : String(error)));

    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (loanData) {
      fetchPreview();
    } else {
      setIsLoading(false);
    }
  }, [loanData]);

  const exportToPDF = () => {
      if (!scheduleData) return;
    
      const doc = new jsPDF();
    
      // Title
      doc.setFontSize(16);
      doc.text("Loan Repayment Schedule", 14, 15);
    
      // Loan Summary Info
      doc.setFontSize(10);
      doc.text(`Loan Type: ${scheduleData.loan_type}`, 14, 25);
      doc.text(`Principal: ${formatCurrency(scheduleData.principal_amount)}`, 14, 31);
      doc.text(`Interest Rate: ${scheduleData.interest_rate}% (${scheduleData.interest_method})`, 14, 37);
      doc.text(`Total Repayment: ${formatCurrency(scheduleData.total_repayment)}`, 14, 43);
      doc.text(`Duration: ${scheduleData.duration_months} months`, 14, 49);
    
      // Add a little spacing before table
      autoTable(doc, {
        startY: 55,
        head: [['#', 'Due Date', 'Principal', 'Interest', 'Payment', 'Balance']],
        body: scheduleData.schedule.map(item => [
          item.installment_number,
          formatDate(item.due_date),
          formatCurrency(item.principal_due),
          formatCurrency(item.interest_due),
          formatCurrency(item.payment_amount),
          formatCurrency(item.balance_after_payment),
        ]),
        styles: { fontSize: 9, halign: 'right' },
        headStyles: { fillColor: [37, 99, 235], halign: 'center' },
        columnStyles: {
          0: { halign: 'center' },
          1: { halign: 'center' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right' },
        },
      });
    
      doc.save(`loan-schedule-${Date.now()}.pdf`);
    };
    

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <h2 className="text-xl font-semibold">Generating Loan Preview...</h2>
          <p className="text-muted-foreground">Please wait while we calculate your payment schedule.</p>
        </div>
      </div>
    );
  }

  // Redirect if no data
  if (!scheduleData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">No Loan Data Found</h2>
          <p className="text-muted-foreground">Please start a new loan application.</p>
          <Button onClick={() => navigate('/loan-application')}>Go to Loan Application</Button>
        </div>
      </div>
    );
  }

  const handleDownload = () => {
    const csvContent = [
      ['Installment', 'Due Date', 'Principal', 'Interest', 'Payment', 'Balance'],
      ...scheduleData.schedule.map((item) => [
        item.installment_number,
        formatDate(item.due_date),
        item.principal_due,
        item.interest_due,
        item.payment_amount,
        item.balance_after_payment,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loan-schedule-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const displayedSchedule = showFullSchedule
    ? scheduleData.schedule
    : scheduleData.schedule.slice(0, 6);

  return (
    <div className="min-h-screen">
      <div className="mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Loan Schedule Preview</h1>
              <p className="text-muted-foreground mt-1">
                Review your loan repayment plan before confirmation
              </p>
            </div>
          </div>
          <Button 
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Done
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Principal Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(scheduleData.principal_amount)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{scheduleData.loan_type}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Interest Rate</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {scheduleData.interest_rate}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {scheduleData.interest_method} method
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Interest</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(scheduleData.total_interest)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Over {scheduleData.duration_months} months
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Repayment</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(scheduleData.total_repayment)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Principal + Interest</p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Payment Highlight */}
        <Card className="md:px-10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Monthly Payment</p>
                <p className="text-4xl font-bold text-blue-700">
                  {formatCurrency(scheduleData.monthly_payment)}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  Due on the 8th of each month
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Duration</p>
                <p className="text-2xl font-bold text-blue-700">
                  {scheduleData.duration_months} <span className="text-lg">months</span>
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  {Math.floor(scheduleData.duration_months / 12)} years {scheduleData.duration_months % 12} months
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Schedule Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Payment Schedule
                </CardTitle>
                <CardDescription>Detailed breakdown of your monthly payments</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  CSV
                </Button>
                <Button variant="outline" size="sm" onClick={exportToPDF}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">#</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Due Date</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Principal</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Interest</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Payment</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {displayedSchedule.map((item) => (
                    <tr key={item.installment_number} className="hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <Badge variant="outline">{item.installment_number}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">{formatDate(item.due_date)}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium">
                        {formatCurrency(item.principal_due)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-orange-600">
                        {formatCurrency(item.interest_due)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-blue-600">
                        {formatCurrency(item.payment_amount)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                        {formatCurrency(item.balance_after_payment)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Show More/Less Button */}
            {scheduleData.schedule.length > 6 && (
              <div className="flex justify-center mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowFullSchedule(!showFullSchedule)}
                >
                  {showFullSchedule
                    ? `Show Less`
                    : `Show All ${scheduleData.schedule.length} Installments`}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Banner */}
        <Card className="md:px-10">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900 mb-1">Important Information</p>
                <p className="text-sm text-blue-800">
                  This is a preview of your loan schedule. The interest calculation method used
                  is <strong>{scheduleData.interest_method}</strong>. Please review all details
                  carefully before confirming your loan application.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-6">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}