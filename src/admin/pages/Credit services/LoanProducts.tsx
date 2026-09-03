import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '@/services/api';
import { DataTable, type DataTableConfig } from '@/components/DataTablePage';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { LoanApplication } from '@/types/loan';


import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Eye, Calendar, Info, AlertCircle, Trash2, CreditCard, 
  FileText, FileCode, Edit, Power, PowerOff, Copy
} from 'lucide-react';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
// import { formatCurrency } from '@/lib/utils';

interface LoanProfile {
  repaymentMethod: string;
  repayPeriod: number;
  minLoan: number;
  maxLoan: number;
  requiresConsecutiveSavings: boolean;
  consecutiveSavingsMonths: number;
  minimumSavings: number;
  requiresGuarantors: boolean;
  requiredGuaranties: number;
  requiresCollateral: boolean;
  attractsPenalty: boolean;
  penaltyRate: number;
  requiresCrbCertificate: boolean;
  crbPoints: number;
  loanFormCost: number;
}

interface LoanProduct {
  id: number;
  organization_id: number;
  loanCode: string;
  loanType: string;
  profile: LoanProfile;
  is_active: number;
  created_at: string;
  updated_at: string;
  interest_rate: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
  }).format(amount);
};

// Export to XML
const exportToXML = (data: LoanProduct[], filename: string = 'loan-products') => {
  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<LoanProducts exportDate="${new Date().toISOString()}">
  ${data.map(product => `
  <Product>
    <LoanCode>${product.loanCode}</LoanCode>
    <LoanType>${product.loanType}</LoanType>
    <InterestRate>${product.interest_rate}</InterestRate>
    <Status>${product.is_active === 1 ? 'Active' : 'Inactive'}</Status>
    <Profile>
      <RepaymentMethod>${product.profile.repaymentMethod}</RepaymentMethod>
      <RepayPeriod>${product.profile.repayPeriod}</RepayPeriod>
      <MinLoan>${product.profile.minLoan}</MinLoan>
      <MaxLoan>${product.profile.maxLoan}</MaxLoan>
      <RequiresGuarantors>${product.profile.requiresGuarantors}</RequiresGuarantors>
      <RequiredGuaranties>${product.profile.requiredGuaranties}</RequiredGuaranties>
      <RequiresCollateral>${product.profile.requiresCollateral}</RequiresCollateral>
      <RequiresCRB>${product.profile.requiresCrbCertificate}</RequiresCRB>
    </Profile>
  </Product>`).join('')}
</LoanProducts>`;

  const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.xml`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export to PDF
const exportToPDF = (data: LoanProduct[]) => {
  try {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Loan Products Report', 14, 22);
    
    // Add summary
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 32);
    doc.text(`Total Products: ${data.length}`, 14, 38);
    doc.text(`Active Products: ${data.filter(p => p.is_active === 1).length}`, 14, 44);
    
    // Prepare table data
    const tableData = data.map(product => [
      product.loanCode,
      product.loanType,
      `${product.interest_rate}%`,
      formatCurrency(product.profile.minLoan),
      formatCurrency(product.profile.maxLoan),
      `${product.profile.repayPeriod} months`,
      [
        product.profile.requiresGuarantors ? `Guarantors (${product.profile.requiredGuaranties}%)` : '',
        product.profile.requiresCollateral ? 'Collateral' : '',
        product.profile.requiresCrbCertificate ? 'CRB' : ''
      ].filter(Boolean).join(', ') || 'None',
      product.is_active === 1 ? 'Active' : 'Inactive'
    ]);
    
    // Add table
    autoTable(doc, {
      head: [['Code', 'Product Name', 'Rate', 'Min Amount', 'Max Amount', 'Period', 'Requirements', 'Status']],
      body: tableData,
      startY: 52,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [66, 66, 66], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 35 },
        2: { cellWidth: 15 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 20 },
        6: { cellWidth: 30 },
        7: { cellWidth: 18 }
      }
    });
    
    // Save the PDF
    doc.save(`loan-products-report-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF downloaded successfully');
    // Define formatCurrency function inside the HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Loan Products Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .summary { background-color: #f9f9f9; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
            .active { color: green; font-weight: bold; }
            .inactive { color: gray; }
            @media print { 
              body { margin: 0; }
            }
          </style>
          <script>
            function formatCurrency(amount) {
              if (!amount) return 'N/A';
              return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(amount);
            }
          </script>
        </head>
        <body>
          <h1>Loan Products Report</h1>
          <div class="summary">
            <strong>Generated on:</strong> ${new Date().toLocaleDateString()} <br>
            <strong>Total Products:</strong> ${data.length} <br>
            <strong>Active Products:</strong> ${data.filter(p => p.is_active === 1).length}
          </div>
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Product Name</th>
                <th>Interest Rate</th>
                <th>Min Amount</th>
                <th>Max Amount</th>
                <th>Period (Months)</th>
                <th>Requirements</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(product => `
                <tr>
                  <td>${product.loanCode}</td>
                  <td>${product.loanType}</td>
                  <td>${product.interest_rate}%</td>
                  <td>${formatCurrency(product.profile.minLoan)}</td>
                  <td>${formatCurrency(product.profile.maxLoan)}</td>
                  <td>${product.profile.repayPeriod}</td>
                  <td>
                    ${product.profile.requiresGuarantors ? `Guarantors (${product.profile.requiredGuaranties}%)` : ''}
                    ${product.profile.requiresCollateral ? ' Collateral' : ''}
                    ${product.profile.requiresCrbCertificate ? ' CRB' : ''}
                  </td>
                  <td class="${product.is_active === 1 ? 'active' : 'inactive'}">
                    ${product.is_active === 1 ? 'Active' : 'Inactive'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    // Create a hidden iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();
      
      // Wait for content to load then trigger print
      iframe.onload = () => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        
        // Clean up after printing
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      };
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    toast.error('Failed to generate PDF: ' + (error as Error).message);
  }
};

