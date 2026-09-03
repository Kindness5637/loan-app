import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  FileText,
  CheckCircle,
  Clock,
  CreditCard,
  AlertCircle,
  RefreshCw,
  Plus,
  Calendar,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useUserLoans } from "@/hooks/userLoans";

const MetricCardSkeleton = () => (
  <Card>
    <CardHeader className="pb-3">
      <Skeleton className="h-4 w-20" />
    </CardHeader>
    <CardContent className="space-y-2">
      <Skeleton className="h-7 w-24" />
      <Skeleton className="h-3 w-28" />
    </CardContent>
  </Card>
);

const getStatusBadge = (status: string) => {
  const statusMap: Record<string, { variant: any; label: string }> = {
    pending: { variant: "secondary", label: "Pending" },
    "pending-approval": { variant: "secondary", label: "Pending" },
    under_review: { variant: "secondary", label: "Under Review" },
    approved: { variant: "default", label: "Approved" },
    disbursed: { variant: "default", label: "Active" },
    rejected: { variant: "destructive", label: "Rejected" },
    completed: { variant: "outline", label: "Completed" },
  };

  const statusInfo = statusMap[status] || { variant: "outline", label: status };
  return <Badge variant={statusInfo.variant} className="text-xs">{statusInfo.label}</Badge>;
};

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case "approved":
    case "disbursed":
      return <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />;
    case "pending":
    case "pending-approval":
    case "under_review":
      return <Clock className="h-4 w-4 text-yellow-600 flex-shrink-0" />;
    case "rejected":
      return <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />;
    default:
      return <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />;
  }
};

const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) => (
  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
    <Icon className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-3" />
    <h3 className="text-base sm:text-lg font-semibold mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground mb-4 max-w-sm">{description}</p>
    {actionLabel && onAction && (
      <Button onClick={onAction} size="sm" className="w-full sm:w-auto">
        <Plus className="h-4 w-4 mr-2" />
        {actionLabel}
      </Button>
    )}
  </div>
);

