import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import 'jspdf-autotable'

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: {
      finalY: number;
    };
    autoTable: (options: unknown) => void;
  }
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Download,
  Printer,
  FileText,
  DollarSign,
  Calendar,
  User,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react"
import { apiService } from "@/services/api"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"

interface LoanStatement {
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

export function Statements() {
  const { loanNumber } = useParams<{ loanNumber: string }>()
  const [loading, setLoading] = useState(true)
  const [statement, setStatement] = useState<LoanStatement | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("transactions")

  const { user } = useAuth()

  const fetchLoanStatement = async (loanNum: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiService.get(`/loan-statement/${loanNum}`)
      
      if (response.data) {
        setStatement(response.data)
      } else {
        setError("Loan statement not found")
      }
    } catch (err) {
      console.error("Failed to fetch loan statement:", err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : "Failed to load loan statement. Please try again.";
      setError(errorMessage || null );
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user && loanNumber) {
      fetchLoanStatement(loanNumber)
    } else if (!loanNumber) {
      setError("No loan number provided")
      setLoading(false)
    }
  }, [user, loanNumber])

  const handlePrint = () => {
    window.print()
  }

  const [downloadingPDF, setDownloadingPDF] = useState(false)

const handleDownloadPDF = async () => {
  if (!statement) return;

  setDownloadingPDF(true);

  try {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    // ===== Header =====
    doc.setFontSize(18);
    doc.text("Loan Statement", pageWidth / 2, 15, { align: "center" });

    doc.setFontSize(10);
    doc.text(`Generated on: ${formatDate(statement.generated_at)}`, 14, 25);
    doc.text(`Loan Number: ${statement.loan.loan_number}`, 14, 30);
    doc.text(`Status: ${statement.loan.loan_status}`, 14, 35);

    // ===== Borrower Info =====
    doc.setFontSize(12);
    doc.text("Borrower Information", 14, 45);
    doc.setFontSize(10);
    doc.text(`Name: ${statement.borrower.full_name}`, 14, 50);
    doc.text(`Phone: ${statement.borrower.phone}`, 14, 55);
    doc.text(`Member ID: ${statement.borrower.CardCode}`, 14, 60);

    // ===== Loan Info =====
    doc.setFontSize(12);
    doc.text("Loan Information", 14, 70);
    doc.setFontSize(10);
    doc.text(`Principal Amount: ${formatCurrency(statement.loan.principal_amount)}`, 14, 75);
    doc.text(`Release Date: ${formatDate(statement.loan.loan_release_date)}`, 14, 80);
    doc.text(`Current Balance: ${formatCurrency(statement.summary.current_balance)}`, 14, 85);

    // ===== Summary =====
    doc.setFontSize(12);
    doc.text("Summary", 14, 95);
    doc.setFontSize(10);
    doc.text(`Total Paid: ${formatCurrency(statement.summary.total_paid)}`, 14, 100);
    doc.text(`Total Interest: ${formatCurrency(statement.summary.total_interest)}`, 14, 105);
    doc.text(`Total Penalties: ${formatCurrency(statement.summary.total_penalties)}`, 14, 110);

    // ===== Transactions Table =====
    doc.setFontSize(12);
    doc.text("Transactions", 14, 120);

    const tableColumn = [
      "Date",
      "Type",
      "Balance B/D",
      "Payment",
      "Interest",
      "Penalty",
      "Balance",
    ];

    const tableRows = statement.transactions.map((t) => [
      formatDate(t.date),
      t.type,
      formatCurrency(t.bal_bd),
      t.payment > 0 ? formatCurrency(t.payment) : "-",
      t.interest > 0 ? formatCurrency(t.interest) : "-",
      t.penalty > 0 ? formatCurrency(t.penalty) : "-",
      formatCurrency(t.balance),
    ]);

    autoTable(doc, {
      startY: 125,
      head: [tableColumn],
      body: tableRows,
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [66, 66, 66],
        textColor: 255,
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240],
      },
      margin: { left: 14, right: 14 },
    });

    // ===== Footer =====
    const finalY = doc.lastAutoTable?.finalY || 130;
    doc.setFontSize(9);
    doc.text(
      "For any discrepancies, please contact customer support within 7 days.",
      14,
      finalY + 10
    );