export const LoanProducts = () => {
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<LoanProduct | null>(null);
  const [dependencyDialogOpen, setDependencyDialogOpen] = useState(false);
  const [productDependencies, setProductDependencies] = useState<{
    product: LoanProduct;
    loanCount: number;
    activeLoans: number;
  } | null>(null);

  // Set breadcrumbs for this page
  useBreadcrumbs([
    { label: 'Dashboard', href: '/' },
    { label: 'Credit Services', href: '/loan-products' },
    { label: 'Loan Products', icon: <CreditCard className="h-4 w-4" /> },
  ]);

  const handleViewDetails = (product: LoanProduct) => {
    navigate(`/loan-products/${product.loanCode}`);
  };

  const handleEdit = (product: LoanProduct) => {
    navigate(`/loan-products/${product.loanCode}/edit`);
  };

  const handleDuplicate = async (product: LoanProduct) => {
    try {
      const newProduct = {
        ...product,
        loanCode: `${product.loanCode}-COPY`,
        loanType: `${product.loanType} (Copy)`,
      };
      
      await apiService.post('/loan-types', newProduct);
      toast.success('Loan product duplicated successfully!');
      // window.location.reload();
    } catch (error) {
      console.log(error)
      toast.error('Failed to duplicate product');
    }
  };

  const toggleProductStatus = async (product: LoanProduct) => {
    try {
      const newStatus = product.is_active === 1 ? 0 : 1;
      await apiService.patch(`/loan-types/${product.loanCode}`, {
        is_active: newStatus
      });
      toast.success(
        `Product ${newStatus === 1 ? 'activated' : 'deactivated'} successfully!`
      );
      // window.location.reload();
    } catch (error) {
      console.log(error)
      toast.error('Failed to update product status');
    }
  };

  const checkLoanDependencies = async (product: LoanProduct) => {
    try {
      const response = await apiService.get<{ data: LoanApplication[] }>('/loan-applications');
      const loans = response.data || [];
      
      const relatedLoans = loans.filter((loan: LoanApplication) => 
        loan.loan_type?.loanCode === product.loanCode
      );
      
      const activeLoans = relatedLoans.filter((loan: LoanApplication) => 
        !['completed', 'rejected', 'closed'].includes(loan.loan_status?.toLowerCase())
      );
      
      return {
        totalLoans: relatedLoans.length,
        activeLoans: activeLoans.length,
        hasLoans: relatedLoans.length > 0
      };
    } catch (error) {
      console.error('Failed to check loan dependencies:', error);
      return {
        totalLoans: 0,
        activeLoans: 0,
        hasLoans: true
      };
    }
  };

  const handleDeleteClick = async (product: LoanProduct) => {
    const dependencies = await checkLoanDependencies(product);
    
    if (dependencies.hasLoans) {
      setProductDependencies({
        product,
        loanCount: dependencies.totalLoans,
        activeLoans: dependencies.activeLoans
      });
      setDependencyDialogOpen(true);
    } else {
      setProductToDelete(product);
      setDeleteDialogOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      await apiService.delete(`/loan-types/${productToDelete.loanCode}`);
      toast.success('Loan product deleted successfully!', {
        description: `${productToDelete.loanType} has been removed.`,
      });
      // window.location.reload();
    } catch (error) {
      console.error('Failed to delete loan product:', error);
      
      let errorMessage = 'An unexpected error occurred';
      
      if (error instanceof Error) {
        // For standard Error objects
        errorMessage = error.message;
      } else if (error && typeof error === 'object' && 'response' in error) {
        // For Axios errors or similar API errors
        interface ApiError extends Error {
          response?: {
            data?: {
              message?: string;
              error?: string;
            };
          };
        }
        
        const apiError = error as ApiError;
        errorMessage = apiError?.response?.data?.message || 
                      apiError?.response?.data?.error || 
                      apiError?.message || 
                      'An unexpected error occurred';
      }
      
      toast.error('Failed to Delete Loan Product', {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const loanProductsConfig: DataTableConfig<LoanProduct> = {
    title: 'Loan Products',
    description: 'Manage loan products and their configurations',
    emptyStateMessage: 'Get started by creating your first loan product',
    apiEndpoint: '/loan-types',

    exportFormatter: (data: LoanProduct[]) => {
      return data.map(product => ({
        'Code': product.loanCode,
        'Loan Type': product.loanType,
        'Repayment Method': product.profile.repaymentMethod.replace('_', ' '),
        'Interest Rate': `${product.interest_rate}%`,
        'Min Amount': formatCurrency(product.profile.minLoan),
        'Max Amount': formatCurrency(product.profile.maxLoan),
        'Repayment Period': `${product.profile.repayPeriod} months`,
        'Requirements': [
          product.profile.requiresGuarantors ? `Guarantors (${product.profile.requiredGuaranties}%)` : '',
          product.profile.requiresCollateral ? 'Collateral' : '',
          product.profile.requiresCrbCertificate ? 'CRB' : ''
        ].filter(Boolean).join(', '),
        'Status': product.is_active === 1 ? 'Active' : 'Inactive',
        'Created At': new Date(product.created_at).toLocaleDateString(),
      }));
    },
    
    // Custom export buttons (PDF & XML)
    headerActions: (data) => (
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportToPDF(data)}
          className="flex items-center gap-2"
          disabled={data.length === 0}
        >
          <FileText className="h-4 w-4" />
          PDF
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            exportToXML(data);
            toast.success('XML exported successfully');
          }}
          className="flex items-center gap-2"
          disabled={data.length === 0}
        >
          <FileCode className="h-4 w-4" />
          XML
        </Button>
      </div>
    ),
    
    addButton: {
      label: 'Create Loan Product',
      link: '/add-loan-product',
    },
    
    columns: [
      {
        key: 'loanCode',
        label: 'Code',
        sortable: true,
        searchable: true,
        width: '120px',
        render: (product) => (
          <Badge variant="outline" className="font-mono font-semibold">
            {product.loanCode}
          </Badge>
        ),
      },
      {
        key: 'loanType',
        label: 'Loan Type',
        sortable: true,
        searchable: true,
        render: (product) => (
          <div>
            <div className="font-medium">{product.loanType}</div>
            <div className="text-xs text-muted-foreground">
              {product.profile.repaymentMethod.replace('_', ' ')}
            </div>
          </div>
        ),
      },
      {
        key: 'profile.repaymentMethod',
        label: 'Repayment Method',
        hidden: true,
        searchable: true,
      },
      {
        key: 'interest_rate',
        label: 'Interest Rate',
        sortable: true,
        align: 'center',
        width: '140px',
        render: (product) => (
          <div className="text-center">
            <div className="font-bold text-lg text-primary">{product.interest_rate}%</div>
            <div className="text-xs text-muted-foreground">per annum</div>
          </div>
        ),
      },
      {
        key: 'profile.minLoan',
        label: 'Min Amount',
        sortable: true,
        align: 'right',
        hidden: true,
      },
      {
        key: 'profile.maxLoan',
        label: 'Max Amount',
        sortable: true,
        align: 'right',
        hidden: true,
      },
      {
        key: 'loan_range',
        label: 'Loan Range',
        sortable: false,
        render: (product) => (
          <div className="text-sm">
            <div className="font-medium">{formatCurrency(product.profile.minLoan)}</div>
            <div className="text-muted-foreground">to {formatCurrency(product.profile.maxLoan)}</div>
          </div>
        ),
      },
      {
        key: 'profile.repayPeriod',
        label: 'Repayment Period',
        sortable: true,
        align: 'center',
        render: (product) => (
          <Badge variant="secondary" className="gap-1">
            <Calendar size={12} />
            {product.profile.repayPeriod} months
          </Badge>
        ),
      },
      {
        key: 'requirements',
        label: 'Requirements',
        sortable: false,
        render: (product) => (
          <div className="flex flex-wrap gap-1">
            {product.profile.requiresGuarantors && (
              <Badge variant="outline" className="text-xs">
                Guarantors {product.profile.requiredGuaranties}%
              </Badge>
            )}
            {product.profile.requiresCollateral && (
              <Badge variant="outline" className="text-xs">
                Collateral
              </Badge>
            )}
            {product.profile.requiresCrbCertificate && (
              <Badge variant="outline" className="text-xs">
                CRB
              </Badge>
            )}
            {!product.profile.requiresGuarantors && 
             !product.profile.requiresCollateral && 
             !product.profile.requiresCrbCertificate && (
              <span className="text-xs text-muted-foreground">None</span>
            )}
          </div>
        ),
      },
      {
        key: 'is_active',
        label: 'Status',
        sortable: true,
        searchable: true,
        render: (product) => (
          product.is_active === 1 ? (
            <Badge className="bg-green-500 text-white hover:bg-green-600">Active</Badge>
          ) : (
            <Badge variant="secondary">Inactive</Badge>
          )
        ),
      },
      {
        key: 'created_at',
        label: 'Created',
        sortable: true,
        hidden: true,
        render: (product) => new Date(product.created_at).toLocaleDateString(),
      },
    ],
    
    stats: [
      {
        label: 'Total Products',
        getValue: (data) => data.length,
        description: 'All loan types',
      },
      {
        label: 'Active Products',
        getValue: (data) => data.filter((p: LoanProduct) => p.is_active === 1).length,
        description: 'Currently available',
        trend: {
          value: '+2 this month',
          isPositive: true,
        },
      },
      {
        label: 'Avg Interest Rate',
        getValue: (data) => {
          if (data.length === 0) return '0%';
          const avg = data.reduce((sum: number, p: LoanProduct) => 
            sum + parseFloat(p.interest_rate), 0) / data.length;
          return `${avg.toFixed(2)}%`;
        },
        description: 'Across all products',
      },
      {
        label: 'Max Loan Amount',
        getValue: (data) => {
          if (data.length === 0) return formatCurrency(0);
          const max = Math.max(...data.map((p: LoanProduct) => p.profile.maxLoan));
          return formatCurrency(max);
        },
        description: 'Highest available',
      },
    ],
    
    actions: [
      {
        label: 'View Details',
        icon: <Eye size={16} />,
        onClick: handleViewDetails,
      },
      {
        label: 'Edit Product',
        icon: <Edit size={16} />,
        onClick: handleEdit,
      },
      {
        label: (product) => product.is_active === 1 ? 'Deactivate' : 'Activate',
        icon: (product) => product.is_active === 1 ? 
          <PowerOff size={16} /> : <Power size={16} />,
        onClick: toggleProductStatus,
        separator: true,
      },
      {
        label: 'Duplicate',
        icon: <Copy size={16} />,
        onClick: handleDuplicate,
      },
      {
        label: 'Delete',
        icon: <Trash2 size={16} />,
        onClick: handleDeleteClick,
        variant: 'destructive',
        separator: true,
      },
    ],
    
    // Bulk Actions
    bulkActions: [
      {
        label: 'Activate Selected',
        icon: <Power size={16} />,
        onClick: async (products: LoanProduct[]) => {
          if (confirm(`Activate ${products.length} product(s)?`)) {
            for (const product of products) {
              if (product.is_active === 0) {
                await toggleProductStatus(product);
              }
            }
          }
        },
      },
      {
        label: 'Deactivate Selected',
        icon: <PowerOff size={16} />,
        onClick: async (products: LoanProduct[]) => {
          if (confirm(`Deactivate ${products.length} product(s)?`)) {
            for (const product of products) {
              if (product.is_active === 1) {
                await toggleProductStatus(product);
              }
            }
          }
        },
      },
      {
        label: 'Delete Selected',
        icon: <Trash2 size={16} />,
        variant: 'destructive',
        onClick: async (products: LoanProduct[]) => {
          if (confirm(`Delete ${products.length} product(s)? This will check for dependencies.`)) {
            for (const product of products) {
              const deps = await checkLoanDependencies(product);
              if (!deps.hasLoans) {
                setProductToDelete(product);
                await handleDeleteConfirm();
              } else {
                toast.warning(`Cannot delete ${product.loanType} - has ${deps.totalLoans} loans`);
              }
            }
          }
        },
      },
    ],
    
    searchPlaceholder: 'Search by code, name, or requirements...',
    searchKeys: ['loanCode', 'loanType', 'profile.repaymentMethod'],
    
    enableRowSelection: true,
    enableExport: true, 
    enableColumnVisibility: true,
    defaultPageSize: 15,
    pageSizeOptions: [10, 15, 25, 50],
    defaultSort: {
      key: 'loanType',
      direction: 'asc',
    },
    
    // Auto-refresh every 5 minutes
    refreshInterval: 300000,
    
    onDataLoad: (data) => {
      console.log(`Loaded ${data.length} loan products`);
    },
  };

  return (
    <>
      <DataTable config={loanProductsConfig} />
      
      {/* Dependency Information Dialog */}
      <AlertDialog open={dependencyDialogOpen} onOpenChange={setDependencyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              Cannot Delete Loan Product
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              {productDependencies && (
                <div className="space-y-4">
                  <p>
                    "{productDependencies.product.loanType}" ({productDependencies.product.loanCode}) 
                    cannot be deleted because it has {productDependencies.loanCount} existing loans.
                  </p>
                  {productDependencies.activeLoans > 0 && (
                    <p className="text-orange-600 font-medium">
                      ⚠️ {productDependencies.activeLoans} of these loans are still active.
                    </p>
                  )}
                  <p>Consider deactivating the product instead.</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setDependencyDialogOpen(false);
                if (productDependencies?.product) {
                  navigate('/loan-portfolio');
                }
              }}
              className="bg-primary hover:bg-primary/90"
            >
              View Loans
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Delete Loan Product?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              {productToDelete && (
                <div className="space-y-3">
                  <p>
                    This will permanently delete "{productToDelete.loanType}" ({productToDelete.loanCode}). 
                    This action cannot be undone and will remove all associated configurations.
                  </p>
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm font-medium mb-2">Product Details:</p>
                    <ul className="text-sm space-y-1">
                      <li>• Interest Rate: {productToDelete.interest_rate}%</li>
                      <li>• Loan Range: {formatCurrency(productToDelete.profile.minLoan)} - {formatCurrency(productToDelete.profile.maxLoan)}</li>
                      <li>• Status: {productToDelete.is_active === 1 ? 'Active' : 'Inactive'}</li>
                    </ul>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};