export function ClientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { metrics, isLoading, error, refetch } = useUserLoans();

  useEffect(() => {
    console.log("🔍 Dashboard Debug:", {
      isLoading,
      error,
      metricsKeys: Object.keys(metrics),
      activeLoansCount: metrics.activeLoans.length,
      totalLoans: metrics.allLoans.length,
      userCardCode: user?.businesspartner?.CardCode,
    });
  }, [metrics, isLoading, error, user]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    toast.success("Dashboard refreshed");
  };

  if (!user) return null;

  const {
    activeLoans,
    pendingLoans,
    // completedLoans,
    totalBorrowed,
    totalOutstanding,
    totalPaid,
    repaymentRate,
    // lifetimeBorrowed,
  } = metrics;

  const repaymentData = [
    {
      name: "Paid",
      value: totalPaid,
      color: "#10b981",
    },
    {
      name: "Outstanding",
      value: totalOutstanding,
      color: "#f59e0b",
    },
  ].filter((item) => item.value > 0);

  const upcomingPayments = activeLoans
    .map((loan) => ({
      date: new Date(loan.loan_due_date),
      amount: parseFloat(loan.monthly_payment),
      loanNumber: loan.loan_number,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 3);

  return (
    <div className="space-y-4 sm:space-y-6 w-full pb-6">
      {/* Mobile-First Header */}
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome back, {user.name?.split(' ')[0] || user.name}!
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            {activeLoans.length > 0
              ? `${activeLoans.length} active loan${activeLoans.length > 1 ? "s" : ""}`
              : "Your loan portfolio overview"}
          </p>
        </div>
        
        {/* Action Buttons - Stacked on mobile */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          {/* <Button
            onClick={() => navigate("/client/loan-application")}
            className="w-full sm:w-auto order-1 sm:order-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Apply for Loan
          </Button> */}
          <Button
            variant="outline"
            size="default"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3 text-red-800">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics - Mobile optimized grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {isLoading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            {/* Active Loans */}
            <Card className="transition-all duration-200 hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-full bg-blue-100 text-blue-700">
                    <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl sm:text-3xl font-bold">
                  {activeLoans.length}
                </div>
                <p className="text-xs text-muted-foreground">Active Loans</p>
                {pendingLoans.length > 0 && (
                  <p className="text-xs text-yellow-600 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {pendingLoans.length} pending
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Total Borrowed */}
            <Card className="transition-all duration-200 hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="p-2 rounded-full bg-purple-100 text-purple-700 w-fit">
                  <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-xl sm:text-2xl font-bold">
                  {formatCurrency(totalBorrowed)}
                </div>
                <p className="text-xs text-muted-foreground">Total Borrowed</p>
              </CardContent>
            </Card>

            {/* Outstanding Balance */}
            <Card className="transition-all duration-200 hover:shadow-md col-span-2 lg:col-span-1">
              <CardHeader className="pb-2">
                <div className="p-2 rounded-full bg-orange-100 text-orange-700 w-fit">
                  <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-xl sm:text-2xl font-bold text-orange-700">
                  {formatCurrency(totalOutstanding)}
                </div>
                <p className="text-xs text-muted-foreground">Outstanding Balance</p>
                {totalBorrowed > 0 && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    {Math.round((totalOutstanding / totalBorrowed) * 100)}% remaining
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Total Paid */}
            <Card className="transition-all duration-200 hover:shadow-md col-span-2 lg:col-span-1">
              <CardHeader className="pb-2">
                <div className="p-2 rounded-full bg-green-100 text-green-700 w-fit">
                  <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-xl sm:text-2xl font-bold text-green-700">
                  {formatCurrency(totalPaid)}
                </div>
                <p className="text-xs text-muted-foreground">Total Paid</p>
                {totalBorrowed > 0 && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    {Math.round(repaymentRate)}% repaid
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Mobile-First Content Layout */}
      <div className="space-y-4 sm:space-y-6">
        {/* Upcoming Payments - Priority on mobile */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                Upcoming Payments
              </CardTitle>
            </div>
            <CardDescription className="text-xs sm:text-sm">
              Next payment due dates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(2)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : upcomingPayments.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle className="h-10 w-10 text-green-600 mx-auto mb-2" />
                <h3 className="text-sm font-semibold mb-1">All Clear!</h3>
                <p className="text-xs text-muted-foreground">
                  No upcoming payments at the moment.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingPayments.map((payment, idx) => (
                  <div
                    key={idx}
                    className="p-3 border rounded-lg active:bg-muted transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">
                            #{payment.loanNumber.slice(0, 8)}
                          </span>
                          <div className="text-base sm:text-lg font-bold text-primary">
                            {formatCurrency(payment.amount)}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Due in {Math.ceil(
                            (payment.date.getTime() - new Date().getTime()) /
                              (1000 * 60 * 60 * 24)
                          )}{" "}
                          days
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Repayment Overview - Below payments on mobile */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Repayment Overview</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Paid vs outstanding balance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[200px] sm:h-[250px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : repaymentData.length === 0 || totalBorrowed === 0 ? (
              <EmptyState
                icon={FileText}
                title="No Active Loans"
                description="Apply for a loan to see your repayment overview."
                actionLabel="Apply for Loan"
                onAction={() => navigate("/client/loan-application")}
              />
            ) : (
              <div className="space-y-3">
                <div className="h-[180px] sm:h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={repaymentData}
                        cx="50%"
                        cy="50%"
                        stroke="none"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {repaymentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatCurrency(value as number)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {repaymentData.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2.5 rounded-lg border bg-card"
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs sm:text-sm font-medium">{item.name}</span>
                      </div>
                      <span className="text-xs sm:text-sm font-bold">
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Loans Section */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg">My Active Loans</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Current loans and repayment status
                </CardDescription>
              </div>
              {activeLoans.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/client/loans")}
                  className="h-8"
                >
                  <span className="hidden sm:inline mr-1">View All</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : activeLoans.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No Active Loans"
                description="You don't have any active loans. Apply for a loan to get started."
                actionLabel="Apply for Loan"
                onAction={() => navigate("/client/loan-application")}
              />
            ) : (
              <div className="space-y-3">
                {activeLoans.slice(0, 3).map((loan) => {
                  const loanPaid =
                    parseFloat(loan.principal_amount) - parseFloat(loan.balance);
                  const progress =
                    (loanPaid / parseFloat(loan.principal_amount)) * 100;

                  return (
                    <div
                      key={loan.id}
                      className="p-3 sm:p-4 border rounded-lg active:bg-muted transition-colors"
                      onClick={() => navigate("/client/loans")}
                    >
                      <div className="flex items-start justify-between mb-3 gap-2">
                        <div className="flex items-start space-x-2 flex-1 min-w-0">
                          {getStatusIcon(loan.loan_status)}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{loan.purpose}</p>
                            <p className="text-xs text-muted-foreground">
                              #{loan.loan_number.slice(0, 12)}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(loan.loan_status)}
                      </div>

                      <div className="grid grid-cols-3 gap-2 sm:gap-4 text-sm mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Amount</p>
                          <p className="font-medium text-xs sm:text-sm">
                            {formatCurrency(loan.principal_amount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Balance</p>
                          <p className="font-medium text-orange-600 text-xs sm:text-sm">
                            {formatCurrency(loan.balance)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Monthly</p>
                          <p className="font-medium text-xs sm:text-sm">
                            {formatCurrency(loan.monthly_payment)}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">
                            {Math.round(progress)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                          <div
                            className="bg-green-600 h-1.5 sm:h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(loan.loan_due_date)}
                        </div>
                        <span className="text-primary font-medium flex items-center gap-1">
                          Details
                          <ChevronRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Applications */}
        {pendingLoans.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                Pending Applications ({pendingLoans.length})
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Under review
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 sm:space-y-3">
                {pendingLoans.map((loan) => (
                  <div
                    key={loan.id}
                    className="p-3 border rounded-lg active:bg-muted transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {getStatusIcon(loan.loan_status)}
                        <p className="text-sm font-medium truncate">{loan.purpose}</p>
                      </div>
                      {getStatusBadge(loan.loan_status)}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-xs text-muted-foreground">Amount</span>
                        <p className="font-medium text-sm">
                          {formatCurrency(loan.principal_amount)}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Duration</span>
                        <p className="font-medium text-sm">
                          {loan.loan_duration} months
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                      Applied: {formatDate(loan.loan_release_date || new Date().toISOString())}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}