import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LoanProductForm from '@/components/common/LoanProductForm';
import { apiService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface LoanProduct {
  loanCode: string;
  loanType: string;
  interest_rate: number;
  repaymentMethod: 'FLAT' | 'REDUCING_BALANCE';
  repayPeriod: number;
  minLoan: number;
  maxLoan: number;
  requiresConsecutiveSavings: boolean;
  consecutiveSavingsMonths?: number;
  minimumSavings?: number;
  requiresGuarantors: boolean;
  requiredGuaranties?: number;
  requiresCollateral: boolean;
  attractsPenalty: boolean;
  penaltyRate?: number;
  requiresCrbCertificate: boolean;
  crbPoints?: number;
  loanFormCost: number;
}

interface EditLoanProductProps {
  product?: any; 
  onProductUpdate?: (updatedProduct: any) => void;
  onOpenChange?: (open: boolean) => void; 
  isModal?: boolean; // Flag to determine if used in modal
}

const EditLoanProduct = (props: EditLoanProductProps = {}) => {
  const { product: modalProduct, onProductUpdate, onOpenChange, isModal = false } = props;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!isModal); // Don't load if modal provides product
  const [loanProduct, setLoanProduct] = useState<LoanProduct | null>(null);
  const navigate = useNavigate();
  const { loanCode } = useParams<{ loanCode: string }>();

  useEffect(() => {
    if (isModal && modalProduct) {
      // the product data structure
      const transformedProduct = {
        loanCode: modalProduct.loanCode,
        loanType: modalProduct.loanType,
        interest_rate: parseFloat(modalProduct.interest_rate),
        repaymentMethod: modalProduct.profile.repaymentMethod,
        repayPeriod: modalProduct.profile.repayPeriod,
        minLoan: modalProduct.profile.minLoan,
        maxLoan: modalProduct.profile.maxLoan,
        requiresConsecutiveSavings: modalProduct.profile.requiresConsecutiveSavings,
        consecutiveSavingsMonths: modalProduct.profile.consecutiveSavingsMonths || 0,
        minimumSavings: modalProduct.profile.minimumSavings || 0,
        requiresGuarantors: modalProduct.profile.requiresGuarantors,
        requiredGuaranties: modalProduct.profile.requiredGuaranties || 0,
        requiresCollateral: modalProduct.profile.requiresCollateral,
        attractsPenalty: modalProduct.profile.attractsPenalty,
        penaltyRate: modalProduct.profile.penaltyRate || 0,
        requiresCrbCertificate: modalProduct.profile.requiresCrbCertificate,
        crbPoints: modalProduct.profile.crbPoints || 0,
        loanFormCost: modalProduct.profile.loanFormCost,
      };
      setLoanProduct(transformedProduct);
      setIsLoading(false);
    } else if (loanCode && !isModal) {
      fetchLoanProduct(loanCode);
    }
  }, [loanCode, isModal, modalProduct]);

  const fetchLoanProduct = async (code: string) => {
    try {
      setIsLoading(true);
      const response = await apiService.get(`/loan-types/${code}`);
      setLoanProduct(response.data || response);
    } catch (error: any) {
      console.error('Failed to fetch loan product:', error);
      toast.error('Failed to load loan product', {
        description: 'Unable to fetch loan product details. Please try again.',
      });
      navigate('/loan-products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (data: any) => {
    const productCode = isModal ? modalProduct?.loanCode : loanCode;
    if (isSubmitting || !productCode) return;
    
    setIsSubmitting(true);
    
    try {
      
      // Transform data to exactly match your working Postman structure
      const transformedData = {
        loanType: data.loanType,
        interest_rate: parseFloat(data.interest_rate),
        repaymentMethod: data.repaymentMethod,
        repayPeriod: parseInt(data.repayPeriod),
        minLoan: parseInt(data.minLoan),
        maxLoan: parseInt(data.maxLoan),
        requiresConsecutiveSavings: Boolean(data.requiresConsecutiveSavings),
        consecutiveSavingsMonths: parseInt(data.consecutiveSavingsMonths) || 0,
        minimumSavings: parseInt(data.minimumSavings) || 0,
        requiresGuarantors: Boolean(data.requiresGuarantors),
        requiredGuaranties: parseInt(data.requiredGuaranties) || 0,
        requiresCollateral: Boolean(data.requiresCollateral),
        attractsPenalty: Boolean(data.attractsPenalty),
        penaltyRate: parseFloat(data.penaltyRate) || 0,
        requiresCrbCertificate: Boolean(data.requiresCrbCertificate),
        crbPoints: parseInt(data.crbPoints) || 0,
        loanFormCost: parseInt(data.loanFormCost) || 0,
      };
      

      const response = await apiService.put(`/loan-types/${productCode}`, transformedData);

      
      toast.success('Loan product updated successfully!', {
        description: `${data.loanType} has been updated. You can view the changes in the loan products list.`,
      });
      
      if (isModal) {
        onProductUpdate?.(response.data);
        onOpenChange?.(false);
      } else {
        // If parent provided handlers (e.g., details page edit), use them
        if (onProductUpdate || onOpenChange) {
          onProductUpdate?.(response.data);
          onOpenChange?.(false);
        } else {
          // Fallback to original page behavior
          if (loanCode) {
            await fetchLoanProduct(loanCode);
          }
          setTimeout(() => {
            navigate('/loan-products');
          }, 2000);
        }
      }
    } catch (error: any) {
      console.error("Full error object:", error);
      
      if (error.response) {
        console.error("❌ API Error Response:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
        
        // Log validation errors specifically
        if (error.response.data?.errors) {
          console.error("Validation errors:", error.response.data.errors);
          Object.entries(error.response.data.errors).forEach(([field, messages]) => {
            console.error(`Field '${field}':`, messages);
          });
        }
        
        toast.error('Failed to update loan product', {
          description: error.response.data.message || 'Please check the form and try again.',
        });
      } else if (error.request) {
        console.error("❌ No response from server:", error.request);
        toast.error('Connection Error', {
          description: 'Unable to connect to the server. Please check your connection.',
        });
      } else {
        console.error("❌ Unexpected Error:", error.message);
        toast.error('Unexpected Error', {
          description: 'Something went wrong. Please try again.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-8xl mx-auto">
        <header className="sticky rounded-lg top-0 z-10 bg-card/90 backdrop-blur-md border-b border-border shadow-sm p-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">
            Edit Loan Product
          </h1>
          <Button
            variant="ghost"
            onClick={() => navigate('/loan-products')}
            className="gap-2"
          >
            <ArrowLeft size={16} />
            Back to Products
          </Button>
        </header>
        <main className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading loan product...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!loanProduct) {
    return (
      <div className="max-w-8xl mx-auto">
        <header className="sticky rounded-lg top-0 z-10 bg-card/90 backdrop-blur-md border-b border-border shadow-sm p-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">
            Edit Loan Product
          </h1>
          <Button
            variant="ghost"
            onClick={() => navigate('/loan-products')}
            className="gap-2"
          >
            <ArrowLeft size={16} />
            Back to Products
          </Button>
        </header>
        <main className="p-6">
          <div className="text-center">
            <p className="text-muted-foreground">Loan product not found.</p>
          </div>
        </main>
      </div>
    );
  }

  // For modal usage, return just the form
  if (isModal) {
    return (
      <LoanProductForm
        defaultValues={{
          loanType: loanProduct.loanType,
          interest_rate: loanProduct.interest_rate,
          repaymentMethod: loanProduct.repaymentMethod,
          repayPeriod: loanProduct.repayPeriod,
          minLoan: loanProduct.minLoan,
          maxLoan: loanProduct.maxLoan,
          requiresConsecutiveSavings: loanProduct.requiresConsecutiveSavings,
          consecutiveSavingsMonths: loanProduct.consecutiveSavingsMonths || 0,
          minimumSavings: loanProduct.minimumSavings || 0,
          requiresGuarantors: loanProduct.requiresGuarantors,
          requiredGuaranties: loanProduct.requiredGuaranties || 0,
          requiresCollateral: loanProduct.requiresCollateral,
          attractsPenalty: loanProduct.attractsPenalty,
          penaltyRate: loanProduct.penaltyRate || 0,
          requiresCrbCertificate: loanProduct.requiresCrbCertificate,
          crbPoints: loanProduct.crbPoints || 0,
          loanFormCost: loanProduct.loanFormCost,
        }}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        submitLabel="Save Changes"
        submittingLabel="Saving Changes..."
        cancelLabel="Cancel"
        onCancel={() => onOpenChange?.(false)}
      />
    );
  }

  // For page usage, return full page layout
  return (
    <div className="max-w-8xl mx-auto">
      {/* Sticky Header */}
      <header className="sticky rounded-lg top-0 z-10 bg-card/90 backdrop-blur-md border-b border-border shadow-sm p-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          Edit Loan Product
        </h1>
        <Button
          variant="ghost"
          onClick={() => navigate('/loan-products')}
          className="gap-2"
        >
          <ArrowLeft size={16} />
          Back to Products
        </Button>
      </header>

      {/* Content Area */}
      <main className="p-6">
        <LoanProductForm
          defaultValues={{
            loanType: loanProduct.loanType,
            interest_rate: loanProduct.interest_rate,
            repaymentMethod: loanProduct.repaymentMethod,
            repayPeriod: loanProduct.repayPeriod,
            minLoan: loanProduct.minLoan,
            maxLoan: loanProduct.maxLoan,
            requiresConsecutiveSavings: loanProduct.requiresConsecutiveSavings,
            consecutiveSavingsMonths: loanProduct.consecutiveSavingsMonths || 0,
            minimumSavings: loanProduct.minimumSavings || 0,
            requiresGuarantors: loanProduct.requiresGuarantors,
            requiredGuaranties: loanProduct.requiredGuaranties || 0,
            requiresCollateral: loanProduct.requiresCollateral,
            attractsPenalty: loanProduct.attractsPenalty,
            penaltyRate: loanProduct.penaltyRate || 0,
            requiresCrbCertificate: loanProduct.requiresCrbCertificate,
            crbPoints: loanProduct.crbPoints || 0,
            loanFormCost: loanProduct.loanFormCost,
          }}
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
          submitLabel="Save changes"
          submittingLabel="Saving changes..."
          cancelLabel="Cancel"
          onCancel={() => navigate('/loan-products')}
        />
      </main>
    </div>
  );
};

export default EditLoanProduct;
