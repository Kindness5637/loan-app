export interface Notification {
    id: string;
    user_id: number;
    loan_number: string;
    type: 'loan_approved' | 'loan_rejected' | 'loan_disbursed' | 'repayment_due' | 'repayment_received' | 'loan_completed' | 'loan_defaulted';
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    action_url?: string;
  }