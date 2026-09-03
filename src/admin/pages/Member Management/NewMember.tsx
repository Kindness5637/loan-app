import React, { useState, useEffect, useCallback } from "react";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  AlertCircle,
  UserPlus,
} from "lucide-react";
import { apiService } from "@/services/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
// import { toastUtils } from '@/utils/toastUtils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { DocumentUploads, DOCUMENT_TYPES } from "./NewMemberDocuments";
import { AgentDetails } from "./AgentDetails";
import type { AgentInfo } from "@/types/user.types";

// Type definitions
type Gender = "m" | "f";
type MaritalStatus = "single" | "married" | "divorced" | "widowed";
type EmploymentType = "permanent" | "contract" | "casual";
type ContributionMode = "m" | "q" | "a";
type PaymentMode = "m" | "c" | "b" | "o";

interface PersonalInfo {
  full_name: string;
  dob: string;
  gender: Gender;
  marital_status: MaritalStatus;
  id_number: string;
}

interface ContactInfo {
  email: string;
  phone: string;
  phone2?: string;
  address: string;
  address2?: string;
  apartment_name?: string;
  postal_address: string;
  kra_pin: string;
  nationality: string;
}

interface EmploymentInfo {
  occupation: string;
  employer_name: string;
  employer_address: string;
  employer_phone: string;
  employer_phone_2?: string;
  position: string;
  employment_type: EmploymentType;
  monthly_income: string;
  others_income?: string;
  monthly_expenses: string;
  bank_name: string;
  bank_branch: string;
  bank_account_number: string;
  mode_of_contribution: ContributionMode;
  payment_mode: PaymentMode;
}

interface NextOfKinInfo {
  nok_full_name: string;
  nok_relation: string;
  nok_phone: string;
  nok_email?: string;
  nok_address: string;
}

interface DocumentInfo {
  national_id?: FileList;
  proof_of_address?: FileList;
  passport_photo?: FileList;
  payslip?: FileList;
  bank_statement?: FileList;
  tax_certificate?: FileList;
  passport?: FileList;
  business_registration?: FileList;
}

// Individual step data types
// type PersonalInfoData = PersonalInfo;
// type ContactInfoData = ContactInfo;
// type EmploymentInfoData = EmploymentInfo;
// type NextOfKinInfoData = NextOfKinInfo;

// Complete form data type
type StepData = PersonalInfo &
  ContactInfo &
  EmploymentInfo &
  NextOfKinInfo &
  Partial<DocumentInfo>;

interface FormDataState {
  [key: number]: Partial<StepData>;
}

interface ApiMemberData {
  full_name: string;
  gender: Gender;
  dob: string;
  id_number: string;
  marital_status: MaritalStatus;
  phone: string;
  phone2: string | null;
  email: string;
  address: string;
  address2: string | null;
  apartment_name: string | null;
  postal_address: string;
  kra_pin: string;
  nationality: string;
  occupation: string;
  employer_name: string;
  employer_address: string;
  employer_phone: string;
  employer_phone_2: string | null;
  position: string;
  employment_type: EmploymentType;
  monthly_income: number;
  others_income: number;
  monthly_expenses: number;
  bank_name: string;
  bank_branch: string;
  bank_account_number: string;
  mode_of_contribution: ContributionMode;
  payment_mode: PaymentMode;
  nok_full_name: string;
  nok_relation: string;
  nok_phone: string;
  nok_email: string | null;
  nok_address: string;
  national_id?: string;
  proof_of_address?: string;
  passport_photo?: string;
  payslip?: string;
  bank_statement?: string;
  tax_certificate?: string;
  agents?: AgentInfo[];
}

// interface ApiErrorResponse {
//   message?: string;
//   error?: string;
//   errors?: Record<string, string | string[]>;
// }

// interface ApiError extends Error {
//   response?: {
//     status: number;
//     data: ApiErrorResponse;
//   };
// }

interface Step {
  title: string;
  schema: z.ZodSchema<any>;
}

// Helper function to extract error message
const getErrorMessage = (error: any): string => {
  return error?.message?.toString() || "This field is required";
};

