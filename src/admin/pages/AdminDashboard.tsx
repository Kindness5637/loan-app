import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "@/services/api";
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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  DollarSign,
  FileText,
  TrendingUp,
  CheckCircle,
  Clock,
  Users,
  AlertTriangle,
  RefreshCw,
  Plus,
  XCircle,
  Eye,
  Activity,
  Home,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import { formatCurrency, formatDate } from "@/lib/utils";

// Types
import type {
  Member,
  LoanProduct,
  DashboardError,
  DashboardMetrics,
  LoanApplication,
} from "@/types/dashboard";

const getStatusBadge = (status: string) => {
  const statusMap: Record<string, { variant: any; label: string }> = {
    "pending-approval": { variant: "secondary", label: "Pending Approval" },
    approved: { variant: "default", label: "Approved" },
    disbursed: { variant: "default", label: "Disbursed" },
    active: { variant: "default", label: "Active" },
    rejected: { variant: "destructive", label: "Rejected" },
    completed: { variant: "outline", label: "Completed" },
  };

  const statusInfo = statusMap[status] || { variant: "outline", label: status };

  return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
};

// Loading skeleton component
const MetricCardSkeleton = () => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-4" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-20 mb-2" />
      <Skeleton className="h-3 w-32" />
    </CardContent>
  </Card>
);

//chart skeleton
const ChartSkeleton = () => (
  <Card className="">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <Skeleton className="h-60 w-120 mb-5" />
    </CardHeader>
    <CardContent className="grid grid-cols-2 gap-6">
      <Skeleton className="h-4 w-15 " />
      <Skeleton className="h-4 w-15" />
      <Skeleton className="h-4 w-15" />
      <Skeleton className="h-4 w-15" />
    </CardContent>
  </Card>
);

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case "approved":
    case "disbursed":
    case "active":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "pending-approval":
    case "pending":
      return <Clock className="h-4 w-4 text-yellow-600" />;
    case "rejected":
      return <XCircle className="h-4 w-4 text-red-600" />;
    default:
      return <FileText className="h-4 w-4 text-blue-600" />;
  }
};

