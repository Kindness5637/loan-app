import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Shield,
  Banknote,
} from "lucide-react"
import { apiService } from "@/services/api"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import type { Loan } from "@/hooks/userLoans"

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

interface LoanDetail extends Loan {
  created_at: string
  repayment_amount: string
  interest_method: string
  duration_period: string
  collateral: string
  arrears_amount: string
  days_in_arrears: number
  last_payment_date: string | null
  approved_at: string | null
  disbursed_at: string | null
  loan_type: {
    loanCode: string
    loanType: string
    interest_rate: string
  }
  guarantors: {
    id: number
    amount_guaranteed: string
    business_partner: {
      full_name: string
      phone: string
    }
  }[]
  repayments: {
    id: number
    type: string
    amount: string
    reference: string
    notes: string
    transaction_date: string
  }[]
  loan_penalties: any[]
}

const getStatusInfo = (status: string) => {
  const statusMap: Record<string, { icon: any; label: string; className: string }> = {
    pending: { icon: Clock, label: "PENDING", className: "bg-yellow-100 text-yellow-800" },
    "pending-approval": { icon: Clock, label: "PENDING", className: "bg-yellow-100 text-yellow-800" },
    approved: { icon: CheckCircle, label: "APPROVED", className: "bg-blue-100 text-blue-800" },
    disbursed: { icon: DollarSign, label: "ACTIVE", className: "bg-green-100 text-green-800" },
    active: { icon: DollarSign, label: "ACTIVE", className: "bg-green-100 text-green-800" },
    completed: { icon: CheckCircle, label: "COMPLETED", className: "bg-gray-100 text-gray-800" },
    closed: { icon: CheckCircle, label: "CLOSED", className: "bg-gray-100 text-gray-800" },
    rejected: { icon: AlertCircle, label: "REJECTED", className: "bg-red-100 text-red-800" },
  }
  return statusMap[status] || { icon: Clock, label: status.toUpperCase(), className: "bg-gray-100 text-gray-800" }
}

const getTransactionTypeInfo = (type: string) => {
  switch (type.toLowerCase()) {
    case "payment":
      return { variant: "default" as const, icon: <DollarSign className="h-3 w-3" /> }
    case "interest":
      return { variant: "secondary" as const, icon: <TrendingUp className="h-3 w-3" /> }
    case "penalty":
      return { variant: "destructive" as const, icon: <AlertCircle className="h-3 w-3" /> }
    default:
      return { variant: "outline" as const, icon: <FileText className="h-3 w-3" /> }
  }
}

