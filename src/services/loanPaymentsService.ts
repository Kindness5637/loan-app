import { apiService } from "./api";

interface RecordRepaymentPayload {
  amount: number;
  payment_method: string;
  payment_date: string;
  reference: string;
  notes: string;
}

interface PayoffLoanPayload {
  payment_method: string;
  reference: string;
  notes: string;
}

interface RecordOffsetPayload {
  amount: number;
  offset_date: string;
  notes: string;
}

interface RepaymentResponse {
  success: boolean;
  message: string;
  data?: any;
}

class LoanPaymentsService {
  /**
   * Record a loan repayment transaction
   */
  async recordRepayment(
    loanNumber: string,
    payload: RecordRepaymentPayload
  ): Promise<RepaymentResponse> {
    console.log(payload);
    return await apiService.post(`/${loanNumber}/repay`, payload);
  }

  /**
   * Pay off a loan in full
   */
  async payoffLoan(
    loanNumber: string,
    payload: PayoffLoanPayload
  ): Promise<RepaymentResponse> {
    return await apiService.post(`/${loanNumber}/pay-off`, payload);
  }

  /**
   * Record a loan offset transaction
   */
  async recordOffset(
    loanNumber: string,
    payload: RecordOffsetPayload
  ): Promise<RepaymentResponse> {
    return await apiService.post(`/${loanNumber}/offset`, payload);
  }

  /**
   * Get payment history for a loan
   */
  async getPaymentHistory(loanNumber: string): Promise<any> {
    return await apiService.get(`/${loanNumber}/payments`);
  }

  /**
   * Get loan balance
   */
  async getLoanBalance(loanNumber: string): Promise<any> {
    return await apiService.get(`/${loanNumber}/balance`);
  }

  /**
   * Delete/reverse a payment
   */
  async reversePayment(
    loanNumber: string,
    paymentId: string
  ): Promise<RepaymentResponse> {
    return await apiService.delete(`/${loanNumber}/payments/${paymentId}`);
  }
}

// Export singleton instance
export const loanPaymentsService = new LoanPaymentsService();

// Export types for use in components
export type {
  RecordRepaymentPayload,
  PayoffLoanPayload,
  RecordOffsetPayload,
  RepaymentResponse,
};