// Clickable Card Component with accessibility
const ClickableCard = ({
  children,
  onClick,
  className = "",
  ariaLabel,
  ...props
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  ariaLabel: string;
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <Card
      className={`cursor-pointer hover:shadow-md hover:border-primary/50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </Card>
  );
};

// Error State Component
const ErrorState = ({
  message,
  onRetry,
  section = "data",
}: {
  message: string;
  onRetry: () => void;
  section?: string;
}) => (
  <Card className="border-red-200 bg-red-50">
    <CardContent className="flex flex-col items-center justify-center py-12">
      <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
      <h3 className="text-lg font-semibold mb-2 text-red-900">
        Failed to Load {section}
      </h3>
      <p className="text-sm text-red-700 mb-4 text-center max-w-md">
        {message}
      </p>
      <Button
        onClick={onRetry}
        variant="outline"
        className="border-red-300 hover:bg-red-100"
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Retry
      </Button>
    </CardContent>
  </Card>
);

// Empty State Component
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
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <Icon className="h-16 w-16 text-muted-foreground mb-4" />
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground mb-4 max-w-md">{description}</p>
    {actionLabel && onAction && (
      <Button onClick={onAction}>
        <Plus className="h-4 w-4 mr-2" />
        {actionLabel}
      </Button>
    )}
  </div>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<DashboardError>({
    hasError: false,
    message: "",
  });
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [_members, setMembers] = useState<Member[]>([]);
  const [loanProducts, setLoanProducts] = useState<LoanProduct[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalLoans: 0,
    pendingApprovals: 0,
    totalPortfolioValue: 0,
    totalOutstanding: 0,
    activeMembers: 0,
    totalMembers: 0,
    averageLoanSize: 0,
    collectionRate: 0,
    totalInterestReceived: 0,
    disbursedLoans: 0,
    closedLoans: 0,
    activeLoans: 0,
  });

  // Set breadcrumbs for dashboard
  useBreadcrumbs([{ label: "Dashboard", icon: <Home className="h-4 w-4" /> }]);

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError({ hasError: false, message: "" });

      // Fetch all required data concurrently
      const [loansResponse, membersResponse, productsResponse] =
        await Promise.all([
          apiService
            .get("/loan-applications")
            .catch((err) => ({ error: err, data: [] })),
          apiService.get("/members").catch((err) => ({ error: err, data: [] })),
          apiService
            .get("/loan-types")
            .catch((err) => ({ error: err, data: [] })),
        ]);

      // Extract arrays safely
      const loansData: LoanApplication[] = Array.isArray(loansResponse)
        ? loansResponse
        : loansResponse?.data || [];

      const membersData: Member[] = Array.isArray(membersResponse)
        ? membersResponse
        : membersResponse?.data || [];

      const productsData = Array.isArray(productsResponse)
        ? productsResponse
        : productsResponse?.data || [];

      // Save raw data
      setLoans(loansData);
      setMembers(membersData);
      setLoanProducts(productsData);

      // Derived Metrics
      const totalLoans = loansData.length;

      const pendingApprovals = loansData.filter(
        (loan) => loan.loan_status?.toLowerCase() === "pending-approval"
      ).length;

      // Only consider loans that have been disbursed, are active, or closed
      // 2. In fetchDashboardData, rename variables for clarity
      const disbursedLoans = loansData.filter((loan) =>
        ["active", "closed"].includes(loan.loan_status?.toLowerCase())
      );

      const disbursedLoansCount = disbursedLoans.length;

      //closed loans
      const closedLoans = loansData.filter((loan) =>
        ["closed"].includes(loan.loan_status?.toLowerCase())
      );

      const closedLoansCount = closedLoans.length;

      // Total portfolio = sum of principal for active/disbursed/closed loans
      const totalPortfolioValue = disbursedLoans.reduce(
        (sum, loan) => sum + parseFloat(loan.principal_amount || "0"),
        0
      );

      // Total outstanding balance (what’s still unpaid)
      const totalOutstanding = disbursedLoans.reduce(
        (sum, loan) => sum + parseFloat(loan.balance || "0"),
        0
      );

      // Average loan size = total principal / number of disbursed loans
      const averageLoanSize =
        disbursedLoans.length > 0
          ? totalPortfolioValue / disbursedLoans.length
          : 0;

      // Collection rate = (amount paid / total disbursed) * 100
      const collectionRate =
        totalPortfolioValue > 0
          ? ((totalPortfolioValue - totalOutstanding) / totalPortfolioValue) *
            100
          : 0;

      // Total interest received = (interest_amount - unpaid_interest)
      const totalInterestReceived = closedLoans.reduce((total, loan) => {
        const interestReceived = parseFloat(loan.interest_amount || "0");
        return total + interestReceived;
      }, 0);

      // Active members count
      const activeMembers = membersData.filter(
        (member) => member.state?.toLowerCase() === "active"
      ).length;

      //active loans
      const activeLoans = loansData.filter(
        (loan: LoanApplication) =>
          loan.loan_status === "active" || loan.loan_status === "disbursed"
      ).length;

      // Update Dashboard Metrics
      setMetrics({
        totalLoans,
        pendingApprovals,
        totalPortfolioValue,
        totalOutstanding,
        activeMembers,
        totalMembers: membersData.length,
        averageLoanSize,
        collectionRate,
        totalInterestReceived,
        activeLoans,
        disbursedLoans: disbursedLoansCount, 
        closedLoans: closedLoansCount, 
      });
    } catch (error: any) {
      setError({
        hasError: true,
        message:
          error?.message ||
          "Unable to load dashboard data. Please check your connection and try again.",
        section: "all",
      });
      toast.error("Failed to load dashboard data", {
        description: "Click retry to try again.",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardData();
  };

  // Calculate chart data
  const loanStatusData = [
    {
      name: "Pending Approval",
      value: loans.filter((l) => l.loan_status === "pending-approval").length,
      color: "#f59e0b",
      amount: loans
        .filter((l) => l.loan_status === "pending-approval")
        .reduce((sum, l) => sum + parseFloat(l.principal_amount), 0),
    },
    {
      name: "Active",
      value: loans.filter(
        (l) => l.loan_status === "active" || l.loan_status === "disbursed"
      ).length,
      color: "#10b981",
      amount: loans
        .filter(
          (l) => l.loan_status === "active" || l.loan_status === "disbursed"
        )
        .reduce((sum, l) => sum + parseFloat(l.principal_amount), 0),
    },
    {
      name: "Approved",
      value: loans.filter((l) => l.loan_status === "approved").length,
      color: "#6366f1",
      amount: loans
        .filter((l) => l.loan_status === "approved")
        .reduce((sum, l) => sum + parseFloat(l.principal_amount), 0),
    },
    {
      name: "Rejected",
      value: loans.filter((l) => l.loan_status === "rejected").length,
      color: "#ef4444",
      amount: loans
        .filter((l) => l.loan_status === "rejected")
        .reduce((sum, l) => sum + parseFloat(l.principal_amount), 0),
    },
  ].filter((item) => item.value > 0);

  // Portfolio by product type
  const portfolioByProduct = loanProducts
    .map((product) => {
      const productLoans = loans.filter(
        (loan) =>
          loan.loan_type_id === product.id &&
          (loan.loan_status === "active" || loan.loan_status === "disbursed")
      );
      return {
        productType: product.loanType,
        count: productLoans.length,
        amount: productLoans.reduce(
          (sum, loan) => sum + parseFloat(loan.principal_amount),
          0
        ),
      };
    })
    .filter((item) => item.count > 0);

  // Recent applications (last 5)
  const recentApplications = loans
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5);

  // Loans requiring attention
  const loansRequiringAttention = loans
    .filter(
      (loan: any) =>
        loan.loan_status === "pending-approval" ||
        loan.loan_due_date < new Date().toISOString()
    )
    .slice(0, 5);

  // Show error state if critical error
  if (error.hasError && error.section === "all") {
    return (
      <div className="space-y-6 w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back!</p>
          </div>
        </div>
        <ErrorState
          message={error.message}
          onRetry={handleRefresh}
          section="Dashboard Data"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back !</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label="Refresh dashboard data"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            onClick={() => navigate("/loan-application")}
            aria-label="Create new loan application"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Application
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            {/* Total Portfolio */}
            <ClickableCard
              onClick={() => navigate("/loan-portfolio")}
              ariaLabel={`Total portfolio value: ${formatCurrency(
                metrics.totalPortfolioValue
              )} with ${
                metrics.totalLoans
              } active loans. Click to view details.`}
              className="transition-all duration-200 hover:shadow-md hover:bg-purple-100"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">
                  Total Portfolio
                </CardTitle>
                <div className="p-2 rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
                  <DollarSign className="h-4 w-4" aria-hidden="true" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {formatCurrency(metrics.totalPortfolioValue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Money disbursed across {metrics.disbursedLoans} loans
                </p>
              </CardContent>
              </ClickableCard>


            {/* Total Interest Received */}
            <ClickableCard
              className="transition-all duration-200 hover:shadow-md hover:bg-accent/10"
              onClick={() => navigate("/loan-portfolio")}
              ariaLabel={`Total interest received: ${formatCurrency(
                metrics.totalInterestReceived
              )}. Click to view details.`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">
                  Total Interest Received
                </CardTitle>
                <div className="p-2 rounded-full bg-green-100 text-green-700">
                  <TrendingUp className="h-4 w-4" aria-hidden="true" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {formatCurrency(metrics.totalInterestReceived)}
                </div>
                <p className="text-xs text-muted-foreground">
                  From closed loans
                </p>
              </CardContent>
            </ClickableCard>

            {/* Active Members */}
            <ClickableCard
              onClick={() => navigate("/members")}
              ariaLabel={`${metrics.totalMembers} total clients. Click to manage clients.`}
              className="transition-all duration-200 hover:shadow-md hover:bg-primary/10"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">
                  Total Clients
                </CardTitle>
                <div className="p-2 rounded-full bg-blue-100 text-blue-700">
                  <Users className="h-4 w-4" aria-hidden="true" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {metrics.totalMembers}
                </div>
                <p className="text-xs text-muted-foreground">
                  Number of clients
                </p>
              </CardContent>
            </ClickableCard>

            {/* Collection Rate */}
            <Card className="transition-all duration-200 hover:shadow-md hover:bg-green-50/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">
                  Collection Rate
                </CardTitle>
                <div className="flex items-center p-1.5 rounded-full bg-green-100 text-green-700">
                  {/* <span className="text-xs mr-3"> +60%</span> */}
                  <TrendingUp className="h-4 w-4" aria-hidden="true" />
                </div>
              </CardHeader>
              <CardContent>
                <div
                  className="text-2xl font-bold text-green-700"
                  aria-label={`Collection rate: ${metrics.collectionRate.toFixed(
                    1
                  )} percent`}
                >
                  {metrics.collectionRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Outstanding: {formatCurrency(metrics.totalOutstanding)} from{" "}
                  {metrics.activeLoans} loans
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Loan Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Loan Status Distribution</CardTitle>
            <CardDescription>
              Current breakdown of loan applications by status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : loanStatusData.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No Loan Data Yet"
                description="Start by creating your first loan application to see status distribution here."
                actionLabel="Create First Loan"
                onAction={() => navigate("/loan-application")}
              />
            ) : (
              <>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={loanStatusData}
                        cx="50%"
                        cy="50%"
                        stroke="none"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={0}
                        dataKey="value"
                      >
                        {loanStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name, props) => [
                          `${value} loans (${formatCurrency(
                            props.payload.amount
                          )})`,
                          name,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div
                  className="grid grid-cols-2 gap-2 mt-4"
                  role="list"
                  aria-label="Chart legend"
                >
                  {loanStatusData.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2"
                      role="listitem"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                        aria-hidden="true"
                      />
                      <span className="text-xs text-muted-foreground">
                        {item.name}: {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Portfolio by Product Type */}
        <Card>
          <CardHeader>
            <CardTitle>Portfolio by Product Type</CardTitle>
            <CardDescription>
              Loan distribution across different product types
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : portfolioByProduct.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="No Product Data Available"
                description="Create loan products and applications to see portfolio distribution by product type."
                actionLabel="Add Loan Product"
                onAction={() => navigate("/add-loan-product")}
              />
            ) : (
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={portfolioByProduct}
                    margin={{ top: 10, right: 10, left: 0, bottom: 60 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e5e7eb"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="productType"
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      interval={0}
                      tick={{ fontSize: 10, fill: "#6b7280" }}
                      stroke="#d1d5db"
                    />
                    <YAxis
                      tickFormatter={(value) => {
                        if (value >= 1000000)
                          return `${(value / 1000000).toFixed(1)}M`;
                        if (value >= 1000)
                          return `${(value / 1000).toFixed(0)}K`;
                        return value.toString();
                      }}
                      tick={{ fontSize: 10, fill: "#6b7280" }}
                      stroke="#d1d5db"
                      width={50}
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        name === "amount"
                          ? formatCurrency(value as number)
                          : value,
                        name === "amount" ? "Total Amount" : "Loan Count",
                      ]}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        padding: "8px 12px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      }}
                      labelStyle={{ fontWeight: 600, marginBottom: "4px" }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: "20px" }}
                      formatter={(value) =>
                        value === "amount" ? "Total Amount" : "Loan Count"
                      }
                      iconType="circle"
                    />
                    <Bar
                      dataKey="amount"
                      fill="#6366f1"
                      name="amount"
                      radius={[8, 8, 0, 0]}
                      maxBarSize={60}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card></Card>
      </div>

      {/* Data Tables Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Applications */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Loan Applications</CardTitle>
              <CardDescription>
                Latest loan applications and their current status
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/loan-portfolio")}
              aria-label="View all loan applications"
            >
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-4 w-4" />
                      <div>
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <div className="text-right">
                      <Skeleton className="h-5 w-16 mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentApplications.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No Recent Applications"
                description="Get started by creating your first loan application. You'll see recent activity here once applications are submitted."
                actionLabel="Create Application"
                onAction={() => navigate("/loan-application")}
              />
            ) : (
              <div
                className="space-y-4"
                role="list"
                aria-label="Recent loan applications"
              >
                {recentApplications.map((loan) => (
                  <div
                    key={loan.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() =>
                      navigate(`/loan-portfolio/${loan.loan_number}`)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`/loan-portfolio/${loan.loan_number}`);
                      }
                    }}
                    tabIndex={0}
                    role="listitem button"
                    aria-label={`Loan application for ${
                      loan.borrower.full_name
                    }, amount ${formatCurrency(
                      loan.principal_amount
                    )}, status ${loan.loan_status}`}
                  >
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(loan.loan_status)}
                      <div>
                        <p className="text-sm font-medium">
                          {loan.borrower.full_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {loan.loan_number} •{" "}
                          {formatCurrency(loan.principal_amount)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(loan.loan_status)}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(loan.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loans Requiring Attention */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle
                className="h-4 w-4 text-yellow-600"
                aria-hidden="true"
              />
              Requires Attention
            </CardTitle>
            <CardDescription>Loans that need immediate review</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-3 border rounded-lg">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                ))}
              </div>
            ) : loansRequiringAttention.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle
                  className="h-12 w-12 text-green-600 mx-auto mb-3"
                  aria-hidden="true"
                />
                <h3 className="text-sm font-semibold mb-1">All Caught Up!</h3>
                <p className="text-xs text-muted-foreground">
                  No loans require immediate attention right now.
                </p>
              </div>
            ) : (
              <div
                className="space-y-3"
                role="list"
                aria-label="Loans requiring attention"
              >
                {loansRequiringAttention.map((loan) => (
                  <div
                    key={loan.id}
                    className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() =>
                      navigate(`/loan-portfolio/${loan.loan_number}`)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`/loan-portfolio/${loan.loan_number}`);
                      }
                    }}
                    tabIndex={0}
                    role="listitem button"
                    aria-label={`Attention needed: ${loan.borrower.full_name}, ${loan.loan_status}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">
                        {loan.borrower.full_name}
                      </p>
                      {getStatusBadge(loan.loan_status)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {loan.loan_number} •{" "}
                      {formatCurrency(loan.principal_amount)}
                    </p>
                    {loan.loan_status === "pending-approval" && (
                      <p className="text-xs text-yellow-600 mt-1">
                        Pending approval
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/loan-portfolio")}
              disabled={metrics.pendingApprovals === 0}
              aria-label={`Review ${metrics.pendingApprovals} pending approvals`}
            >
              <Clock className="h-4 w-4 mr-2" />
              Review Pending Approvals ({metrics.pendingApprovals})
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/members")}
              aria-label="Manage members"
            >
              <Users className="h-4 w-4 mr-2" />
              Manage Members
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/loan-products")}
              aria-label="View loan products"
            >
              <Activity className="h-4 w-4 mr-2" />
              Loan Products
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/add-loan-product")}
              aria-label="Create new loan product"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Loan Product
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
