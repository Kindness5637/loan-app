import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useAuth } from "@/hooks/use-auth"
import { MOCK_LOANS, MOCK_TRANSACTIONS } from "@/lib/data"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  CreditCard,
  CalendarIcon,
  Search,
  Filter,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Smartphone,
  Building,
} from "lucide-react"

export function Payments() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [selectedDate, setSelectedDate] = useState<Date>()

  if (!user) return null

  // Get client's loans and transactions
  const clientLoans = MOCK_LOANS.filter((loan) => loan.clientId)
  const clientTransactions = MOCK_TRANSACTIONS.filter((transaction) =>
    clientLoans.some((loan) => loan.id === transaction.loanId),
  )

  // Apply filters
  const filteredTransactions = clientTransactions.filter((transaction) => {
    const matchesSearch =
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || transaction.type === typeFilter
    const matchesDate = !selectedDate || new Date(transaction.date).toDateString() === selectedDate.toDateString()
    return matchesSearch && matchesType && matchesDate
  })

  // Calculate payment statistics
  const totalPaid = clientTransactions.filter((t) => t.type === "payment").reduce((sum, t) => sum + t.amount, 0)

  const pendingPayments = clientLoans
    .filter((loan) => loan.status === "disbursed")
    .reduce((sum, loan) => sum + (loan.monthlyPayment || 0), 0)

  const upcomingPayments = clientLoans
    .filter((loan) => loan.status === "disbursed")
    .map((loan) => ({
      loanId: loan.id,
      purpose: loan.purpose,
      amount: loan.monthlyPayment || 0,
      dueDate: loan.nextPaymentDate,
      status: new Date(loan.nextPaymentDate) < new Date() ? "overdue" : "upcoming",
    }))

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "payment":
        return <ArrowUpRight className="h-4 w-4 text-green-500" />
      case "disbursement":
        return <ArrowDownLeft className="h-4 w-4 text-blue-500" />
      case "fee":
        return <DollarSign className="h-4 w-4 text-orange-500" />
      default:
        return <DollarSign className="h-4 w-4" />
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "overdue":
        return "destructive"
      case "upcoming":
        return "secondary"
      case "paid":
        return "default"
      default:
        return "secondary"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground">Track your payment history and schedule new payments</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Make Payment
        </Button>
      </div>

      {/* Payment Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
            <p className="text-xs text-muted-foreground">Lifetime payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Payments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(pendingPayments)}</div>
            <p className="text-xs text-muted-foreground">Due this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Payments</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {upcomingPayments.filter((p) => p.status === "overdue").length}
            </div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Upcoming Payments
          </CardTitle>
          <CardDescription>Your scheduled loan payments</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingPayments.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Upcoming Payments</h3>
              <p className="text-muted-foreground">All your payments are up to date!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingPayments.map((payment, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{payment.purpose}</h4>
                      <p className="text-sm text-muted-foreground">Due {formatDate(payment.dueDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                      <Badge variant={getPaymentStatusColor(payment.status)}>{payment.status.toUpperCase()}</Badge>
                    </div>
                    <Button size="sm">Pay Now</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>Choose your preferred payment method</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors">
              <div className="flex items-center gap-3">
                <Smartphone className="h-8 w-8 text-green-600" />
                <div>
                  <h4 className="font-medium">M-PESA</h4>
                  <p className="text-sm text-muted-foreground">Mobile money transfer</p>
                </div>
              </div>
            </div>
            <div className="p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors">
              <div className="flex items-center gap-3">
                <Building className="h-8 w-8 text-blue-600" />
                <div>
                  <h4 className="font-medium">Bank Transfer</h4>
                  <p className="text-sm text-muted-foreground">Direct bank payment</p>
                </div>
              </div>
            </div>
            <div className="p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors">
              <div className="flex items-center gap-3">
                <CreditCard className="h-8 w-8 text-purple-600" />
                <div>
                  <h4 className="font-medium">Debit Card</h4>
                  <p className="text-sm text-muted-foreground">Card payment</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>View all your payment transactions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="payment">Payments</SelectItem>
                <SelectItem value="disbursement">Disbursements</SelectItem>
                <SelectItem value="fee">Fees</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {selectedDate ? formatDate(selectedDate.toISOString()) : "Select Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          {/* Transaction List */}
          <div className="space-y-2">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Transactions Found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filters.</p>
              </div>
            ) : (
              filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <h4 className="font-medium">{transaction.description}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(transaction.date)} • {transaction.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        transaction.type === "payment"
                          ? "text-green-600"
                          : transaction.type === "disbursement"
                            ? "text-blue-600"
                            : "text-orange-600"
                      }`}
                    >
                      {transaction.type === "payment" ? "-" : "+"}
                      {formatCurrency(transaction.amount)}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {transaction.type.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
