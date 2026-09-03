import { useEffect, useState } from "react";
import { TrendingUp, DollarSign, FileCheck, AlertCircle, ArrowDownUp } from "lucide-react";
import type { LoanType } from "@/types/loan";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Tooltip as RechartsTooltip,
} from "recharts";
import { apiService } from "@/services/api";

interface WeeklyData {
  week: string;
  applications: number;
  approved: number;
  rejected: number;
  pending: number;
}

interface StatusData {
  [key: string]: string | number; 
  name: string;
  value: number;
  color: string;
  amount: number;
}

interface LoanCategoryData {
  category: string;
  amount: number;
  count: number;
}

interface TransactionData {
  date: string;
  disbursements: number;
  repayments: number;
  net: number;
}

interface Transaction {
  id: number;
  transaction_type: string;
  type?: string;
  amount: number;
  transaction_date: string;
}

interface LoanApplication {
  loan_type_id: number;
  id: number;
  principal_amount: string;
  loan_status: string;
  created_at: string;
  loan_type?: {
    loanType: string;
  };
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(amount);
};

const getWeekInfo = (date: Date) => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  return `Week ${weekNumber}`;
};

const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendValue }: any) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      {trend && (
        <div
          className={`flex items-center text-xs mt-2 ${
            trend === "up" ? "text-green-600" : "text-red-600"
          }`}
        >
          <TrendingUp
            className={`h-3 w-3 mr-1 ${trend === "down" ? "rotate-180" : ""}`}
          />
          {trendValue}
        </div>
      )}
    </CardContent>
  </Card>
);

