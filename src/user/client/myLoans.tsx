import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DollarSign,
  Clock,
  CheckCircle,
  Loader2,
  MoreVertical,
  FileText,
  ArrowRight,
  FileJson,
  FileText as FileTextIcon,
  FileCode2,
} from "lucide-react"
import { apiService } from "@/services/api"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { useUserLoans, type Loan } from "@/hooks/userLoans"
import { DataTable } from "@/components/DataTablePage"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { InlineLoanComment } from "./comments"

type StatementFormat = 'pdf' | 'json' | 'csv' | 'xml'

export default function MyLoans() {
  const [generatingStatements, setGeneratingStatements] = useState<Record<string, boolean>>({})
  const navigate = useNavigate()
  const { user } = useAuth()
  const { loans, metrics, isLoading } = useUserLoans()

  const generatePDF = (loan: Loan) => {
    // Dynamically import jsPDF and jspdf-autotable
    import('jspdf').then((jsPDF) => {
      import('jspdf-autotable').then(() => {
        const doc = new jsPDF.default()
        
        // Add title
        doc.setFontSize(18)
        doc.text(`Loan Statement - ${loan.loan_number}`, 14, 22)
        
        // Add loan details
        doc.setFontSize(11)
        doc.setTextColor(100)
        doc.text(`Borrower: ${loan.borrower?.full_name || 'N/A'}`, 14, 35)
        doc.text(`Loan Amount: ${formatCurrency(loan.principal_amount)}`, 14, 45)
        doc.text(`Status: ${loan.loan_status.toUpperCase()}`, 14, 55)
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 65)
        doc.text(`Loan Type: ${loan.loan_type?.loanType || 'N/A'}`, 14, 75)
        doc.text(`Interest Rate: ${loan.loan_type?.interest_rate || 0}%`, 14, 85)
        
        // Add a line separator
        doc.setDrawColor(200)
        doc.setLineWidth(0.5)
        doc.line(14, 95, 200, 95)
        
        // Add loan summary
        doc.setFontSize(12)
        doc.setTextColor(0, 0, 0)
        doc.text('Loan Summary', 14, 110)
        
        doc.setFontSize(10)
        doc.text(`Principal Amount: ${formatCurrency(loan.principal_amount)}`, 14, 120)
        doc.text(`Interest Amount: ${formatCurrency(loan.interest_amount)}`, 14, 130)
        doc.text(`Total Amount: ${formatCurrency(parseFloat(loan.principal_amount) + parseFloat(loan.interest_amount))}`, 14, 140)
        doc.text(`Monthly Payment: ${formatCurrency(loan.monthly_payment)}`, 14, 150)
        doc.text(`Loan Duration: ${loan.loan_duration} months`, 14, 160)
        doc.text(`Release Date: ${new Date(loan.loan_release_date).toLocaleDateString()}`, 14, 170)
        doc.text(`Due Date: ${new Date(loan.loan_due_date).toLocaleDateString()}`, 14, 180)
        
        // Add a line separator
        doc.setDrawColor(200)
        doc.setLineWidth(0.5)
        doc.line(14, 190, 200, 190)
        
        // Add footer
        doc.setFontSize(10)
        doc.setTextColor(150)
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 280)
        
        // Save the PDF
        doc.save(`loan-statement-${loan.loan_number}-${new Date().toISOString().split('T')[0]}.pdf`)
        toast.success('PDF generated successfully')
      })
    }).catch(err => {
      console.error('Error loading PDF libraries:', err)
      toast.error('Failed to load PDF generator. Please try again.')
    })
  }

  const handleDownloadStatement = async (loanNumber: string, format: StatementFormat = 'json') => {
    try {
      setGeneratingStatements(prev => ({ ...prev, [loanNumber]: true }))
      
      const filename = `loan-statement-${loanNumber}-${new Date().toISOString().split('T')[0]}`
      
      if (format === 'pdf') {
        // Find the loan data
        const loan = loans.find(l => l.loan_number === loanNumber)
        if (loan) {
          generatePDF(loan)
        } else {
          throw new Error('Loan data not found')
        }
        return
      }
      
      // Handle other formats (json, csv, xml)
      const config = {
        responseType: 'json' as const,
        headers: {
          'Accept': format === 'csv' ? 'text/csv' : 
                   format === 'xml' ? 'application/xml' : 'application/json'
        }
      }
      
      const response = await apiService.get(`/loan-statement/${loanNumber}`, config)
      
      if (!response.data) {
        throw new Error('No data received from server')
      }
      
      const data = format === 'json' ? JSON.stringify(response.data, null, 2) : response.data
      const blob = new Blob([data], { 
        type: format === 'csv' ? 'text/csv' : 
              format === 'xml' ? 'application/xml' : 'application/json' 
      })
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success(`Statement for loan ${loanNumber} downloaded as ${format.toUpperCase()}`)
    } catch (error) {
      console.error(`Error downloading ${format} statement:`, error)
      toast.error('Failed to download statement. Please try again.')
    } finally {
      setGeneratingStatements(prev => ({ ...prev, [loanNumber]: false }))
    }
  }

  const calculateProgress = (loan: Loan): number => {
    const totalAmount = parseFloat(loan.principal_amount) + parseFloat(loan.interest_amount)
    const remaining = parseFloat(loan.balance)
    const paid = totalAmount - remaining
    return Math.min((paid / totalAmount) * 100, 100)
  }

  const getStatusInfo = (status: string) => {
    const statusMap = {
      'pending': {
        icon: <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />,
        label: 'PENDING',
        className: 'bg-yellow-100 text-yellow-800'
      },
      'pending-approval': {
        icon: <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />,
        label: 'PENDING',
        className: 'bg-yellow-100 text-yellow-800'
      },
      'approved': {
        icon: <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />,
        label: 'APPROVED',
        className: 'bg-blue-100 text-blue-800'
      },
      'disbursed': {
        icon: <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />,
        label: 'ACTIVE',
        className: 'bg-green-100 text-green-800'
      },
      'completed': {
        icon: <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />,
        label: 'COMPLETED',
        className: 'bg-gray-100 text-gray-800'
      },
      'rejected': {
        icon: <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />,
        label: 'REJECTED',
        className: 'bg-red-100 text-red-800'
      }
    }

    return statusMap[status as keyof typeof statusMap] || {
      icon: <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />,
      label: status.toUpperCase(),
      className: 'bg-gray-100 text-gray-800'
    }
  }

  if (!user) return null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const activeLoan = metrics.activeLoans[0] || null

  return (
    <div className="w-full space-y-4 sm:space-y-6 pb-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold">My Loans</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Track your loans and repayment progress
        </p>
      </div>

      {/* Loan Tabs */}
      <Tabs defaultValue="current" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="current">Current Loan</TabsTrigger>
          <TabsTrigger value="history">Loan History ({loans.length})</TabsTrigger>
        </TabsList>

        {/* Current Loan Tab */}
        <TabsContent value="current" className="space-y-4">
          {!activeLoan ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <DollarSign className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-xl">You do not have active loans at the moment.</p>
                  {loans.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      You have {loans.length} loan{loans.length !== 1 ? 's' : ''} in other statuses.
                    </p>
                  )}
                  <Button 
                    className="mt-4"
                    onClick={() => navigate('/client/apply-loan')}
                  >
                    Apply for a Loan
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Active Loan Details Card */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg sm:text-2xl truncate">
                          {activeLoan.purpose}
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm mt-1">
                          #{activeLoan.loan_number}
                        </CardDescription>
                        <CardDescription className="text-xs sm:text-sm">
                          {activeLoan.loan_type?.loanType || `Type ${activeLoan.loan_type_id}`}
                        </CardDescription>
                      </div>
                      <Badge className={`text-xs px-2 py-1 flex-shrink-0 ${getStatusInfo(activeLoan.loan_status).className}`}>
                        {getStatusInfo(activeLoan.loan_status).icon}
                        <span className="ml-1 hidden sm:inline">
                          {getStatusInfo(activeLoan.loan_status).label}
                        </span>
                        <span className="ml-1 sm:hidden">
                          {getStatusInfo(activeLoan.loan_status).label.slice(0, 3)}
                        </span>
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Amount Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-50 p-3 sm:p-4 rounded-lg border">
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Principal Amount</p>
                      <p className="text-xl sm:text-2xl font-bold">
                        {formatCurrency(activeLoan.principal_amount)}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3 sm:p-4 rounded-lg border">
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Outstanding Balance</p>
                      <p className="text-xl sm:text-2xl font-bold text-orange-600">
                        {formatCurrency(activeLoan.balance)}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3 sm:p-4 rounded-lg border">
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Monthly Payment</p>
                      <p className="text-xl sm:text-2xl font-bold">
                        {formatCurrency(activeLoan.monthly_payment)}
                      </p>
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground">Interest</p>
                      <p className="text-sm sm:text-base font-semibold">
                        {formatCurrency(activeLoan.interest_amount)}
                      </p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="text-sm sm:text-base font-semibold">
                        {activeLoan.loan_duration} months
                      </p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground">Release Date</p>
                      <p className="text-sm sm:text-base font-semibold">
                        {activeLoan.loan_release_date ? formatDate(activeLoan.loan_release_date) : 'Not released'}
                      </p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground">Due Date</p>
                      <p className="text-sm sm:text-base font-semibold">
                        {formatDate(activeLoan.loan_due_date)}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {activeLoan.loan_status === 'disbursed' && (
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="font-medium">Repayment Progress</span>
                        <span className="text-muted-foreground">
                          {Math.round(calculateProgress(activeLoan))}%
                        </span>
                      </div>
                      <Progress value={calculateProgress(activeLoan)} className="h-2 sm:h-3" />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Comments Card - Only show for active/disbursed loans */}
              {(activeLoan.loan_status === 'disbursed' || activeLoan.loan_status === 'active') && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Loan Feedback</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Share your thoughts or ask questions about this loan
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <InlineLoanComment loan={activeLoan} />
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Loan History Tab */}
        <TabsContent value="history" className="space-y-4">
          {loans.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 sm:py-12 px-4">
                  <Clock className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                  <p className="text-muted-foreground text-base sm:text-xl">
                    Your loan history will appear here.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <DataTable
              config={{
                title: "Loan History",
                description: "View your complete loan history including all statuses",
                apiEndpoint: "/loan-applications",
                columns: [
                  {
                    key: "loan_number",
                    label: "Loan #",
                    sortable: true,
                    searchable: true,
                    width: "120px"
                  },
                  {
                    key: "purpose",
                    label: "Purpose",
                    sortable: true,
                    searchable: true,
                  },
                  {
                    key: "principal_amount",
                    label: "Amount",
                    sortable: true,
                    render: (loan: Loan) => formatCurrency(loan.principal_amount),
                    width: "150px"
                  },
                  {
                    key: "loan_duration",
                    label: "Duration",
                    sortable: true,
                    render: (loan: Loan) => `${loan.loan_duration} months`,
                    width: "120px"
                  },
                  {
                    key: "loan_release_date",
                    label: "Release Date",
                    sortable: true,
                    render: (loan: Loan) => loan.loan_release_date ? formatDate(loan.loan_release_date) : 'N/A',
                    width: "150px"
                  },
                  {
                    key: "loan_due_date",
                    label: "Due Date",
                    sortable: true,
                    render: (loan: Loan) => loan.loan_due_date ? formatDate(loan.loan_due_date) : 'N/A',
                    width: "150px"
                  },
                  {
                    key: "status",
                    label: "Status",
                    sortable: true,
                    render: (loan: Loan) => (
                      <Badge className={getStatusInfo(loan.loan_status).className}>
                        {getStatusInfo(loan.loan_status).label}
                      </Badge>
                    ),
                    width: "120px"
                  },
                  {
                    key: "actions",
                    label: "",
                    width: "50px",
                    render: (loan: Loan) => (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem 
                            onClick={() => navigate(`/client/statements/${loan.loan_number}`)}
                            className="cursor-pointer"
                          >
                            <FileTextIcon className="h-4 w-4 mr-2" />
                            View Statement
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Download As</DropdownMenuLabel>
                          <DropdownMenuItem 
                            onClick={() => handleDownloadStatement(loan.loan_number, 'pdf')}
                            disabled={generatingStatements[loan.loan_number]}
                            className="cursor-pointer"
                          >
                            <FileText className="h-4 w-4 mr-2 text-red-500" />
                            PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDownloadStatement(loan.loan_number, 'json')}
                            disabled={generatingStatements[loan.loan_number]}
                            className="cursor-pointer"
                          >
                            <FileJson className="h-4 w-4 mr-2 text-yellow-500" />
                            JSON
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDownloadStatement(loan.loan_number, 'csv')}
                            disabled={generatingStatements[loan.loan_number]}
                            className="cursor-pointer"
                          >
                            <FileTextIcon className="h-4 w-4 mr-2 text-blue-500" />
                            CSV
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDownloadStatement(loan.loan_number, 'xml')}
                            disabled={generatingStatements[loan.loan_number]}
                            className="cursor-pointer"
                          >
                            <FileCode2 className="h-4 w-4 mr-2 text-orange-500" />
                            XML
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )
                  }
                ],
                customFilters: (data: Loan[], searchQuery: string) => {
                  return data.filter((loan: Loan) => {
                    const matchesSearch = 
                      !searchQuery ||
                      loan.loan_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      loan.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      loan.principal_amount.toString().toLowerCase().includes(searchQuery.toLowerCase());
                    
                    return matchesSearch;
                  });
                },
                defaultSort: { key: 'loan_due_date', direction: 'desc' },
                pageSizeOptions: [5, 10, 25, 50],
                defaultPageSize: 10,
                enableExport: true,
                enableColumnVisibility: true,
              }}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}