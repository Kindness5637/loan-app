import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { loanPaymentsService } from "@/services/loanPaymentsService";
import { toast } from "sonner";

interface PayoffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanNumber: string;
  onSuccess?: () => void;
}

export function PayoffDialog({ open, onOpenChange, loanNumber, onSuccess }: PayoffDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("Full loan settlement");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setPaymentMethod("");
      setReference("");
      setNotes("Full loan settlement");
    }
  }, [open]);

  const onConfirm = async () => {
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }
    if (!reference.trim()) {
      toast.error("Please enter a payment reference");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const payload = {
        payment_method: paymentMethod,
        reference: reference.trim(),
        notes: notes.trim(),
      };
      await loanPaymentsService.payoffLoan(loanNumber, payload);
      toast.success("Loan settled and closed");
      onOpenChange(false);
      onSuccess?.();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to settle loan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pay Off Loan</DialogTitle>
          <DialogDescription>Settle the loan in full.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
            <Label htmlFor="reference">Payment Reference *</Label>
            <Input
              id="reference"
              placeholder="e.g., TYIVWCH8"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="uppercase"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Full loan settlement"
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
            {isSubmitting ? "Processing..." : "Confirm Payoff"}
            
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}