const LoadingSpinner = () => (
  <div className="h-[300px] flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// -------- Main Component --------
export default function Analytics() {
  const [loanData, setLoanData] = useState<LoanApplication[]>([]);
  const [loanTypes, setLoanTypes] = useState<LoanType[]>([]);
  const [transactionData, setTransactionData] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all data
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoading(true);
        
        const [loansResponse, transactionsResponse, loanTypesResponse] = await Promise.all([
          apiService.get("/loan-applications").catch(() => ({ data: [] })),
          apiService.get("/transactions").catch(() => ({ data: [] })),
          apiService.get("/loan-types").catch(() => ({ data: [] })),
        ]);
        
        const loansData = Array.isArray(loansResponse) ? loansResponse : loansResponse?.data || [];
        const transactionsData = Array.isArray(transactionsResponse) ? transactionsResponse : transactionsResponse?.data || [];
        const typesData = Array.isArray(loanTypesResponse) ? loanTypesResponse : loanTypesResponse?.data || [];
        
        setLoanData(loansData);
        setTransactionData(transactionsData);
        setLoanTypes(typesData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Process weekly loan application data
  const weeklyData: WeeklyData[] = Object.values(
    loanData.reduce((acc: Record<string, WeeklyData>, loan) => {
      const date = new Date(loan.created_at);
      const week = getWeekInfo(date);

      if (!acc[week]) {
        acc[week] = {
          week,
          applications: 0,
          approved: 0,
          rejected: 0,
          pending: 0,
        };
      }

      acc[week].applications += 1;

      const status = loan.loan_status.toLowerCase();
      if (status === "approved" || status === "disbursed") {
        acc[week].approved += 1;
      } else if (status === "rejected") {
        acc[week].rejected += 1;
      } else {
        acc[week].pending += 1;
      }

      return acc;
    }, {})
  );

  // Process loan categories data
  const loanCategoryData: LoanCategoryData[] = Object.values(
    loanData.reduce((acc: Record<string, LoanCategoryData>, loan) => {
      const loanType = loanTypes.find((t) => t.id === loan.loan_type_id);
      const type = loanType?.loanType || 'Others';
      
      if (!acc[type]) {
        acc[type] = {
          category: type,
          amount: 0,
          count: 0,
        };
      }

      acc[type].amount += Number(loan.principal_amount) || 0;
      acc[type].count += 1;

      return acc;
    }, {})
  );

  // Process loan status data
  const statusCounts = loanData.reduce(
    (acc: Record<string, { value: number; amount: number }>, loan) => {
      const status = loan.loan_status.toLowerCase();
      let statusKey = "Pending";

      if (status === "approved" || status === "disbursed") {
        statusKey = "Approved";
      } else if (status === "rejected") {
        statusKey = "Rejected";
      }

      if (!acc[statusKey]) {
        acc[statusKey] = { value: 0, amount: 0 };
      }

      acc[statusKey].value += 1;
      acc[statusKey].amount += Number(loan.principal_amount);

      return acc;
    },
    {}
  );

  const statusData: StatusData[] = [
    {
      name: "Approved",
      value: statusCounts["Approved"]?.value || 0,
      amount: statusCounts["Approved"]?.amount || 0,
      color: "#10b981",
    },
    {
      name: "Pending",
      value: statusCounts["Pending"]?.value || 0,
      amount: statusCounts["Pending"]?.amount || 0,
      color: "#f59e0b",
    },
    {
      name: "Rejected",
      value: statusCounts["Rejected"]?.value || 0,
      amount: statusCounts["Rejected"]?.amount || 0,
      color: "#ef4444",
    },
  ];

  // Process daily transaction data - FIXED
  const dailyTransactionData: TransactionData[] = Object.values(
    transactionData.reduce((acc: Record<string, TransactionData>, transaction) => {
      // Parse date and convert to local date string to avoid timezone issues
      const date = new Date(transaction.transaction_date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          disbursements: 0,
          repayments: 0,
          net: 0,
        };
      }

      const amount = Number(transaction.amount) || 0;
      
      // Check both transaction_type and type to catch all data variations
      const isRepayment = transaction.transaction_type === "repayment" || transaction.type === "repayment";
      const isDisbursement = transaction.transaction_type === "loan_transaction" && transaction.type === "disbursement";
      
      if (isRepayment) {
        acc[dateKey].repayments += amount;
      } else if (isDisbursement) {
        acc[dateKey].disbursements += amount;
      }
      
      // Net flow: positive when repayments exceed disbursements (money coming in)
      acc[dateKey].net = acc[dateKey].repayments - acc[dateKey].disbursements;

      return acc;
    }, {})
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate statistics - FIXED
  const totalDisbursed = dailyTransactionData.reduce((sum, d) => sum + d.disbursements, 0);
  const totalRepaid = dailyTransactionData.reduce((sum, d) => sum + d.repayments, 0);
  const netCashFlow = totalRepaid - totalDisbursed; // Positive = more repayments (good for lender)
  const approvalRate = loanData.length > 0
    ? ((statusData.find((s) => s.name === "Approved")?.value || 0) / loanData.length) * 100
    : 0;

  return (
    <div className="space-y-6 p-6">
      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Applications"
          value={loanData.length}
          subtitle="All time applications"
          icon={FileCheck}
        />
        <StatCard
          title="Approved Loans"
          value={statusData.find((s) => s.name === "Approved")?.value || 0}
          subtitle={`${approvalRate.toFixed(1)}% approval rate`}
          icon={TrendingUp}
          trend="up"
          trendValue={`${approvalRate.toFixed(0)}%`}
        />
        <StatCard
          title="Pending Review"
          value={statusData.find((s) => s.name === "Pending")?.value || 0}
          subtitle="Awaiting approval"
          icon={AlertCircle}
        />
        <StatCard
          title="Total Disbursed"
          value={formatCurrency(totalDisbursed)}
          subtitle="All disbursements"
          icon={DollarSign}
        />
        <StatCard
          title="Net Cash Flow"
          value={formatCurrency(netCashFlow)}
          subtitle={netCashFlow >= 0 ? "Positive cash position" : "Net outflow position"}
          icon={ArrowDownUp}
          trend={netCashFlow >= 0 ? "up" : "down"}
          trendValue={`${formatCurrency(totalRepaid)} repaid`}
        />
      </div>

      {/* Transaction Trends - Full Width */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Transaction Trends</CardTitle>
          <CardDescription>
            Daily disbursements and repayments over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={dailyTransactionData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                  interval="preserveStartEnd"
                  minTickGap={50}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  tickFormatter={(value) => {
                    if (value >= 1000000) {
                      return `${(value / 1000000).toFixed(1)}M`;
                    }
                    return `${(value / 1000).toFixed(0)}K`;
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="disbursements"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Disbursements"
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="repayments"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Repayments"
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="net"
                  stroke="#6366f1"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Net Flow"
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const date = new Date(payload[0]?.payload?.date);
                      return (
                        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                          <p className="font-semibold text-sm mb-2">
                            {date.toLocaleDateString('en-KE', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </p>
                          {payload.map((entry, index) => (
                            <p
                              key={index}
                              className="text-xs"
                              style={{ color: entry.color }}
                            >
                              {entry.name}: {formatCurrency(entry.value as number)}
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Applications Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Applications Trend</CardTitle>
            <CardDescription>
              Weekly loan applications by status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="week"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="approved"
                    stroke="#10b981"
                    strokeWidth={1}
                    name="Approved"
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="pending"
                    stroke="#f59e0b"
                    strokeWidth={1}
                    name="Pending"
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rejected"
                    stroke="#ef4444"
                    strokeWidth={1}
                    name="Rejected"
                    dot={{ r: 4 }}
                  />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                            <p className="font-semibold text-sm mb-2">
                              {payload[0]?.payload?.week ?? ""}
                            </p>
                            {payload.map((entry, index) => (
                              <p
                                key={index}
                                className="text-xs"
                                style={{ color: entry.color }}
                              >
                                {entry.name}: {entry.value}
                              </p>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Loan Status Distribution</CardTitle>
            <CardDescription>
              Current breakdown by status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              <>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        stroke="none"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                                <p className="font-semibold text-sm mb-2">
                                  {payload[0].name}
                                </p>
                                <p className="text-xs">
                                  Count: {payload[0].value} loans
                                </p>
                                <p className="text-xs text-primary">
                                  Amount:{" "}
                                  {formatCurrency(payload[0].payload.amount)}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {statusData.map((item, index) => (
                    <div key={index} className="text-center">
                      <div className="flex items-center justify-center space-x-2 mb-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs font-medium">
                          {item.name}
                        </span>
                      </div>
                      <p className="text-lg font-bold">{item.value}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(item.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Loan Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Loan Categories Performance</CardTitle>
          <CardDescription>
            Loan amounts and application counts by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[350px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={loanCategoryData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="category"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                          <p className="font-semibold text-sm mb-2">
                            {payload[0].payload.category}
                          </p>
                          <p className="text-xs text-primary">
                            Amount:{" "}
                            {formatCurrency(payload[0].value as number)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Applications: {payload[0].payload.count}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar
                  dataKey="amount"
                  fill="hsl(var(--primary))"
                  name="Loan Amount (KES)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}