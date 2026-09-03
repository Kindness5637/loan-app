import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { loanPaymentsService } from "@/services/loanPaymentsService";
import { toast } from "sonner";

interface OffsetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanNumber: string;
  onSuccess?: () => void;
  borrowerId: number;
}

export function OffsetDialog({ open, onOpenChange, loanNumber, onSuccess }: OffsetDialogProps) {
  const [amount, setAmount] = useState("");
  const [offsetDate, setOffsetDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("Partial offset payment");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setAmount("");
      setOffsetDate(new Date().toISOString().slice(0, 10));
      setNotes("Partial offset payment");
    }
  }, [open]);

  const onConfirm = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!offsetDate) {
      toast.error("Please select an offset date");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const payload = {
        amount: parseFloat(amount),
        offset_date: offsetDate,
        notes: notes.trim(),
      };
      await loanPaymentsService.recordOffset(loanNumber, payload);
      toast.success("Offset recorded successfully");
      onOpenChange(false);
      onSuccess?.();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to record offset");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Loan Offset</DialogTitle>
          <DialogDescription>Record a loan offset transaction.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="45000.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="offsetDate">Offset Date *</Label>
            <Input
              id="offsetDate"
              type="date"
              value={offsetDate}
              onChange={(e) => setOffsetDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Partial offset payment"
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
            {isSubmitting ? "Processing..." : "Record Offset"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}