export default function LoanDetail() {
  const { loanNumber } = useParams<{ loanNumber: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loan, setLoan] = useState<LoanDetail | null>(null)
  const [statement, setStatement] = useState<LoanStatement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    if (user && loanNumber) {
      fetchLoanData()
    }
  }, [user, loanNumber])

  const fetchLoanData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [loanResponse, statementResponse] = await Promise.all([
        apiService.get<{ data: LoanDetail }>(`/loan-applications/${loanNumber}`),
        apiService.get<{ data: LoanStatement }>(`/loan-statement/${loanNumber}`),
      ])

      setLoan(loanResponse.data)
      setStatement(statementResponse.data)
    } catch (err) {
      console.error("Failed to fetch loan data:", err)
      setError("Failed to load loan details. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const calculateProgress = (): number => {
    if (!loan) return 0
    const totalAmount = parseFloat(loan.principal_amount) + parseFloat(loan.interest_amount)
    const remaining = parseFloat(loan.balance)
    const paid = totalAmount - remaining
    return Math.min((paid / totalAmount) * 100, 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !loan || !statement) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Loan</h3>
              <p className="text-muted-foreground mb-4">{error || "Loan not found"}</p>
              <Button onClick={() => navigate("/client/loans")}>Back to Loans</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusInfo = getStatusInfo(loan.loan_status)
  const StatusIcon = statusInfo.icon
  const totalAmount = parseFloat(loan.principal_amount) + parseFloat(loan.interest_amount)
  const paidAmount = totalAmount - parseFloat(loan.balance)
  const progress = calculateProgress()

  return (
    <div className="w-full space-y-4 sm:space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/client/loans")}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold truncate">{loan.purpose}</h1>
          <p className="text-sm text-muted-foreground">#{loan.loan_number}</p>
        </div>
        <Badge className={`text-xs px-2 py-1 flex-shrink-0 ${statusInfo.className}`}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {statusInfo.label}
        </Badge>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="pb-2">
            <div className="p-2 rounded-full bg-blue-100 text-blue-700 w-fit">
              <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-lg sm:text-xl font-bold">
              {formatCurrency(loan.principal_amount)}
            </div>
            <p className="text-xs text-muted-foreground">Principal</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="pb-2">
            <div className="p-2 rounded-full bg-green-100 text-green-700 w-fit">
              <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-lg sm:text-xl font-bold text-green-700">
              {formatCurrency(statement.summary.total_paid)}
            </div>
            <p className="text-xs text-muted-foreground">Total Paid</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-md col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <div className="p-2 rounded-full bg-orange-100 text-orange-700 w-fit">
              <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-lg sm:text-xl font-bold text-orange-700">
              {formatCurrency(loan.balance)}
            </div>
            <p className="text-xs text-muted-foreground">Balance</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="pb-2">
            <div className="p-2 rounded-full bg-purple-100 text-purple-700 w-fit">
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-lg sm:text-xl font-bold text-purple-700">
              {formatCurrency(loan.monthly_payment)}
            </div>
            <p className="text-xs text-muted-foreground">Monthly</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      {loan.loan_status === "active" || loan.loan_status === "disbursed" ? (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Repayment Progress</span>
                <span className="text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2.5" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Paid: {formatCurrency(paidAmount)}</span>
                <span>Remaining: {formatCurrency(loan.balance)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Loan Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" />
                  Loan Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Amount</span>
                  <span className="font-semibold">{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Principal</span>
                  <span className="font-semibold">{formatCurrency(loan.principal_amount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Interest ({loan.loan_type?.interest_rate}%)</span>
                  <span className="font-semibold text-blue-600">{formatCurrency(loan.interest_amount)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Outstanding Balance</span>
                    <span className="text-lg font-bold text-orange-600">{formatCurrency(loan.balance)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Banknote className="h-5 w-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Monthly Payment</span>
                  <span className="font-semibold">{formatCurrency(loan.monthly_payment)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Duration</span>
                  <span className="font-semibold">{loan.loan_duration} {loan.duration_period}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Interest Method</span>
                  <span className="font-semibold">{loan.interest_method}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Release Date</span>
                  <span className="font-semibold">{loan.loan_release_date ? formatDate(loan.loan_release_date) : "N/A"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Due Date</span>
                  <span className="font-semibold">{formatDate(loan.loan_due_date)}</span>
                </div>
                {loan.last_payment_date && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Last Payment</span>
                    <span className="font-semibold text-green-600">{formatDate(loan.last_payment_date)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Arrears Alert */}
          {loan.days_in_arrears > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3 text-red-800">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Arrears Alert</p>
                    <p className="text-sm">
                      You have {loan.days_in_arrears} day{loan.days_in_arrears !== 1 ? "s" : ""} in arrears
                      {parseFloat(loan.arrears_amount) > 0 && ` — ${formatCurrency(loan.arrears_amount)} overdue`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Transaction History
              </CardTitle>
              <CardDescription>
                All transactions for loan {loan.loan_number}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statement.transactions.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No transactions yet for this loan.</p>
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
                              {transaction.payment > 0 ? formatCurrency(transaction.payment) : "-"}
                            </td>
                            <td className="py-3 px-4 text-sm text-right text-blue-600">
                              {transaction.interest > 0 ? formatCurrency(transaction.interest) : "-"}
                            </td>
                            <td className="py-3 px-4 text-sm text-right text-red-600">
                              {transaction.penalty > 0 ? formatCurrency(transaction.penalty) : "-"}
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
                              {transaction.payment > 0 ? formatCurrency(transaction.payment) : "-"}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Interest:</span>
                            <span className="ml-2 text-blue-600">
                              {transaction.interest > 0 ? formatCurrency(transaction.interest) : "-"}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-muted-foreground">Penalty:</span>
                            <span className="ml-2 text-red-600">
                              {transaction.penalty > 0 ? formatCurrency(transaction.penalty) : "-"}
                            </span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Loan Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" />
                  Loan Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Loan Type</span>
                  <span className="font-semibold">{loan.loan_type.loanType}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Loan Code</span>
                  <span className="font-semibold">{loan.loan_type.loanCode}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Collateral</span>
                  <span className="font-semibold">{loan.collateral || "None"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Application Date</span>
                  <span className="font-semibold">{formatDate(loan.created_at)}</span>
                </div>
                {loan.approved_at && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Approved Date</span>
                    <span className="font-semibold">{formatDate(loan.approved_at)}</span>
                  </div>
                )}
                {loan.disbursed_at && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Disbursed Date</span>
                    <span className="font-semibold">{formatDate(loan.disbursed_at)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Guarantors */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5" />
                  Guarantors
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loan.guarantors.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No guarantors for this loan.</p>
                ) : (
                  <div className="space-y-4">
                    {loan.guarantors.map((guarantor) => (
                      <div key={guarantor.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium">{guarantor.business_partner.full_name}</span>
                          <span className="text-sm text-muted-foreground">{guarantor.business_partner.phone}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Guaranteed: <span className="font-semibold text-primary">{formatCurrency(guarantor.amount_guaranteed)}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Repayment History */}
          {loan.repayments.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Banknote className="h-5 w-5" />
                  Repayment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {loan.repayments.map((repayment) => (
                    <div key={repayment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-green-100 text-green-700">
                          <CheckCircle className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{repayment.notes || "Repayment"}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(repayment.transaction_date)} • Ref: {repayment.reference}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-green-600">{formatCurrency(repayment.amount)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