// Helper function to sanitize form data before API submission
const sanitizeFormData = (
  data: Record<string, unknown>,
): Record<string, unknown> => {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      sanitized[key] = trimmed === "" ? null : trimmed;
    } else if (typeof value === "number") {
      sanitized[key] = value;
    } else if (value === null || value === undefined) {
      sanitized[key] = null;
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

// Helper function to parse numeric fields safely
const parseNumericField = (
  value: string | number | null | undefined,
): number => {
  if (value === null || value === undefined || value === "") {
    return 0;
  }
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? 0 : parsed;
};

// Enhanced validation schemas
const personalInfoSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  dob: z
    .string()
    .min(1, "Date of birth is required")
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 18 && age <= 100;
    }, "Member must be between 18 and 100 years old"),
  gender: z.enum(["m", "f"], {
    errorMap: () => ({ message: "Please select gender" }),
  }),
  marital_status: z.enum(["single", "married", "divorced", "widowed"], {
    errorMap: () => ({ message: "Please select marital status" }),
  }),
  id_number: z
    .string()
    .min(6, "ID number must be at least 6 characters")
    .max(10, "ID number must not exceed 10 characters"),
});

const contactInfoSchema = z.object({
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .regex(
      /^(07|01)\d{8}$/,
      "Phone must be valid Kenyan format (07XXXXXXXX or 01XXXXXXXX)",
    ),
  phone2: z
    .string()
    .regex(/^(07|01)\d{8}$/, "Phone must be valid Kenyan format")
    .optional()
    .or(z.literal("")),
  address: z.string().min(5, "Address is required"),
  address2: z.string().optional(),
  apartment_name: z.string().optional(),
  postal_address: z
    .string()
    .min(5, "Postal address is required")
    .regex(/P\.?O\.?\s*Box/i, "Must include P.O Box format"),
  kra_pin: z
    .string()
    .regex(/^[A-Z]\d{9}[A-Z]$/, "KRA PIN must be in format: A000000000Z"),
  nationality: z.string().min(2, "Nationality is required"),
});

const employmentInfoSchema = z.object({
  occupation: z.string().min(2, "Occupation is required"),
  employer_name: z.string().min(2, "Employer name is required"),
  employer_address: z.string().min(5, "Employer address is required"),
  employer_phone: z
    .string()
    .regex(/^(07|01)\d{8}$/, "Phone must be valid Kenyan format"),
  employer_phone_2: z
    .string()
    .regex(/^(07|01)\d{8}$/, "Phone must be valid Kenyan format")
    .optional()
    .or(z.literal("")),
  position: z.string().min(2, "Position is required"),
  employment_type: z.enum(["permanent", "contract", "casual"], {
    errorMap: () => ({ message: "Please select employment type" }),
  }),
  monthly_income: z
    .string()
    .min(1, "Monthly income is required")
    .refine(
      (val) => parseFloat(val) >= 10000,
      "Monthly income must be at least KES 10,000",
    ),
  others_income: z.string().optional(),
  monthly_expenses: z
    .string()
    .min(1, "Monthly expenses is required")
    .refine(
      (val) => parseFloat(val) >= 0,
      "Monthly expenses cannot be negative",
    ),
  bank_name: z.string().min(2, "Bank name is required"),
  bank_branch: z.string().min(2, "Bank branch is required"),
  bank_account_number: z
    .string()
    .min(10, "Account number must be at least 10 digits")
    .max(16, "Account number must not exceed 16 digits"),
  mode_of_contribution: z.enum(["m", "q", "a"], {
    errorMap: () => ({ message: "Please select contribution mode" }),
  }),
  payment_mode: z.enum(["m", "c", "b", "o"], {
    errorMap: () => ({ message: "Please select payment mode" }),
  }),
});

const nextOfKinSchema = z.object({
  nok_full_name: z.string().min(2, "Next of kin full name is required"),
  nok_relation: z.string().min(2, "Relationship is required"),
  nok_phone: z
    .string()
    .regex(/^(07|01)\d{8}$/, "Phone must be valid Kenyan format"),
  nok_email: z.string().email("Invalid email").optional().or(z.literal("")),
  nok_address: z.string().min(5, "Address is required"),
});

  const agentSchema = z.object({
  agents: z.array(
    z.object({
      agent_name: z.string().min(2, "Agent name must be at least 2 characters"),
      agent_phone: z.string().regex(
        /^(07|01)\d{8}$/,
        "Phone must be valid Kenyan format (07XXXXXXXX or 01XXXXXXXX)"
      ),
      agent_id_number: z.string()
        .min(6, "ID number must be at least 6 characters")
        .max(10, "ID number must not exceed 10 characters"),
      agent_email: z.string().email("Invalid email address"),
    })
  ).optional().default([]),
});

