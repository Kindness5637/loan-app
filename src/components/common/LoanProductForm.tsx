import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, DollarSign, Calendar, Shield, TrendingUp, Loader2 } from 'lucide-react';

const loanProductSchema = z.object({
  loanType: z.string().min(2, 'Loan type is required'),
  interest_rate: z.number().min(0, 'Interest rate must be positive').max(100, 'Interest rate cannot exceed 100%'),
  repaymentMethod: z.enum(['FLAT', 'REDUCING_BALANCE']),
  repayPeriod: z.number().min(1, 'Repayment period must be at least 1 month').max(120, 'Cannot exceed 120 months'),
  minLoan: z.number().min(1, 'Minimum loan must be at least 1'),
  maxLoan: z.number().min(1, 'Maximum loan must be at least 1'),
  requiresConsecutiveSavings: z.boolean(),
  consecutiveSavingsMonths: z.number().min(0).optional(),
  minimumSavings: z.number().min(0).optional(),
  requiresGuarantors: z.boolean(),
  requiredGuaranties: z.number().min(0).max(100).optional(),
  requiresCollateral: z.boolean(),
  attractsPenalty: z.boolean(),
  penaltyRate: z.number().min(0).max(100).optional(),
  requiresCrbCertificate: z.boolean(),
  crbPoints: z.number().min(0).optional(),
  loanFormCost: z.number().min(0, 'Loan form cost cannot be negative'),
}).refine((data) => data.maxLoan >= data.minLoan, {
  message: 'Maximum loan must be greater than or equal to minimum loan',
  path: ['maxLoan'],
});

type LoanProductFormData = z.infer<typeof loanProductSchema>;

interface LoanProductFormProps {
  defaultValues?: Partial<LoanProductFormData>;
  onSubmit: (data: LoanProductFormData) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  submittingLabel?: string;
  onCancel?: () => void;
  cancelLabel?: string;
}

