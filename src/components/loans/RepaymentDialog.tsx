import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { loanPaymentsService } from "@/services/loanPaymentsService";
import { toast } from "sonner";

interface RepaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanNumber: string;
  onSuccess?: () => void;
  currentBalance: string;
  borrowerId: number;
}

export function RepaymentDialog({ open, onOpenChange, loanNumber, onSuccess }: RepaymentDialogProps) {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("Monthly installment payment");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setAmount("");
      setPaymentMethod("");
      setPaymentDate(new Date().toISOString().slice(0, 10));
      setReference("");
      setNotes("Monthly installment payment");
    }
  }, [open]);

  const onConfirm = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }
    if (!paymentDate) {
      toast.error("Please select a payment date");
      return;
    }
    if (!reference.trim()) {
      toast.error("Please enter a payment reference");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const payload = {
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        payment_date: paymentDate,
        reference: reference.trim(),
        notes: notes.trim(),
      };
      await loanPaymentsService.recordRepayment(loanNumber, payload);
      toast.success("Repayment recorded successfully");
      onOpenChange(false);
      onSuccess?.();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to record repayment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Repayment</DialogTitle>
          <DialogDescription>Record a loan repayment transaction.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="500.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method *</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger id="paymentMethod">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank">Bank Transfer</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="mpesa">M-Pesa</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="card">Card</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentDate">Payment Date *</Label>
            <Input
              id="paymentDate"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Payment Reference *</Label>
            <Input
              id="reference"
              placeholder="e.g., TDCHJVDC"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="uppercase"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Monthly installment payment"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : "Record Repayment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}