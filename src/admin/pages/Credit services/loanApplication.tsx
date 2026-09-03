import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { apiService } from "@/services/api";
import { toast } from "sonner";

// Combobox components from shadcn/ui
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

const guarantorSchema = z.object({
  business_partner_id: z.coerce.number().min(1, "Business partner ID is required"),
  amount_guaranteed: z.coerce.number().min(1, "Amount must be greater than 0"),
});

const loanApplicationSchema = z.object({
  borrower_id: z.coerce.number().min(1, "Borrower ID is required"),
  loan_type_id: z.coerce.number().min(1, "Loan type is required"),
  principal_amount: z.coerce.number().min(1, "Principal amount is required"),
  loan_duration: z.coerce.number().min(1, "Loan duration is required"),
  purpose: z.string().min(5, "Purpose must be at least 5 characters"),
  collateral: z.string().min(3, "Collateral description is required"),
  transaction_reference: z.string().min(1, "Transaction reference is required"),
  from_this_account: z.string().min(1, "Account source is required"),
  guarantors: z.array(guarantorSchema).min(1, "At least one guarantor is required"),
});

type LoanApplicationFormData = z.infer<typeof loanApplicationSchema>;
type Member = {
  id: number;
  CardCode: string;
  full_name: string;
  phone: string;
};