const LoanProductForm: React.FC<LoanProductFormProps> = ({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Create Loan Product',
  submittingLabel = 'Creating Loan Product...',
  onCancel,
  cancelLabel = 'Cancel',
}) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LoanProductFormData>({
    resolver: zodResolver(loanProductSchema),
    defaultValues,
  });

  const requiresSavings = watch("requiresConsecutiveSavings");
  const requiresGuarantors = watch("requiresGuarantors");
  const attractsPenalty = watch("attractsPenalty");
  const requiresCrb = watch("requiresCrbCertificate");

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Loan Product Configuration
          </CardTitle>
          <CardDescription>
            Configure the basic loan product details and financial parameters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <DollarSign className="h-3 w-3" />
                  Basic Information
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Loan Type */}
                <div className="space-y-2">
                  <Label htmlFor="loanType">Loan Type *</Label>
                  <Input
                    id="loanType"
                    {...register('loanType')}
                    placeholder="e.g., Emergency Loan, Business Loan"
                    disabled={isSubmitting}
                  />
                  {errors.loanType && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.loanType.message}
                    </p>
                  )}
                </div>

                {/* Interest Rate */}
                <div className="space-y-2">
                  <Label htmlFor="interest_rate">Annual Interest Rate (%) *</Label>
                  <Input
                    id="interest_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    {...register('interest_rate', { valueAsNumber: true })}
                    placeholder="e.g., 12.50"
                    disabled={isSubmitting}
                  />
                  {errors.interest_rate && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.interest_rate.message}
                    </p>
                  )}
                </div>

                {/* Repayment Method */}
                <div className="space-y-2">
                  <Label htmlFor="repaymentMethod">Repayment Method *</Label>
                  <Select
                    value={watch('repaymentMethod') || ''}
                    onValueChange={(value) => setValue('repaymentMethod', value as 'FLAT' | 'REDUCING_BALANCE')}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select repayment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FLAT">Flat Rate</SelectItem>
                      <SelectItem value="REDUCING_BALANCE">Reducing Balance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Repayment Period */}
                <div className="space-y-2">
                  <Label htmlFor="repayPeriod" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Repayment Period (months) *
                  </Label>
                  <Input
                    id="repayPeriod"
                    type="number"
                    min="1"
                    max="120"
                    {...register('repayPeriod', { valueAsNumber: true })}
                    placeholder="e.g., 12"
                    disabled={isSubmitting}
                  />
                  {errors.repayPeriod && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.repayPeriod.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Loan Amount Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <DollarSign className="h-3 w-3" />
                  Loan Amount Limits
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Min Loan */}
                <div className="space-y-2">
                  <Label htmlFor="minLoan">Minimum Loan Amount *</Label>
                  <Input
                    id="minLoan"
                    type="number"
                    min="1"
                    {...register('minLoan', { valueAsNumber: true })}
                    placeholder="e.g., 5,000"
                    disabled={isSubmitting}
                  />
                  {errors.minLoan && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.minLoan.message}
                    </p>
                  )}
                </div>

                {/* Max Loan */}
                <div className="space-y-2">
                  <Label htmlFor="maxLoan">Maximum Loan Amount *</Label>
                  <Input
                    id="maxLoan"
                    type="number"
                    min="1"
                    {...register('maxLoan', { valueAsNumber: true })}
                    placeholder="e.g., 500,000"
                    disabled={isSubmitting}
                  />
                  {errors.maxLoan && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.maxLoan.message}
                    </p>
                  )}
                </div>

                {/* Loan Form Cost */}
                <div className="space-y-2">
                  <Label htmlFor="loanFormCost">Application Fee *</Label>
                  <Input
                    id="loanFormCost"
                    type="number"
                    min="0"
                    {...register('loanFormCost', { valueAsNumber: true })}
                    placeholder="e.g., 200"
                    disabled={isSubmitting}
                  />
                  {errors.loanFormCost && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.loanFormCost.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Requirements Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <Shield className="h-3 w-3" />
                  Loan Requirements
                </Badge>
              </div>

              {/* Savings Requirements */}
              <Card className="border-dashed">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="requiresConsecutiveSavings"
                      checked={requiresSavings}
                      onCheckedChange={(checked) => setValue('requiresConsecutiveSavings', !!checked)}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="requiresConsecutiveSavings" className="font-medium">
                      Requires Consecutive Savings History
                    </Label>
                  </div>
                </CardHeader>
                {requiresSavings && (
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="consecutiveSavingsMonths">Required Months</Label>
                        <Input
                          id="consecutiveSavingsMonths"
                          type="number"
                          min="1"
                          {...register('consecutiveSavingsMonths', { valueAsNumber: true })}
                          placeholder="e.g., 6"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="minimumSavings">Minimum Savings Amount</Label>
                        <Input
                          id="minimumSavings"
                          type="number"
                          min="0"
                          {...register('minimumSavings', { valueAsNumber: true })}
                          placeholder="e.g., 1,000"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Guarantor Requirements */}
              <Card className="border-dashed">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="requiresGuarantors"
                      checked={requiresGuarantors}
                      onCheckedChange={(checked) => setValue('requiresGuarantors', !!checked)}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="requiresGuarantors" className="font-medium">
                      Requires Guarantors
                    </Label>
                  </div>
                </CardHeader>
                {requiresGuarantors && (
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <Label htmlFor="requiredGuaranties">Required Guarantee Percentage (%)</Label>
                      <Input
                        id="requiredGuaranties"
                        type="number"
                        min="0"
                        max="100"
                        {...register('requiredGuaranties', { valueAsNumber: true })}
                        placeholder="e.g., 50"
                        disabled={isSubmitting}
                      />
                      {errors.requiredGuaranties && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.requiredGuaranties.message}
                        </p>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Other Requirements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Collateral */}
                <Card className="border-dashed">
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="requiresCollateral"
                        checked={watch('requiresCollateral')}
                        onCheckedChange={(checked) => setValue('requiresCollateral', !!checked)}
                        disabled={isSubmitting}
                      />
                      <Label htmlFor="requiresCollateral" className="font-medium">
                        Requires Collateral
                      </Label>
                    </div>
                  </CardHeader>
                </Card>

                {/* Penalty */}
                <Card className="border-dashed">
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="attractsPenalty"
                        checked={attractsPenalty}
                        onCheckedChange={(checked) => setValue('attractsPenalty', !!checked)}
                        disabled={isSubmitting}
                      />
                      <Label htmlFor="attractsPenalty" className="font-medium">
                        Attracts Late Payment Penalty
                      </Label>
                    </div>
                  </CardHeader>
                  {attractsPenalty && (
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <Label htmlFor="penaltyRate">Penalty Rate (% per month)</Label>
                        <Input
                          id="penaltyRate"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          {...register('penaltyRate', { valueAsNumber: true })}
                          placeholder="e.g., 2.5"
                          disabled={isSubmitting}
                        />
                        {errors.penaltyRate && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.penaltyRate.message}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              </div>

              {/* CRB Certificate */}
              <Card className="border-dashed">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="requiresCrbCertificate"
                      checked={requiresCrb}
                      onCheckedChange={(checked) => setValue('requiresCrbCertificate', !!checked)}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="requiresCrbCertificate" className="font-medium">
                      Requires CRB Certificate
                    </Label>
                  </div>
                </CardHeader>
                {requiresCrb && (
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <Label htmlFor="crbPoints">Minimum CRB Points Required</Label>
                      <Input
                        id="crbPoints"
                        type="number"
                        min="0"
                        {...register('crbPoints', { valueAsNumber: true })}
                        placeholder="e.g., 100"
                        disabled={isSubmitting}
                      />
                      {errors.crbPoints && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.crbPoints.message}
                        </p>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>

            {/* Actions */}
            <div className="pt-6">
              {onCancel ? (
                <div className="flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                  >
                    {cancelLabel}
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {submittingLabel}
                      </>
                    ) : (
                      submitLabel
                    )}
                  </Button>
                </div>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {submittingLabel}
                    </>
                  ) : (
                    submitLabel
                  )}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoanProductForm;