    // ===== Save PDF =====
    doc.save(`LoanStatement_${statement.loan.loan_number}.pdf`);
  } catch (err) {
    console.error("Error generating PDF:", err);
    setError("Failed to generate PDF. Please try again.");
  } finally {
    setDownloadingPDF(false);
  }
};


  const getStatusInfo = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return {
          icon: <TrendingUp className="h-4 w-4" />,
          label: "ACTIVE",
          className: "bg-green-200 text-green-800"
        }
      case "completed":
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          label: "COMPLETED",
          className: "bg-blue-100 text-blue-800"
        }
      case "pending":
        return {
          icon: <Clock className="h-4 w-4" />,
          label: "PENDING",
          className: "bg-yellow-100 text-yellow-800"
        }
      default:
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          label: status.toUpperCase(),
          className: "bg-gray-100 text-gray-800"
        }
    }
  }

  const getTransactionTypeInfo = (type: string) => {
    switch (type.toLowerCase()) {
      case "payment":
        return {
          variant: "default" as const,
          icon: <DollarSign className="h-3 w-3" />
        }
      case "interest":
        return {
          variant: "secondary" as const,
          icon: <TrendingUp className="h-3 w-3" />
        }
      case "penalty":
        return {
          variant: "destructive" as const,
          icon: <AlertCircle className="h-3 w-3" />
        }
      default:
        return {
          variant: "outline" as const,
          icon: <FileText className="h-3 w-3" />
        }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <FileText className="h-8 w-8 animate-pulse text-primary" />
          <p className="text-muted-foreground">Loading loan statement...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Statement</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => loanNumber && fetchLoanStatement(loanNumber)}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!statement) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Statement Available</h3>
              <p className="text-muted-foreground">No loan statement found for the selected loan.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-8xl mx-auto p-6 space-y-6 print:p-0">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold">Loan Statement</h1>
          <p className="text-muted-foreground mt-1">
            Detailed transaction history for loan {statement.loan.loan_number}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleDownloadPDF}
            disabled={downloadingPDF}
          >
            <Download className="h-4 w-4 mr-2" />
            {downloadingPDF ? "Generating PDF..." : "Download PDF"}
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Statement Header - Print Version */}
      <div className="hidden print:block border-b pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">Loan Statement</h1>
            <p className="text-muted-foreground">Generated on {formatDate(statement.generated_at)}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold">Loan #{statement.loan.loan_number}</p>
            <Badge className={getStatusInfo(statement.loan.loan_status).className}>
              {getStatusInfo(statement.loan.loan_status).label}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Loan & Borrower Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Loan Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Loan Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Loan Number</span>
                <span className="font-semibold">{statement.loan.loan_number}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge className={getStatusInfo(statement.loan.loan_status).className}>
                  {getStatusInfo(statement.loan.loan_status).icon}
                  <span className="ml-1">{getStatusInfo(statement.loan.loan_status).label}</span>
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Principal Amount</span>
                <span className="font-semibold">{formatCurrency(statement.loan.principal_amount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Release Date</span>
                <span className="font-semibold">{formatDate(statement.loan.loan_release_date)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Current Balance</span>
                <span className="font-semibold text-orange-600">
                  {formatCurrency(statement.summary.current_balance)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Borrower Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Borrower Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Full Name</span>
                <span className="font-semibold text-right">{statement.borrower.full_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Phone</span>
                <span className="font-semibold">{statement.borrower.phone}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Member ID</span>
                <span className="font-semibold">{statement.borrower.CardCode}</span>
              </div>
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Paid</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(statement.summary.total_paid)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Interest</span>
                <span className="font-semibold text-blue-600">
                  {formatCurrency(statement.summary.total_interest)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Penalties</span>
                <span className="font-semibold text-red-600">
                  {formatCurrency(statement.summary.total_penalties)}
                </span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Current Balance</span>
                  <span className="text-lg font-bold text-orange-600">
                    {formatCurrency(statement.summary.current_balance)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Transactions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Transaction History
              </CardTitle>
              <CardDescription>
                All transactions for loan {statement.loan.loan_number}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="transactions">Transactions</TabsTrigger>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                </TabsList>

                <TabsContent value="transactions" className="space-y-4">
                  {statement.transactions.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No transactions found for this loan.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Desktop Table */}
                      <div className="hidden md:block">
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
                                    variant={getTransactionTypeInfo(transaction.type).variant}
                                    className="flex items-center gap-1 w-fit"
                                  >
                                    {getTransactionTypeInfo(transaction.type).icon}
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

                      {/* Mobile Cards */}
                      <div className="md:hidden space-y-3">
                        {statement.transactions.map((transaction, index) => (
                          <Card key={index} className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-2">
                                <Badge variant={getTransactionTypeInfo(transaction.type).variant}>
                                  {transaction.type}
                                </Badge>
                                <span className="text-sm text-muted-foreground">{formatDate(transaction.date)}</span>
                              </div>
                              <span className="font-semibold">{formatCurrency(transaction.balance)}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Balance B/D:</span>
                                <span className="ml-2">{formatCurrency(transaction.bal_bd)}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-muted-foreground">Payment:</span>
                                <span className="ml-2 text-green-600">
                                  {transaction.payment > 0 ? formatCurrency(transaction.payment) : '-'}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Interest:</span>
                                <span className="ml-2 text-blue-600">
                                  {transaction.interest > 0 ? formatCurrency(transaction.interest) : '-'}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-muted-foreground">Penalty:</span>
                                <span className="ml-2 text-red-600">
                                  {transaction.penalty > 0 ? formatCurrency(transaction.penalty) : '-'}
                                </span>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600 mb-2">
                            {formatCurrency(statement.summary.total_paid)}
                          </div>
                          <p className="text-sm text-muted-foreground">Total Amount Paid</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600 mb-2">
                            {formatCurrency(statement.summary.total_interest)}
                          </div>
                          <p className="text-sm text-muted-foreground">Total Interest Charged</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600 mb-2">
                            {formatCurrency(statement.summary.total_penalties)}
                          </div>
                          <p className="text-sm text-muted-foreground">Total Penalties</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600 mb-2">
                            {formatCurrency(statement.summary.current_balance)}
                          </div>
                          <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Footer Note */}
          <div className="text-center text-sm text-muted-foreground mt-4 print:mt-8">
            <p>Statement generated on {formatDate(statement.generated_at)}</p>
            <p className="mt-1">For any discrepancies, please contact customer support within 7 days.</p>
          </div>
        </div>
      </div>
    </div>
  )
}