const documentsSchema = z.object({
  // Conditional: Either national_id OR passport is required
national_id: z
  .instanceof(FileList)
  .refine((files) => {
    return files.length === 0 || files[0].size <= 5 * 1024 * 1024;
  }, "File must be less than 5MB")
  .optional(),
  
  passport: z
    .instanceof(FileList)
    .refine((files) => {
      return files.length === 0 || files[0].size <= 5 * 1024 * 1024;
    }, "File must be less than 5MB")
    .optional(),
  
  // Optional documents
  proof_of_address: z
    .instanceof(FileList)
    .refine(
      (files) => !files?.[0] || files[0].size <= 5 * 1024 * 1024,
      "File size must be less than 5MB"
    )
    .optional(),
  
  passport_photo: z
    .instanceof(FileList)
    .refine(
      (files) => !files?.[0] || files[0].size <= 2 * 1024 * 1024,
      "File size must be less than 2MB"
    )
    .optional(),
  
  payslip: z
    .instanceof(FileList)
    .refine(
      (files) => !files?.[0] || files[0].size <= 5 * 1024 * 1024,
      "File size must be less than 5MB"
    )
    .optional(),
  
  bank_statement: z
    .instanceof(FileList)
    .refine(
      (files) => !files?.[0] || files[0].size <= 5 * 1024 * 1024,
      "File size must be less than 5MB"
    )
    .optional(),
  
  business_registration: z
    .instanceof(FileList)
    .refine(
      (files) => !files?.[0] || files[0].size <= 5 * 1024 * 1024,
      "File size must be less than 5MB"
    )
    .optional(),
  
  tax_certificate: z
    .instanceof(FileList)
    .refine(
      (files) => !files?.[0] || files[0].size <= 5 * 1024 * 1024,
      "File size must be less than 5MB"
    )
    .optional(),
}).superRefine((data, ctx) => {
  // Validate that either national_id OR passport is provided
  const hasNationalId = data.national_id && data.national_id.length > 0;
  const hasPassport = data.passport && data.passport.length > 0;


  
  if (!hasNationalId && !hasPassport) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Either National ID or Passport is required",
      path: ["national_id"],
    });
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Either National ID or Passport is required",
      path: ["passport"],
    });
  }
  
  // Validate file sizes for required documents (if provided)
  if (hasNationalId && data.national_id?.[0]?.size && data.national_id[0].size > 5 * 1024 * 1024) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "File size must be less than 5MB",
      path: ["national_id"],
    });
  }
  
if (hasPassport && data.passport?.[0]?.size && data.passport[0].size > 5 * 1024 * 1024) {
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message: "File size must be less than 5MB",
    path: ["passport"],
  });
}
});

const steps: Step[] = [
  { title: "Personal Information", schema: personalInfoSchema },
  { title: "Contact Information", schema: contactInfoSchema },
  { title: "Employment & Financial", schema: employmentInfoSchema },
  { title: "Next of Kin", schema: nextOfKinSchema },
  { title: "Document Uploads", schema: documentsSchema },
  { title: "Agent Details", schema: agentSchema },
];

const LOCAL_STORAGE_KEY = 'loan_app_member_form_data';

