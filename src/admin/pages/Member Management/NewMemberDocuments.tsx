import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const DOCUMENT_TYPES = [
  {
    id: "national_id",
    label: "National ID",
    description: "Upload a clear copy of your national ID (front and back)",
    accept: ".pdf,.jpg,.jpeg,.png",
    maxSize: 5 * 1024 * 1024, // 5MB
    required: "conditional", // Required if passport is missing
  },
  {
    id: "passport",
    label: "Passport",
    description: "Upload a clear copy of your passport (bio-data page)",
    accept: ".pdf,.jpg,.jpeg,.png",
    maxSize: 5 * 1024 * 1024, // 5MB
    required: "conditional", // Required if national_id is missing
  },
  {
    id: "proof_of_address",
    label: "Proof of Address",
    description: "Recent utility bill or bank statement (not older than 3 months)",
    accept: ".pdf,.jpg,.jpeg,.png",
    maxSize: 5 * 1024 * 1024, // 5MB
    required: false,
  },
  {
    id: "passport_photo",
    label: "Passport Photo",
    description: "Recent passport-sized photo with white background",
    accept: ".jpg,.jpeg,.png",
    maxSize: 2 * 1024 * 1024, // 2MB
    required: false,
  },
  {
    id: "payslip",
    label: "Latest Payslip",
    description: "Your most recent payslip (PDF or image)",
    accept: ".pdf,.jpg,.jpeg,.png",
    maxSize: 5 * 1024 * 1024, // 5MB
    required: false,
  },
  {
    id: "bank_statement",
    label: "Bank Statement",
    description: "Last 3 months bank statement (PDF preferred)",
    accept: ".pdf,.jpg,.jpeg,.png",
    maxSize: 5 * 1024 * 1024, // 5MB
    required: false,
  },
  {
    id: "business_registration",
    label: "Business Registration",
    description: "Business registration certificate (if self-employed)",
    accept: ".pdf,.jpg,.jpeg,.png",
    maxSize: 5 * 1024 * 1024, // 5MB
    required: false,
  },
  {
    id: "tax_certificate",
    label: "Tax Certificate",
    description: "Latest tax certificate (KRA PIN certificate for Kenya)",
    accept: ".pdf,.jpg,.jpeg,.png",
    maxSize: 5 * 1024 * 1024, // 5MB
    required: false,
  },
] as const;

export function DocumentUploads() {
  const { register, formState: { errors }, watch } = useFormContext();
  const values = watch();

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getValidationRules = (doc: typeof DOCUMENT_TYPES[number]) => {
    return {
      validate: {
        required: (files: FileList | null) => {
          // For conditional required documents (national_id or passport)
          if (doc.required === "conditional") {
            if (doc.id === "national_id") {
              const hasPassport = values.passport?.[0];
              if (!files?.[0] && !hasPassport) {
                return "Either National ID or Passport is required";
              }
            }
            if (doc.id === "passport") {
              const hasNationalId = values.national_id?.[0];
              if (!files?.[0] && !hasNationalId) {
                return "Either National ID or Passport is required";
              }
            }
          }
          return true;
        },
        fileSize: (files: FileList | null) => {
          if (!files?.[0]) return true;
          return files[0].size <= doc.maxSize || 
            `File size must be less than ${formatFileSize(doc.maxSize)}`;
        },
        fileType: (files: FileList | null) => {
          if (!files?.[0]) return true;
          const acceptedTypes = doc.accept.split(',').map(t => t.trim().toLowerCase());
          const fileName = files[0].name.toLowerCase();
          const fileType = files[0].type.toLowerCase();
          
          const isValid = acceptedTypes.some(type => {
            if (type === 'image/*') {
              return fileType.startsWith('image/');
            }
            if (type.startsWith('.')) {
              return fileName.endsWith(type);
            }
            return fileType === type || fileType === `application/${type}`;
          });
          
          return isValid || `Invalid file type. Accepted: ${doc.accept}`;
        }
      }
    };
  };

  const hasNationalId = values.national_id?.[0];
  const hasPassport = values.passport?.[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Required Documents</CardTitle>
        <Alert variant="default" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs sm:text-sm">
            Please upload clear copies of the following documents. 
            <span className="font-semibold"> You must provide either a National ID or Passport.</span>
            {" "}Maximum file size: 5MB per file (2MB for passport photo).
            Supported formats: JPG, JPEG, PNG, PDF
          </AlertDescription>
        </Alert>

        {/* ID/Passport Status Indicator */}
        {(hasNationalId || hasPassport) && (
          <Alert variant="default" className="mt-2 bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-xs sm:text-sm text-green-800">
              {hasNationalId && hasPassport 
                ? "✓ Both National ID and Passport uploaded"
                : hasNationalId 
                ? "✓ National ID uploaded" 
                : "✓ Passport uploaded"}
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {DOCUMENT_TYPES.map((doc) => {
          const error = errors[doc.id]?.message as string;
          const file = values[doc.id]?.[0];
          const isOptional = doc.required === false;
          
          return (
            <div key={doc.id} className="space-y-2 pb-4 border-b last:border-b-0 last:pb-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor={doc.id} className="text-sm sm:text-base">
                    {doc.label}
                    {doc.required === "conditional" && (
                      <span className="text-orange-600 ml-1 text-xs">(Required*)</span>
                    )}
                    {isOptional && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Optional
                      </Badge>
                    )}
                  </Label>
                </div>
                {file && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-muted-foreground truncate">
                      {file.name} ({formatFileSize(file.size)})
                    </span>
                  </div>
                )}
              </div>
              
              <p className="text-xs sm:text-sm text-muted-foreground">{doc.description}</p>
              
              {/* Special note for conditional fields */}
              {doc.id === "national_id" && !hasNationalId && !hasPassport && (
                <p className="text-xs text-orange-600 font-medium">
                  ⚠️ Please upload either your National ID or Passport
                </p>
              )}
              
              <div className="space-y-1">
                <Input
                  id={doc.id}
                  type="file"
                  accept={doc.accept}
                  className="cursor-pointer text-xs sm:text-sm"
                  {...register(doc.id, getValidationRules(doc))}
                />
                <p className="text-xs text-muted-foreground">
                  Max size: {formatFileSize(doc.maxSize)} • Formats: {doc.accept}
                </p>
              </div>
              
              {error && (
                <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm font-medium text-red-600">{error}</p>
                </div>
              )}
            </div>
          );
        })}

        {/* Summary at the bottom */}
        <div className="pt-4 border-t">
          <div className="bg-muted/50 p-3 sm:p-4 rounded-lg space-y-2">
            <p className="text-xs sm:text-sm font-semibold">Document Checklist:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                {(hasNationalId || hasPassport) ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                )}
                <span>ID Document (National ID or Passport)</span>
              </div>
              {DOCUMENT_TYPES.filter(d => d.required === false).map(doc => {
                const uploaded = values[doc.id]?.[0];
                return (
                  <div key={doc.id} className="flex items-center gap-2">
                    {uploaded ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                    )}
                    <span>{doc.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}