// LoanEdit.tsx - Edit page for a single loan account
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiService } from '@/services/api';
import { toast } from 'react-toastify';
// import { formatCurrency } from '@/lib/utils';

interface LoanFormData {
  loan_number: string;
  borrower_id: number;
  loan_type_id: number;
  principal_amount: string;
  loan_status: string;
  purpose: string;
  collateral: string;
  interest_amount: string;
  interest_method: string;
  loan_duration: number;
  duration_period: string;
  loan_release_date: string | null;
  loan_due_date: string;
  repayment_amount: string;
  balance: string;
  monthly_payment: string;
  arrears_amount: string;
  days_in_arrears: number;
}

interface LoanApplication {
  id: number;
  loan_number: string;
  created_at: string;
  borrower_id: number;
  loan_type_id: number;
  principal_amount: string;
  loan_status: string;
  purpose: string;
  collateral: string;
  interest_amount: string;
  interest_method: string;
  loan_duration: number;
  duration_period: string;
  loan_release_date: string | null;
  loan_due_date: string;
  repayment_amount: string;
  balance: string;
  monthly_payment: string;
  arrears_amount: string;
  days_in_arrears: number;
  borrower: {
    id: number;
    full_name: string;
    phone: string;
    email: string | null;
    id_number: number;
  };
  loan_type: {
    id: number;
    loanCode: string;
    loanType: string;
    interest_rate: string;
  };
}

const LOAN_STATUSES = [
  { value: 'pending-approval', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'disbursed', label: 'Disbursed' },
  { value: 'active', label: 'Active' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'completed', label: 'Completed' },
  { value: 'defaulted', label: 'Defaulted' },
];

const INTEREST_METHODS = [
  { value: 'FLAT', label: 'Flat Rate' },
  { value: 'REDUCING', label: 'Reducing Balance' },
  { value: 'SIMPLE', label: 'Simple Interest' },
];

const DURATION_PERIODS = [
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
  { value: 'months', label: 'Months' },
  { value: 'years', label: 'Years' },
];