const MultiStepMemberForm: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [formData, setFormData] = useState<FormDataState>(() => {
    // Load saved form data from localStorage on initial render
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    return savedData ? JSON.parse(savedData) : {};
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string>("");
  const [backendErrors, setBackendErrors] = useState<Record<string, string>>({});

  // Set breadcrumbs for this page
  useBreadcrumbs([
    { label: "Dashboard", href: "/" },
    { label: "Members", href: "/members" },
    { label: "New Member", icon: <UserPlus className="h-4 w-4" /> },
  ]);

  const formMethods = useForm<any>({
    resolver: zodResolver(steps[currentStep].schema),
    mode: "onChange",
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    watch,
    control,
    setValue,
    // setError,
    clearErrors,
  } = formMethods;

  useEffect(() => {
    const currentStepData = formData[currentStep];
    if (currentStepData) {
      Object.entries(currentStepData).forEach(([key, value]) => {
        setValue(key as any, value);
      });
    }
  }, [currentStep, formData, setValue]);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formData));
    } catch (error) {
      console.error('Error saving form data to localStorage:', error);
    }
  }, [formData]);

  const nextStep = async (): Promise<void> => {
    const isValid = await trigger();
    if (isValid) {
      const currentData = watch();
      const updatedFormData = { ...formData, [currentStep]: currentData };
      
      setFormData(updatedFormData);
      setCompletedSteps((prev) => new Set([...prev, currentStep]));

      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
        setApiError("");
        setBackendErrors({});
      }
    }
  };

  const prevStep = (): void => {
    if (currentStep > 0) {
      const currentData = watch();
      setFormData((prev) => ({ ...prev, [currentStep]: currentData }));
      setCurrentStep(currentStep - 1);
      setApiError("");
      setBackendErrors({});
    }
  };

// Clear saved form data from localStorage
  const clearSavedFormData = useCallback(() => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing saved form data:', error);
    }
  }, []);

  // Clear saved form data when component unmounts or on successful submission
  useEffect(() => {
    return () => {
      if (!isSubmitting) {
        clearSavedFormData();
      }
    };
  }, [isSubmitting, clearSavedFormData]);

