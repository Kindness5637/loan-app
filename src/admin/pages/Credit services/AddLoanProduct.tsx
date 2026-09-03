import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoanProductForm from '@/components/common/LoanProductForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const AddLoanProduct = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const handleFormSubmit = async (data: any) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      
      // const transformedData = {    // const transformedData = {
      //   loanType: data.loanType,
      //   interest_rate: parseFloat(data.interest_rate),
      //   repaymentMethod: data.repaymentMethod,
      //   repayPeriod: parseInt(data.repayPeriod),
      //   minLoan: parseInt(data.minLoan),
      //   maxLoan: parseInt(data.maxLoan),
      //   requiresConsecutiveSavings: Boolean(data.requiresConsecutiveSavings),
      //   consecutiveSavingsMonths: parseInt(data.consecutiveSavingsMonths) || 0,
      //   minimumSavings: parseInt(data.minimumSavings) || 0,
      //   requiresGuarantors: Boolean(data.requiresGuarantors),
      //   requiredGuaranties: parseInt(data.requiredGuaranties) || 0,
      //   requiresCollateral: Boolean(data.requiresCollateral),
      //   attractsPenalty: Boolean(data.attractsPenalty),
      //   penaltyRate: parseFloat(data.penaltyRate) || 0,
      //   requiresCrbCertificate: Boolean(data.requiresCrbCertificate),
      //   crbPoints: parseInt(data.crbPoints) || 0,
      //   loanFormCost: parseInt(data.loanFormCost) || 0,
      // };
      

      toast.success('Loan product created successfully!', {
        description: `${data.loanType} has been added to your loan products.`,
      });
      
      // Navigate back to loan products list after success
      setTimeout(() => {
        navigate('/loan-products');
      }, 1500);
    } catch (error: any) {
      
      if (error.response) {
        // Log validation errors specifically
        if (error.response.data?.errors) {
          Object.entries(error.response.data.errors).forEach(([field, messages]) => {
            console.error(`Field '${field}':`, messages);
          });
        }
        
        toast.error('Failed to create loan product', {
          description: error.response.data.message || 'Please check the form and try again.',
        });
      } else if (error.request) {
        toast.error('Connection Error', {
          description: 'Unable to connect to the server. Please check your connection.',
        });
      } else {
        toast.error('Unexpected Error', {
          description: 'Something went wrong. Please try again.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-8xl mx-auto">
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-card/90 backdrop-blur-md border-b border-border shadow-sm p-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          Create a New Loan Product
        </h1>
        <Button
          variant="default"
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
            loanType: '',
            interest_rate: 0,
            repaymentMethod: 'FLAT',
            repayPeriod: 12,
            minLoan: 1000,
            maxLoan: 100000,
            requiresConsecutiveSavings: true,
            consecutiveSavingsMonths: 1,
            minimumSavings: 0,
            requiresGuarantors: false,
            requiredGuaranties: 0,
            requiresCollateral: false,
            attractsPenalty: false,
            penaltyRate: 0,
            requiresCrbCertificate: false,
            crbPoints: 0,
            loanFormCost: 0,
          }}
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
        />
      </main>
    </div>
  );
};

export default AddLoanProduct;