export const LoanEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [loan, setLoan] = useState<LoanApplication | null>(null);
  const [formData, setFormData] = useState<LoanFormData>({
    loan_number: '',
    borrower_id: 0,
    loan_type_id: 0,
    principal_amount: '',
    loan_status: 'pending-approval',
    purpose: '',
    collateral: '',
    interest_amount: '',
    interest_method: 'FLAT',
    loan_duration: 12,
    duration_period: 'months',
    loan_release_date: null,
    loan_due_date: '',
    repayment_amount: '',
    balance: '',
    monthly_payment: '',
    arrears_amount: '0.00',
    days_in_arrears: 0,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) {
      fetchLoanData();
    }
  }, [id]);

  const fetchLoanData = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.get(`/loan-applications/${id}`);
      const loanData = response.data || response;
      
      setLoan(loanData);
      setFormData({
        loan_number: loanData.loan_number,
        borrower_id: loanData.borrower_id,
        loan_type_id: loanData.loan_type_id,
        principal_amount: loanData.principal_amount,
        loan_status: loanData.loan_status,
        purpose: loanData.purpose,
        collateral: loanData.collateral,
        interest_amount: loanData.interest_amount,
        interest_method: loanData.interest_method,
        loan_duration: loanData.loan_duration,
        duration_period: loanData.duration_period,
        loan_release_date: loanData.loan_release_date,
        loan_due_date: loanData.loan_due_date?.split('T')[0] || '',
        repayment_amount: loanData.repayment_amount,
        balance: loanData.balance,
        monthly_payment: loanData.monthly_payment,
        arrears_amount: loanData.arrears_amount,
        days_in_arrears: loanData.days_in_arrears,
      });
    } catch (error: any) {
      console.error('Failed to fetch loan:', error);
      toast.error('Failed to load loan details, Please try again.');
      navigate('/loans');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof LoanFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.purpose.trim()) {
      newErrors.purpose = 'Purpose is required';
    }
    if (!formData.collateral.trim()) {
      newErrors.collateral = 'Collateral is required';
    }
    if (parseFloat(formData.principal_amount) <= 0) {
      newErrors.principal_amount = 'Principal amount must be greater than 0';
    }
    if (formData.loan_duration <= 0) {
      newErrors.loan_duration = 'Loan duration must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      setIsSaving(true);
      
      const updateData = {
        ...formData,
        loan_due_date: formData.loan_due_date ? new Date(formData.loan_due_date).toISOString() : null,
      };

      await apiService.put(`/loan-applications/${id}`, updateData);
      
      toast.success('Loan updated successfully');
      navigate('/loans');
    } catch (error: any) {
      console.error('Failed to update loan:', error);
      toast.error('Failed to update loan. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'pending-approval': 'bg-yellow-500',
      'approved': 'bg-blue-500',
      'disbursed': 'bg-green-500',
      'active': 'bg-green-600',
      'rejected': 'bg-red-500',
      'completed': 'bg-gray-500',
      'defaulted': 'bg-red-700',
    };
    
    return (
      <Badge className={`${colors[status] || 'bg-gray-400'} text-white`}>
        {status.replace('-', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading loan details...</p>
        </div>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2">Loan not found</p>
          <Button onClick={() => navigate('/loans')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Loans
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      {/* Header */}

      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate('/loans')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Loans
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Edit Loan Application</h1>
          <p className="text-muted-foreground mt-1">
            Loan Number: <span className="font-mono font-semibold">{loan.loan_number}</span>
          </p>
        </div>
        <div>
          {getStatusBadge(formData.loan_status)}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Borrower Information Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Borrower Information</CardTitle>
              <CardDescription>Read-only borrower details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Full Name</Label>
                <p className="font-medium">{loan.borrower.full_name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Phone</Label>
                <p className="font-medium">{loan.borrower.phone}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">ID Number</Label>
                <p className="font-medium">{loan.borrower.id_number}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Loan Type</Label>
                <p className="font-medium">{loan.loan_type.loanType}</p>
                <p className="text-xs text-muted-foreground">{loan.loan_type.loanCode}</p>
              </div>
            </CardContent>
          </Card>

          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Loan Status */}
            <Card>
              <CardHeader>
                <CardTitle>Loan Status</CardTitle>
                <CardDescription>Update the loan status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="loan_status">Status</Label>
                  <Select
                    value={formData.loan_status}
                    onValueChange={(value) => handleInputChange('loan_status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LOAN_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Loan Details */}
            <Card>
              <CardHeader>
                <CardTitle>Loan Details</CardTitle>
                <CardDescription>Update loan information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="purpose">Purpose *</Label>
                    <Input
                      id="purpose"
                      value={formData.purpose}
                      onChange={(e) => handleInputChange('purpose', e.target.value)}
                      placeholder="e.g., Business expansion"
                      className={errors.purpose ? 'border-red-500' : ''}
                    />
                    {errors.purpose && (
                      <p className="text-xs text-red-500">{errors.purpose}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="collateral">Collateral *</Label>
                    <Input
                      id="collateral"
                      value={formData.collateral}
                      onChange={(e) => handleInputChange('collateral', e.target.value)}
                      placeholder="e.g., Motor vehicle"
                      className={errors.collateral ? 'border-red-500' : ''}
                    />
                    {errors.collateral && (
                      <p className="text-xs text-red-500">{errors.collateral}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Details */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Details</CardTitle>
                <CardDescription>Update amounts and rates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="principal_amount">Principal Amount *</Label>
                    <Input
                      id="principal_amount"
                      type="number"
                      step="0.01"
                      value={formData.principal_amount}
                      onChange={(e) => handleInputChange('principal_amount', e.target.value)}
                      className={errors.principal_amount ? 'border-red-500' : ''}
                    />
                    {errors.principal_amount && (
                      <p className="text-xs text-red-500">{errors.principal_amount}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interest_amount">Interest Amount</Label>
                    <Input
                      id="interest_amount"
                      type="number"
                      step="0.01"
                      value={formData.interest_amount}
                      onChange={(e) => handleInputChange('interest_amount', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interest_method">Interest Method</Label>
                    <Select
                      value={formData.interest_method}
                      onValueChange={(value) => handleInputChange('interest_method', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INTEREST_METHODS.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="repayment_amount">Total Repayment</Label>
                    <Input
                      id="repayment_amount"
                      type="number"
                      step="0.01"
                      value={formData.repayment_amount}
                      onChange={(e) => handleInputChange('repayment_amount', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="balance">Current Balance</Label>
                    <Input
                      id="balance"
                      type="number"
                      step="0.01"
                      value={formData.balance}
                      onChange={(e) => handleInputChange('balance', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="monthly_payment">Monthly Payment</Label>
                    <Input
                      id="monthly_payment"
                      type="number"
                      step="0.01"
                      value={formData.monthly_payment}
                      onChange={(e) => handleInputChange('monthly_payment', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Duration & Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Duration & Timeline</CardTitle>
                <CardDescription>Update loan duration and dates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="loan_duration">Loan Duration *</Label>
                    <Input
                      id="loan_duration"
                      type="number"
                      value={formData.loan_duration}
                      onChange={(e) => handleInputChange('loan_duration', parseInt(e.target.value))}
                      className={errors.loan_duration ? 'border-red-500' : ''}
                    />
                    {errors.loan_duration && (
                      <p className="text-xs text-red-500">{errors.loan_duration}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration_period">Period</Label>
                    <Select
                      value={formData.duration_period}
                      onValueChange={(value) => handleInputChange('duration_period', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATION_PERIODS.map((period) => (
                          <SelectItem key={period.value} value={period.value}>
                            {period.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="loan_due_date">Due Date</Label>
                    <Input
                      id="loan_due_date"
                      type="date"
                      value={formData.loan_due_date}
                      onChange={(e) => handleInputChange('loan_due_date', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="loan_release_date">Release Date</Label>
                    <Input
                      id="loan_release_date"
                      type="date"
                      value={formData.loan_release_date || ''}
                      onChange={(e) => handleInputChange('loan_release_date', e.target.value || null)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Arrears Information */}
            <Card>
              <CardHeader>
                <CardTitle>Arrears Information</CardTitle>
                <CardDescription>Update arrears details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="arrears_amount">Arrears Amount</Label>
                    <Input
                      id="arrears_amount"
                      type="number"
                      step="0.01"
                      value={formData.arrears_amount}
                      onChange={(e) => handleInputChange('arrears_amount', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="days_in_arrears">Days in Arrears</Label>
                    <Input
                      id="days_in_arrears"
                      type="number"
                      value={formData.days_in_arrears}
                      onChange={(e) => handleInputChange('days_in_arrears', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/loans')}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};