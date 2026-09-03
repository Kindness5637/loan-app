import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/hooks/use-auth"
import { formatCurrency } from "@/lib/utils"
import { FileText, Calculator, Upload, CheckCircle, DollarSign, ArrowRight, ArrowLeft } from "lucide-react"

export function ApplyLoan() {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    loanAmount: "",
    loanPurpose: "",
    loanTerm: "",
    repaymentFrequency: "monthly",
    collateralType: "",
    collateralValue: "",
    additionalInfo: "",
    documents: [],
    agreedToTerms: false,
  })

  if (!user) return null

  const totalSteps = 4
  const progress = (currentStep / totalSteps) * 100

  // Calculate loan details
  const calculateLoanDetails = () => {
    const principal = Number.parseFloat(formData.loanAmount) || 0
    const interestRate = 12 // 12% annual rate
    const termMonths = Number.parseInt(formData.loanTerm) || 12

    const monthlyRate = interestRate / 100 / 12
    const monthlyPayment =
      (principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths))) / (Math.pow(1 + monthlyRate, termMonths) - 1)

    const totalAmount = monthlyPayment * termMonths
    const totalInterest = totalAmount - principal

    return {
      monthlyPayment: isNaN(monthlyPayment) ? 0 : monthlyPayment,
      totalAmount: isNaN(totalAmount) ? 0 : totalAmount,
      totalInterest: isNaN(totalInterest) ? 0 : totalInterest,
      interestRate,
    }
  }

  const loanDetails = calculateLoanDetails()

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = () => {
    console.log("Submitting loan application:", formData)
    // Here you would submit to backend
  }

  const StepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Apply for Loan</h2>
        <Badge variant="secondary">
          Step {currentStep} of {totalSteps}
        </Badge>
      </div>
      <Progress value={progress} className="h-2" />
      <div className="flex justify-between mt-2 text-sm text-muted-foreground">
        <span className={currentStep >= 1 ? "text-primary font-medium" : ""}>Loan Details</span>
        <span className={currentStep >= 2 ? "text-primary font-medium" : ""}>Collateral</span>
        <span className={currentStep >= 3 ? "text-primary font-medium" : ""}>Documents</span>
        <span className={currentStep >= 4 ? "text-primary font-medium" : ""}>Review</span>
      </div>
    </div>
  )

  const Step1LoanDetails = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Loan Details
        </CardTitle>
        <CardDescription>Specify your loan requirements</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="loanAmount">Loan Amount (KES)</Label>
            <Input
              id="loanAmount"
              type="number"
              placeholder="e.g., 100000"
              value={formData.loanAmount}
              onChange={(e) => setFormData({ ...formData, loanAmount: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="loanTerm">Loan Term (Months)</Label>
            <Select value={formData.loanTerm} onValueChange={(value) => setFormData({ ...formData, loanTerm: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6 Months</SelectItem>
                <SelectItem value="12">12 Months</SelectItem>
                <SelectItem value="18">18 Months</SelectItem>
                <SelectItem value="24">24 Months</SelectItem>
                <SelectItem value="36">36 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="loanPurpose">Loan Purpose</Label>
          <Select
            value={formData.loanPurpose}
            onValueChange={(value) => setFormData({ ...formData, loanPurpose: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select purpose" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="business_expansion">Business Expansion</SelectItem>
              <SelectItem value="working_capital">Working Capital</SelectItem>
              <SelectItem value="equipment_purchase">Equipment Purchase</SelectItem>
              <SelectItem value="personal_use">Personal Use</SelectItem>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="medical">Medical Expenses</SelectItem>
              <SelectItem value="home_improvement">Home Improvement</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="repaymentFrequency">Repayment Frequency</Label>
          <Select
            value={formData.repaymentFrequency}
            onValueChange={(value) => setFormData({ ...formData, repaymentFrequency: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loan Calculator */}
        {formData.loanAmount && formData.loanTerm && (
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Loan Calculator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Principal Amount:</span>
                    <span className="font-medium">{formatCurrency(Number.parseFloat(formData.loanAmount) || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Interest Rate:</span>
                    <span className="font-medium">{loanDetails.interestRate}% per annum</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Loan Term:</span>
                    <span className="font-medium">{formData.loanTerm} months</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Monthly Payment:</span>
                    <span className="font-semibold text-primary">{formatCurrency(loanDetails.monthlyPayment)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Interest:</span>
                    <span className="font-medium">{formatCurrency(loanDetails.totalInterest)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Amount:</span>
                    <span className="font-semibold">{formatCurrency(loanDetails.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )

  const Step2Collateral = () => (
    <Card>
      <CardHeader>
        <CardTitle>Collateral Information</CardTitle>
        <CardDescription>Provide details about collateral (if applicable)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="collateralType">Collateral Type</Label>
          <Select
            value={formData.collateralType}
            onValueChange={(value) => setFormData({ ...formData, collateralType: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select collateral type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Collateral</SelectItem>
              <SelectItem value="property">Real Estate/Property</SelectItem>
              <SelectItem value="vehicle">Vehicle</SelectItem>
              <SelectItem value="equipment">Business Equipment</SelectItem>
              <SelectItem value="savings">Savings Account</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.collateralType && formData.collateralType !== "none" && (
          <div>
            <Label htmlFor="collateralValue">Estimated Collateral Value (KES)</Label>
            <Input
              id="collateralValue"
              type="number"
              placeholder="e.g., 500000"
              value={formData.collateralValue}
              onChange={(e) => setFormData({ ...formData, collateralValue: e.target.value })}
            />
          </div>
        )}

        <div>
          <Label htmlFor="additionalInfo">Additional Information</Label>
          <Textarea
            id="additionalInfo"
            placeholder="Provide any additional information about your loan application..."
            value={formData.additionalInfo}
            onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
          />
        </div>
      </CardContent>
    </Card>
  )

  const Step3Documents = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Required Documents
        </CardTitle>
        <CardDescription>Upload the required documents for your loan application</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          {[
            { name: "Recent Payslips (3 months)", required: true },
            { name: "Bank Statements (6 months)", required: true },
            { name: "Copy of National ID/Passport", required: true },
            { name: "Proof of Residence", required: true },
            { name: "Business Registration (if applicable)", required: false },
            { name: "Tax Compliance Certificate", required: false },
          ].map((doc, index) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">{doc.name}</h4>
                  <p className="text-sm text-muted-foreground">{doc.required ? "Required" : "Optional"}</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
          ))}
        </div>

        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Document Requirements:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• All documents must be clear and legible</li>
            <li>• Accepted formats: PDF, JPG, PNG (max 5MB each)</li>
            <li>• Bank statements must show salary deposits</li>
            <li>• Documents should be recent (within last 3 months)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )

  const Step4Review = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Application Review
          </CardTitle>
          <CardDescription>Review your loan application before submission</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Loan Summary */}
          <div>
            <h3 className="font-semibold mb-3">Loan Summary</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Loan Amount:</span>
                <span className="font-medium">{formatCurrency(Number.parseFloat(formData.loanAmount) || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Loan Term:</span>
                <span className="font-medium">{formData.loanTerm} months</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Purpose:</span>
                <span className="font-medium">{formData.loanPurpose?.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly Payment:</span>
                <span className="font-medium text-primary">{formatCurrency(loanDetails.monthlyPayment)}</span>
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Terms and Conditions</h3>
            <ul className="bg-muted/50 p-4 rounded-lg text-sm space-y-2">
              <li>Interest rate: {loanDetails.interestRate}% per annum</li>
              <li>Processing fee: 2% of loan amount</li>
              <li>Late payment penalty: 5% of overdue amount</li>
              <li>Loan approval is subject to credit assessment</li>
              <li>All information provided must be accurate and verifiable</li>
            </ul>
          </div>

          {/* Agreement */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={formData.agreedToTerms}
              onCheckedChange={(checked) => setFormData({ ...formData, agreedToTerms: Boolean(checked) })}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I agree to the terms and conditions
              </Label>
              <p className="text-xs text-muted-foreground">
                By checking this box, I confirm that all information provided is accurate and I agree to the loan terms.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      <StepIndicator />

      {currentStep === 1 && <Step1LoanDetails />}
      {currentStep === 2 && <Step2Collateral />}
      {currentStep === 3 && <Step3Documents />}
      {currentStep === 4 && <Step4Review />}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        {currentStep < totalSteps ? (
          <Button onClick={nextStep}>
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={!formData.agreedToTerms}>
            Submit Application
          </Button>
        )}
      </div>
    </div>
  )
}
