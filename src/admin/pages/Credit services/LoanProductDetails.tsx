import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  Edit, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Check, 
  X, 
  Info, 
  Shield, 
  AlertCircle, 
  CreditCard,
} from 'lucide-react';


import EditLoanProduct from './EditLoanProduct';
import { formatCurrency } from '@/lib/utils';
import { FeedbackSection } from '@/components/common/FeedbackSection';

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

const DetailRow = ({ 
  label, 
  value, 
  icon 
}: { 
  label: string; 
  value: React.ReactNode; 
  icon?: React.ReactNode;
}) => (
  <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
    <span className="text-sm text-muted-foreground flex items-center gap-2">
      {icon}
      {label}
    </span>
    <span className="text-sm font-medium text-foreground">{value}</span>
  </div>
);

const RequirementCard = ({ 
  icon, 
  title, 
  items 
}: { 
  icon: React.ReactNode; 
  title: string; 
  items: Array<{ label: string; value: React.ReactNode; required?: boolean }>;
}) => (
  <div className="bg-muted/50 rounded-lg p-4">
    <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
      {icon}
      {title}
    </h4>
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-2">
            {item.required !== undefined && (
              item.required ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <X className="w-4 h-4 text-muted-foreground" />
              )
            )}
            {item.label}
          </span>
          <span className="font-medium text-foreground">{item.value}</span>
        </div>
      ))}
    </div>
  </div>
);
export const LoanProductDetail = () => {
  const { loanCode } = useParams<{ loanCode: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<LoanProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!loanCode) return;

      try {
        const response = await apiService.get(`/loan-types/${loanCode}`);
        console.log(response.data)
        setProduct(response.data);
      } catch (error) {
        console.error('Failed to fetch loan product:', error);
        toast.error('Failed to load loan product details');
        navigate('/loan-products');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [loanCode, navigate]);

  useBreadcrumbs([
    { label: 'Dashboard', href: '/' },
    { label: 'Credit Services', href: '/loan-products' },
    { label: 'Loan Products', href: '/loan-products' },
    { label: loanCode || 'Loan Product', icon: <CreditCard className="h-4 w-4" /> },
  ]);

  const handleProductUpdate = (updatedProduct: LoanProduct) => {
    setProduct(updatedProduct);
    setIsEditing(false);
    toast.success('Loan product updated successfully!');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto p-6 text-center">
        <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Loan Product Not Found</h2>
        <p className="text-muted-foreground mb-4">The loan product you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/loan-products')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Loan Products
        </Button>
      </div>
    );
  }

  return (
    <div className="min-w-full mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/loan-products')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button> */}
          <div>
            <h1 className="text-3xl font-bold">{product.loanType}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="font-mono text-sm">
                {product.loanCode}
              </Badge>
              {product.is_active === 1 ? (
                <Badge className="bg-green-500 text-white">Active</Badge>
              ) : (
                <Badge variant="secondary">Inactive</Badge>
              )}
              {/* <span className="text-sm text-muted-foreground">
                Created {formatDate(product.created_at)}
              </span> */}
            </div>
          </div>
        </div>
        
        <Button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-2"
        >
          <Edit className="h-4 w-4" />
          {isEditing ? 'Cancel Edit' : 'Edit Product'}
        </Button>
      </div>

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Product Details</TabsTrigger>
          <TabsTrigger value="feedback">
            Customer Feedback
            <Badge variant="secondary" className="ml-2">
              {/* You might want to fetch feedback count here */}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          {isEditing ? (
            <EditLoanProduct
              product={product}
              onProductUpdate={handleProductUpdate}
              onOpenChange={setIsEditing}
              isModal={false}
            />
          ) : (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold text-primary">{product.interest_rate}%</p>
                    <p className="text-xs text-muted-foreground">Interest Rate</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Calendar className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                    <p className="text-2xl font-bold text-blue-600">{product.profile.repayPeriod}</p>
                    <p className="text-xs text-muted-foreground">Months</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-600" />
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(product.profile.minLoan)}
                    </p>
                    <p className="text-xs text-muted-foreground">Min Loan</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <DollarSign className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                    <p className="text-lg font-bold text-purple-600">
                      {formatCurrency(product.profile.maxLoan)}
                    </p>
                    <p className="text-xs text-muted-foreground">Max Loan</p>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              {/* Repayment Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-primary" />
                    Repayment Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DetailRow 
                    label="Repayment Method" 
                    value={
                      <Badge variant="outline">
                        {product.profile.repaymentMethod.replace('_', ' ')}
                      </Badge>
                    }
                  />
                  <DetailRow 
                    label="Repayment Period" 
                    value={`${product.profile.repayPeriod} months`}
                  />
                  <DetailRow 
                    label="Loan Form Cost" 
                    value={formatCurrency(product.profile.loanFormCost)}
                  />
                </CardContent>
              </Card>

              <Separator />

              {/* Requirements Grid */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Loan Requirements
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Savings Requirements */}
                  <RequirementCard
                    icon={<DollarSign className="w-4 h-4" />}
                    title="Savings Requirements"
                    items={[
                      {
                        label: 'Consecutive Savings',
                        value: product.profile.requiresConsecutiveSavings ? 'Required' : 'Not Required',
                        required: product.profile.requiresConsecutiveSavings,
                      },
                      ...(product.profile.requiresConsecutiveSavings ? [
                        {
                          label: 'Required Months',
                          value: `${product.profile.consecutiveSavingsMonths} months`,
                        },
                        {
                          label: 'Minimum Savings',
                          value: formatCurrency(product.profile.minimumSavings),
                        },
                      ] : []),
                    ]}
                  />

                  {/* Security Requirements */}
                  <RequirementCard
                    icon={<Shield className="w-4 h-4" />}
                    title="Security Requirements"
                    items={[
                      {
                        label: 'Guarantors',
                        value: product.profile.requiresGuarantors ? 'Required' : 'Not Required',
                        required: product.profile.requiresGuarantors,
                      },
                      ...(product.profile.requiresGuarantors ? [
                        {
                          label: 'Required Guarantee',
                          value: `${product.profile.requiredGuaranties}%`,
                        },
                      ] : []),
                      {
                        label: 'Collateral',
                        value: product.profile.requiresCollateral ? 'Required' : 'Not Required',
                        required: product.profile.requiresCollateral,
                      },
                    ]}
                  />

                  {/* CRB Requirements */}
                  <RequirementCard
                    icon={<Info className="w-4 h-4" />}
                    title="CRB Requirements"
                    items={[
                      {
                        label: 'CRB Certificate',
                        value: product.profile.requiresCrbCertificate ? 'Required' : 'Not Required',
                        required: product.profile.requiresCrbCertificate,
                      },
                      ...(product.profile.requiresCrbCertificate ? [
                        {
                          label: 'Required Points',
                          value: `${product.profile.crbPoints} points`,
                        },
                      ] : []),
                    ]}
                  />

                  {/* Penalty Information */}
                  <RequirementCard
                    icon={<AlertCircle className="w-4 h-4" />}
                    title="Penalty Information"
                    items={[
                      {
                        label: 'Attracts Penalty',
                        value: product.profile.attractsPenalty ? 'Yes' : 'No',
                        required: product.profile.attractsPenalty,
                      },
                      ...(product.profile.attractsPenalty ? [
                        {
                          label: 'Penalty Rate',
                          value: (
                            <span className="text-red-600 font-semibold">
                              {product.profile.penaltyRate}% / month
                            </span>
                          ),
                        },
                      ] : []),
                    ]}
                  />
                </div>
              </div>

              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    This loan product offers amounts between{' '}
                    <span className="font-semibold text-foreground">
                      {formatCurrency(product.profile.minLoan)}
                    </span>{' '}
                    and{' '}
                    <span className="font-semibold text-foreground">
                      {formatCurrency(product.profile.maxLoan)}
                    </span>{' '}
                    at an interest rate of{' '}
                    <span className="font-semibold text-primary">
                      {product.interest_rate}%
                    </span>
                    , repayable over{' '}
                    <span className="font-semibold text-foreground">
                      {product.profile.repayPeriod} months
                    </span>{' '}
                    using the{' '}
                    <span className="font-semibold text-foreground">
                      {product.profile.repaymentMethod.replace('_', ' ')}
                    </span>{' '}
                    method.
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="feedback">
          {loanCode && <FeedbackSection loanCode={loanCode} />}
        </TabsContent>
      </Tabs>
    </div>
  );
};