const BorrowerSelect = ({ members, value, onChange, loading }: any) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = members.filter((m: Member) =>
    m.full_name.toLowerCase().includes(search.toLowerCase()) ||
    m.phone.includes(search) ||
    m.CardCode.includes(search)
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between"
        >
          {value
            ? members.find((m: Member) => m.id === Number(value))?.full_name
            : "Select a borrower"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput
            placeholder="Search by name, phone, or code..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No members found.</CommandEmpty>
            <CommandGroup>
              {loading ? (
                <CommandItem disabled>Loading members...</CommandItem>
              ) : (
                filtered.map((m: Member) => (
                  <CommandItem
                    key={m.id}
                    value={m.id.toString()}
                    onSelect={() => {
                      onChange(Number(m.id));
                      setOpen(false);
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{m.full_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {m.CardCode} • {m.phone}
                      </span>
                    </div>
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export const LoanApplication = () => {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoanApplicationFormData>({
    resolver: zodResolver(loanApplicationSchema),
    defaultValues: {
      borrower_id: 0,
      loan_type_id: 1,
      principal_amount: 0,
      loan_duration: 12,
      purpose: "",
      collateral: "",
      transaction_reference: "mpesa",
      from_this_account: "Mobile App",
      guarantors: [{ business_partner_id: 0, amount_guaranteed: 0 }],
    },
  });

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  type LoanType = { id: number; loanType: string; loanCode: string };
  const [loanTypes, setLoanTypes] = useState<LoanType[]>([])
  const { fields, append, remove } = useFieldArray({
    control,
    name: "guarantors",
  });
  const navigate = useNavigate()

  const selectedBorrowerId = watch("borrower_id");

  useEffect(() => {
    const getMembers = async () => {
      try {
        setLoading(true);
        const response = await apiService.get("/members");

        if (response.data.length > 0) {
          setMembers(response.data);
        } else {
          toast.info("No members found");
        }
      } catch (error) {
        console.error("Error fetching members:", error);
        toast.error("Error fetching members");
      } finally {
        setLoading(false);
      }
    };

    //loan type
    const fetchLoanTypes = async () => {
      try {
        const res = await apiService.get("/loan-types");
        const data = await res.data;
        setLoanTypes(data);
      } catch (err) {
        console.error("Error fetching loan types:", err);
      }
    };
    fetchLoanTypes()
    getMembers();
  }, []);

  // ✅ Submit handler
  const onSubmit = async (data: LoanApplicationFormData) => {
    try {
      const response = await apiService.post("/loan-applications", data);
      let res = {
        "loan_type_id":response.data.loan_type_id,
        "principal_amount": response.data.principal_amount,
        "loan_duration": response.data.loan_duration
      }
      navigate("/loan-preview",  { state: { loanData: res } })
      setTimeout(()=>{
        window.location.href = "/loan-preview"
      }, 1000) 
      toast.success("Your loan has been submitted");
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit loan application. Please fix the errors and try again.");
    }
  };

  // ✅ UI
  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-8xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Loan Application Form</h1>
          <p className="text-muted-foreground">Fill in the details below to apply for a loan</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Loan Details */}
          <Card>
            <CardHeader>
              <CardTitle>Loan Details</CardTitle>
              <CardDescription>Specify loan requirements and borrower information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* ✅ Borrower Selection */}
              <div className="space-y-3">
                <Label className="text-base">Select Borrower *</Label>
                <BorrowerSelect
                  members={members}
                  value={selectedBorrowerId}
                  onChange={(val: number) => setValue("borrower_id", val)}
                  loading={loading}
                />
                {errors.borrower_id && (
                  <p className="text-sm text-destructive">{errors.borrower_id.message}</p>
                )}
              </div>

              {/* Loan Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="loan_type_id">Loan Type</Label>
                <Select
                    onValueChange={(value) => setValue("loan_type_id", Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Loan Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {loanTypes.length > 0 ? (
                        loanTypes.map((loan) => (
                          <SelectItem key={loan.id} value={String(loan.id)}>
                            {loan.loanType} ({loan.loanCode})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem disabled value="loading">
                          Loading...
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {errors.loan_type_id && (
                    <p className="text-sm text-destructive">
                      {errors.loan_type_id.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="principal_amount">Principal Amount</Label>
                  <Input id="principal_amount" type="number" placeholder="50000" {...register("principal_amount")} />
                  {errors.principal_amount && <p className="text-sm text-destructive">{errors.principal_amount.message}</p>}
                </div>

                <div>
                  <Label htmlFor="loan_duration">Loan Duration (months)</Label>
                  <Input id="loan_duration" type="number" placeholder="12" {...register("loan_duration")} />
                  {errors.loan_duration && <p className="text-sm text-destructive">{errors.loan_duration.message}</p>}
                </div>

                <div>
                  <Label htmlFor="transaction_reference">Transaction Reference</Label>
                  <Input id="transaction_reference" {...register("transaction_reference")} />
                  {errors.transaction_reference && <p className="text-sm text-destructive">{errors.transaction_reference.message}</p>}
                </div>

                <div>
                  <Label htmlFor="from_this_account">Account Source</Label>
                  <Input id="from_this_account" {...register("from_this_account")} />
                  {errors.from_this_account && <p className="text-sm text-destructive">{errors.from_this_account.message}</p>}
                </div>
              </div>

              {/* Text Areas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="purpose">Purpose</Label>
                  <Textarea id="purpose" rows={4} placeholder="Business expansion" {...register("purpose")} />
                  {errors.purpose && <p className="text-sm text-destructive">{errors.purpose.message}</p>}
                </div>

                <div>
                  <Label htmlFor="collateral">Collateral</Label>
                  <Textarea
                    id="collateral"
                    rows={4}
                    placeholder="Describe collateral (e.g., Vehicle KAA 123B)"
                    {...register("collateral")}
                  />
                  {errors.collateral && <p className="text-sm text-destructive">{errors.collateral.message}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guarantors */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Guarantors</CardTitle>
                  <CardDescription>Add guarantors for this loan</CardDescription>
                </div>
                <Button type="button" onClick={() => append({ business_partner_id: 0, amount_guaranteed: 0 })} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" /> Add Guarantor
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {fields.map((field, index) => (
                <div key={field.id} className="border border-border rounded-lg p-6 space-y-4 bg-card/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>Guarantor Business Partner ID</Label>
                      <Input
                        type="number"
                        placeholder="Enter business partner ID"
                        {...register(`guarantors.${index}.business_partner_id` as const)}
                      />
                      {errors.guarantors?.[index]?.business_partner_id && (
                        <p className="text-sm text-destructive">{errors.guarantors[index]?.business_partner_id?.message}</p>
                      )}
                    </div>

                    <div>
                      <Label>Amount Guaranteed</Label>
                      <Input
                        type="number"
                        placeholder="10000"
                        {...register(`guarantors.${index}.amount_guaranteed` as const)}
                      />
                      {errors.guarantors?.[index]?.amount_guaranteed && (
                        <p className="text-sm text-destructive">{errors.guarantors[index]?.amount_guaranteed?.message}</p>
                      )}
                    </div>
                  </div>

                  {fields.length > 1 && (
                    <div className="flex justify-end">
                      <Button type="button" onClick={() => remove(index)} variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" /> Remove Guarantor
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6">
            <Button type="button" variant="outline" size="lg">Cancel</Button>
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