// Fix the type declaration at the top
const onSubmit = async (data: StepData): Promise<void> => {
  setIsSubmitting(true);
  setApiError("");
  setBackendErrors({});
  clearErrors();

  const allFormData: FormDataState = { ...formData, [currentStep]: data };
  const [step0, step1, step2, step3, step4, step5] = [
    allFormData[0] as PersonalInfo,
    allFormData[1] as ContactInfo,
    allFormData[2] as EmploymentInfo,
    allFormData[3] as NextOfKinInfo,
    allFormData[4] as DocumentInfo,
    allFormData[5] as { agents?: AgentInfo[] }, // ✅ Fixed type
  ];

  const rawApiData: Partial<ApiMemberData> = {
    full_name: step0.full_name,
    gender: step0.gender,
    dob: step0.dob,
    id_number: step0.id_number,
    marital_status: step0.marital_status,
    phone: step1.phone,
    phone2: step1.phone2 || null,
    email: step1.email,
    address: step1.address,
    address2: step1.address2 || null,
    apartment_name: step1.apartment_name || null,
    postal_address: step1.postal_address,
    kra_pin: step1.kra_pin,
    nationality: step1.nationality,
    occupation: step2.occupation,
    employer_name: step2.employer_name,
    employer_address: step2.employer_address,
    employer_phone: step2.employer_phone,
    employer_phone_2: step2.employer_phone_2 || null,
    position: step2.position,
    employment_type: step2.employment_type,
    monthly_income: parseNumericField(step2.monthly_income),
    others_income: parseNumericField(step2.others_income),
    monthly_expenses: parseNumericField(step2.monthly_expenses),
    bank_name: step2.bank_name,
    bank_branch: step2.bank_branch,
    bank_account_number: step2.bank_account_number,
    mode_of_contribution: step2.mode_of_contribution,
    payment_mode: step2.payment_mode,
    nok_full_name: step3.nok_full_name,
    nok_relation: step3.nok_relation,
    nok_phone: step3.nok_phone,
    nok_email: step3.nok_email || null,
    nok_address: step3.nok_address,
  };

  const apiData = sanitizeFormData(rawApiData as Record<string, unknown>);

  // Create FormData for file uploads
  const submitFormData = new FormData();

  // Add all the member data fields
  Object.entries(apiData).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      submitFormData.append(key, value.toString());
    }
  });

  // Add document files
  if (step4) {
    DOCUMENT_TYPES.forEach((docType) => {
      const fileList = step4[docType.id as keyof DocumentInfo];
      if (fileList && fileList.length > 0 && fileList[0]) {
        submitFormData.append(docType.id, fileList[0]);
      }
    });
  }

  // ✅ Add agents as JSON array if they exist
  if (step5?.agents && Array.isArray(step5.agents) && step5.agents.length > 0) {
    submitFormData.append('agents', JSON.stringify(step5.agents));
  }

  try {
    console.log('📤 Submitting member data with documents and agents');
    
    // Log what's being sent
    console.log('Agents data:', step5?.agents);

    const response = await apiService.post("/members", submitFormData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("✅ Member created successfully:", response);

    toast.success("Member Registered Successfully!", {
      description: `${step0.full_name} has been added to the system.`,
      duration: 4000,
    });

    // Clear form data
    setFormData({});
    setCompletedSteps(new Set());
    setCurrentStep(0);
    setApiError("");
    setBackendErrors({});
    clearSavedFormData(); // ✅ Clear localStorage

    setTimeout(() => {
      navigate("/members");
    }, 1500);
  } catch (err) {
    console.error("❌ Error submitting member:", err);
    
    toast.error("Failed to create member", {
      description: "Please check your data and try again.",
    });
    
    setApiError("Failed to submit the form. Please try again.");
  } finally {
    setIsSubmitting(false);
  }
};
  const renderPersonalInfo = (): React.JSX.Element => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="full_name">Full Name *</Label>
        <Input
          id="full_name"
          {...register("full_name")}
          placeholder="Enter full name (e.g., John Kamau)"
        />
        {errors.full_name && (
          <p className="text-sm text-destructive">
            {getErrorMessage(errors.full_name)}
          </p>
        )}
        {backendErrors.full_name && (
          <p className="text-sm text-destructive">{backendErrors.full_name}</p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dob">
            Date of Birth *{" "}
            <span className="text-xs text-muted-foreground">(Must be 18+)</span>
          </Label>
          <Input
            id="dob"
            type="date"
            max={
              new Date(new Date().setFullYear(new Date().getFullYear() - 18))
                .toISOString()
                .split("T")[0]
            }
            {...register("dob")}
          />
          {errors.dob && (
            <p className="text-sm text-destructive">
              {getErrorMessage(errors.dob)}
            </p>
          )}
          {backendErrors.dob && (
            <p className="text-sm text-destructive">{backendErrors.dob}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Gender *</Label>
          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="m">Male</SelectItem>
                  <SelectItem value="f">Female</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.gender && (
            <p className="text-sm text-destructive">
              {getErrorMessage(errors.gender)}
            </p>
          )}
          {backendErrors.gender && (
            <p className="text-sm text-destructive">{backendErrors.gender}</p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="id_number">National ID/Passport Number *</Label>
          <Input
            id="id_number"
            {...register("id_number")}
            placeholder="Enter ID number (6-10 digits)"
          />
          {errors.id_number && (
            <p className="text-sm text-destructive">
              {getErrorMessage(errors.id_number)}
            </p>
          )}
          {backendErrors.id_number && (
            <p className="text-sm text-destructive">
              {backendErrors.id_number}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="marital_status">Marital Status *</Label>
          <Controller
            name="marital_status"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select marital status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married">Married</SelectItem>
                  <SelectItem value="divorced">Divorced</SelectItem>
                  <SelectItem value="widowed">Widowed</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.marital_status && (
            <p className="text-sm text-destructive">
              {getErrorMessage(errors.marital_status)}
            </p>
          )}
          {backendErrors.marital_status && (
            <p className="text-sm text-destructive">
              {backendErrors.marital_status}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderContactInfo = (): React.JSX.Element => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder="example@email.com"
          />
          {errors.email && (
            <p className="text-sm text-destructive">
              {getErrorMessage(errors.email)}
            </p>
          )}
          {backendErrors.email && (
            <p className="text-sm text-destructive">{backendErrors.email}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Mobile Phone Number *</Label>
          <Input id="phone" {...register("phone")} placeholder="0712345678" />
          {errors.phone && (
            <p className="text-sm text-destructive">
              {getErrorMessage(errors.phone)}
            </p>
          )}
          {backendErrors.phone && (
            <p className="text-sm text-destructive">{backendErrors.phone}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone2">Alternative Phone Number</Label>
        <Input
          id="phone2"
          {...register("phone2")}
          placeholder="0701234567 (optional)"
        />
        {errors.phone2 && (
          <p className="text-sm text-destructive">
            {getErrorMessage(errors.phone2)}
          </p>
        )}
        {backendErrors.phone2 && (
          <p className="text-sm text-destructive">{backendErrors.phone2}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Primary Address *</Label>
        <Textarea
          id="address"
          {...register("address")}
          rows={3}
          placeholder="Enter your physical address"
        />
        {errors.address && (
          <p className="text-sm text-destructive">
            {getErrorMessage(errors.address)}
          </p>
        )}
        {backendErrors.address && (
          <p className="text-sm text-destructive">{backendErrors.address}</p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="address2">Secondary Address</Label>
          <Input
            id="address2"
            {...register("address2")}
            placeholder="Optional"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="apartment_name">Apartment Name</Label>
          <Input
            id="apartment_name"
            {...register("apartment_name")}
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="postal_address">Postal Address *</Label>
        <Input
          id="postal_address"
          {...register("postal_address")}
          placeholder="P.O Box 12345-00100, Nairobi"
        />
        {errors.postal_address && (
          <p className="text-sm text-destructive">
            {getErrorMessage(errors.postal_address)}
          </p>
        )}
        {backendErrors.postal_address && (
          <p className="text-sm text-destructive">
            {backendErrors.postal_address}
          </p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="kra_pin">
            KRA PIN *{" "}
            <span className="text-xs text-muted-foreground">
              (Format: A000000000Z)
            </span>
          </Label>
          <Input
            id="kra_pin"
            {...register("kra_pin")}
            placeholder="A012345678Z"
          />
          {errors.kra_pin && (
            <p className="text-sm text-destructive">
              {getErrorMessage(errors.kra_pin)}
            </p>
          )}
          {backendErrors.kra_pin && (
            <p className="text-sm text-destructive">{backendErrors.kra_pin}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="nationality">Nationality *</Label>
          <Input
            id="nationality"
            {...register("nationality")}
            placeholder="e.g., Kenyan"
          />
          {errors.nationality && (
            <p className="text-sm text-destructive">
              {getErrorMessage(errors.nationality)}
            </p>
          )}
          {backendErrors.nationality && (
            <p className="text-sm text-destructive">
              {backendErrors.nationality}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderEmploymentInfo = (): React.JSX.Element => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="occupation">Occupation *</Label>
          <Input
            id="occupation"
            {...register("occupation")}
            placeholder="e.g., Software Engineer"
          />
          {errors.occupation && (
            <p className="text-sm text-destructive">
              {getErrorMessage(errors.occupation)}
            </p>
          )}
          {backendErrors.occupation && (
            <p className="text-sm text-destructive">
              {backendErrors.occupation}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="position">Position *</Label>
          <Input
            id="position"
            {...register("position")}
            placeholder="e.g., Senior Developer"
          />
          {errors.position && (
            <p className="text-sm text-destructive">
              {getErrorMessage(errors.position)}
            </p>
          )}
          {backendErrors.position && (
            <p className="text-sm text-destructive">{backendErrors.position}</p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="employer_name">Employer Name *</Label>
          <Input
            id="employer_name"
            {...register("employer_name")}
            placeholder="Company name"
          />
          {errors.employer_name && (
            <p className="text-sm text-destructive">
              {getErrorMessage(errors.employer_name)}
            </p>
          )}
          {backendErrors.employer_name && (
            <p className="text-sm text-destructive">
              {backendErrors.employer_name}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="employment_type">Employment Type *</Label>
          <Controller
            name="employment_type"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="permanent">Permanent</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.employment_type && (
            <p className="text-sm text-destructive">
              {getErrorMessage(errors.employment_type)}
            </p>
          )}
          {backendErrors.employment_type && (
            <p className="text-sm text-destructive">
              {backendErrors.employment_type}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="employer_address">Employer Address *</Label>
        <Textarea
          id="employer_address"
          {...register("employer_address")}
          rows={2}
          placeholder="Enter employer physical address"
        />
        {errors.employer_address && (
          <p className="text-sm text-destructive">
            {getErrorMessage(errors.employer_address)}
          </p>
        )}
        {backendErrors.employer_address && (
          <p className="text-sm text-destructive">
            {backendErrors.employer_address}
          </p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="employer_phone">Employer Phone *</Label>
          <Input
            id="employer_phone"
            {...register("employer_phone")}
            placeholder="0712345678"
          />
          {errors.employer_phone && (
            <p className="text-sm text-destructive">
              {getErrorMessage(errors.employer_phone)}
            </p>
          )}
          {backendErrors.employer_phone && (
            <p className="text-sm text-destructive">
              {backendErrors.employer_phone}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="employer_phone_2">Employer Phone 2</Label>
          <Input
            id="employer_phone_2"
            {...register("employer_phone_2")}
            placeholder="Optional"
          />
          {errors.employer_phone_2 && (
            <p className="text-sm text-destructive">
              {getErrorMessage(errors.employer_phone_2)}
            </p>
          )}
          {backendErrors.employer_phone_2 && (
            <p className="text-sm text-destructive">
              {backendErrors.employer_phone_2}
            </p>
          )}
        </div>
      </div>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">Financial Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthly_income">Monthly Income (KES) *</Label>
              <Input
                id="monthly_income"
                type="number"
                min="10000"
                {...register("monthly_income")}
                placeholder="Minimum 10,000"
              />
              {errors.monthly_income && (
                <p className="text-sm text-destructive">
                  {getErrorMessage(errors.monthly_income)}
                </p>
              )}
              {backendErrors.monthly_income && (
                <p className="text-sm text-destructive">
                  {backendErrors.monthly_income}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="others_income">Other Income (KES)</Label>
              <Input
                id="others_income"
                type="number"
                min="0"
                {...register("others_income")}
                placeholder="Optional"
              />
              {backendErrors.others_income && (
                <p className="text-sm text-destructive">
                  {backendErrors.others_income}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthly_expenses">Monthly Expenses (KES) *</Label>
              <Input
                id="monthly_expenses"
                type="number"
                min="0"
                {...register("monthly_expenses")}
                placeholder="Total expenses"
              />
              {errors.monthly_expenses && (
                <p className="text-sm text-destructive">
                  {getErrorMessage(errors.monthly_expenses)}
                </p>
              )}
              {backendErrors.monthly_expenses && (
                <p className="text-sm text-destructive">
                  {backendErrors.monthly_expenses}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">Banking Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bank_name">Bank Name *</Label>
              <Input
                id="bank_name"
                {...register("bank_name")}
                placeholder="e.g., Equity Bank"
              />
              {errors.bank_name && (
                <p className="text-sm text-destructive">
                  {getErrorMessage(errors.bank_name)}
                </p>
              )}
              {backendErrors.bank_name && (
                <p className="text-sm text-destructive">
                  {backendErrors.bank_name}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank_branch">Bank Branch *</Label>
              <Input
                id="bank_branch"
                {...register("bank_branch")}
                placeholder="Branch name"
              />
              {errors.bank_branch && (
                <p className="text-sm text-destructive">
                  {getErrorMessage(errors.bank_branch)}
                </p>
              )}
              {backendErrors.bank_branch && (
                <p className="text-sm text-destructive">
                  {backendErrors.bank_branch}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank_account_number">Account Number *</Label>
              <Input
                id="bank_account_number"
                {...register("bank_account_number")}
                placeholder="10-16 digits"
              />
              {errors.bank_account_number && (
                <p className="text-sm text-destructive">
                  {getErrorMessage(errors.bank_account_number)}
                </p>
              )}
              {backendErrors.bank_account_number && (
                <p className="text-sm text-destructive">
                  {backendErrors.bank_account_number}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="mode_of_contribution">Mode of Contribution *</Label>
          <Controller
            name="mode_of_contribution"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select contribution mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="m">Monthly</SelectItem>
                  <SelectItem value="q">Quarterly</SelectItem>
                  <SelectItem value="a">Annually</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.mode_of_contribution && (
            <p className="text-sm text-destructive">
              {getErrorMessage(errors.mode_of_contribution)}
            </p>
          )}
          {backendErrors.mode_of_contribution && (
            <p className="text-sm text-destructive">
              {backendErrors.mode_of_contribution}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="payment_mode">Payment Mode *</Label>
          <Controller
            name="payment_mode"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="m">Mobile Money</SelectItem>
                  <SelectItem value="c">Cash</SelectItem>
                  <SelectItem value="b">Bank Transfer</SelectItem>
                  <SelectItem value="o">Other</SelectItem>{" "}
                  {/* Changed from "" to "o" */}
                </SelectContent>
              </Select>
            )}
          />
          {errors.payment_mode && (
            <p className="text-sm text-destructive">
              {getErrorMessage(errors.payment_mode)}
            </p>
          )}
          {backendErrors.payment_mode && (
            <p className="text-sm text-destructive">
              {backendErrors.payment_mode}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderNextOfKin = (): React.JSX.Element => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="nok_full_name">Next of Kin - Full Name *</Label>
        <Input
          id="nok_full_name"
          {...register("nok_full_name")}
          placeholder="Enter next of kin full name"
        />
        {errors.nok_full_name && (
          <p className="text-sm text-destructive">
            {getErrorMessage(errors.nok_full_name)}
          </p>
        )}
        {backendErrors.nok_full_name && (
          <p className="text-sm text-destructive">
            {backendErrors.nok_full_name}
          </p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nok_relation">Relationship *</Label>
          <Input
            id="nok_relation"
            {...register("nok_relation")}
            placeholder="e.g., Spouse, Parent, Sibling"
          />
          {errors.nok_relation && (
            <p className="text-sm text-destructive">
              {getErrorMessage(errors.nok_relation)}
            </p>
          )}
          {backendErrors.nok_relation && (
            <p className="text-sm text-destructive">
              {backendErrors.nok_relation}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="nok_phone">Phone Number *</Label>
          <Input
            id="nok_phone"
            {...register("nok_phone")}
            placeholder="0712345678"
          />
          {errors.nok_phone && (
            <p className="text-sm text-destructive">
              {getErrorMessage(errors.nok_phone)}
            </p>
          )}
          {backendErrors.nok_phone && (
            <p className="text-sm text-destructive">
              {backendErrors.nok_phone}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nok_email">Email Address</Label>
        <Input
          id="nok_email"
          type="email"
          {...register("nok_email")}
          placeholder="Optional"
        />
        {errors.nok_email && (
          <p className="text-sm text-destructive">
            {getErrorMessage(errors.nok_email)}
          </p>
        )}
        {backendErrors.nok_email && (
          <p className="text-sm text-destructive">{backendErrors.nok_email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="nok_address">Address *</Label>
        <Textarea
          id="nok_address"
          {...register("nok_address")}
          rows={3}
          placeholder="Enter next of kin address"
        />
        {errors.nok_address && (
          <p className="text-sm text-destructive">
            {getErrorMessage(errors.nok_address)}
          </p>
        )}
        {backendErrors.nok_address && (
          <p className="text-sm text-destructive">
            {backendErrors.nok_address}
          </p>
        )}
      </div>
    </div>
  );

  const renderStepContent = (): React.JSX.Element | null => {
    switch (currentStep) {
      case 0:
        return renderPersonalInfo();
      case 1:
        return renderContactInfo();
      case 2:
        return renderEmploymentInfo();
      case 3:
        return renderNextOfKin();
      case 4:
        return (
          <FormProvider {...formMethods}>
            <DocumentUploads />
          </FormProvider>
        );
      case 5:
        return (
          <FormProvider {...formMethods}>
            <AgentDetails />
          </FormProvider>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">SACCO Member Registration</CardTitle>
          <CardDescription>
            Complete all required fields to register a new member
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-4">
            <Progress
              value={((currentStep + 1) / steps.length) * 100}
              className="h-2"
            />

            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                        index === currentStep
                          ? "bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110"
                          : completedSteps.has(index)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {completedSteps.has(index) ? (
                        <Check size={20} />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <p className="text-xs mt-2 text-center hidden md:block font-medium">
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 rounded-full transition-colors duration-300 ${
                        completedSteps.has(index) ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t">
            <h2 className="text-xl font-semibold">
              {steps[currentStep].title}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>
        </CardContent>
      </Card>

      <form
        onSubmit={handleSubmit(
          currentStep === steps.length - 1 ? onSubmit : nextStep,
        )}
        className="space-y-6"
      >
        {apiError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Registration Error:</strong> {apiError}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardContent className="pt-6">{renderStepContent()}</CardContent>
        </Card>

        <div className="flex justify-between items-center">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            <ChevronLeft size={20} className="mr-2" />
            Previous
          </Button>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 size={20} className="mr-2 animate-spin" />
                Processing...
              </>
            ) : currentStep === steps.length - 1 ? (
              <>
                Submit Registration
                <Check size={20} className="ml-2" />
              </>
            ) : (
              <>
                Continue
                <ChevronRight size={20} className="ml-2" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MultiStepMemberForm;
