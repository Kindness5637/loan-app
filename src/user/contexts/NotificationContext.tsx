import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { apiService } from '@/services/api';
import { type Notification } from '@/types/notification';
import { notificationManager } from '@/utils/NotificationManager';
import { type LoanApplication } from '@/types/loan';
import { useAuth } from '@/hooks/use-auth';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  checkForUpdates: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastCheckedLoans, setLastCheckedLoans] = useState<Map<string, string>>(new Map());

  const checkForUpdates = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      // Fetch current loan applications
      const response = await apiService.get('/loan-applications');
      const loans: LoanApplication[] = response.data || [];

      // Check for status changes
      loans.forEach((loan) => {
        const lastStatus = lastCheckedLoans.get(loan.loan_number);
        
        if (lastStatus && lastStatus !== loan.loan_status) {
          // Status changed - create notification
          createNotificationForStatusChange(loan, lastStatus, loan.loan_status);
        }
        
        // Update last known status
        lastCheckedLoans.set(loan.loan_number, loan.loan_status);
      });

      setLastCheckedLoans(new Map(lastCheckedLoans));
    } catch (error) {
      console.error('Error checking for loan updates:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNotificationForStatusChange = (
    loan: LoanApplication,
    _oldStatus: string,
    newStatus: string
  ) => {
    const notifications: Record<string, { title: string; message: string; type: any }> = {
      'approved': {
        title: 'Loan Application Approved! 🎉',
        message: `Your loan application #${loan.loan_number} for ${formatCurrency(loan.principal_amount)} has been approved. Awaiting disbursement.`,
        type: 'loan_approved',
      },
      'rejected': {
        title: 'Loan Application Update',
        message: `Your loan application #${loan.loan_number} has been reviewed. Please contact us for more information.`,
        type: 'loan_rejected',
      },
      'disbursed': {
        title: 'Loan Disbursed Successfully! 💰',
        message: `Your loan #${loan.loan_number} of ${formatCurrency(loan.principal_amount)} has been disbursed to your account.`,
        type: 'loan_disbursed',
      },
      'active': {
        title: 'Loan Now Active',
        message: `Your loan #${loan.loan_number} is now active. Monthly payment: ${formatCurrency(loan.monthly_payment)}.`,
        type: 'loan_disbursed',
      },
      'completed': {
        title: 'Loan Completed! ✅',
        message: `Congratulations! Your loan #${loan.loan_number} has been fully paid off.`,
        type: 'loan_completed',
      },
      'defaulted': {
        title: 'Loan Status Update',
        message: `Important update regarding your loan #${loan.loan_number}. Please contact us immediately.`,
        type: 'loan_defaulted',
      },
    };

    const notifData = notifications[newStatus];
    if (notifData) {
      notificationManager.addNotification({
        user_id: loan.borrower_id,
        loan_number: loan.loan_number,
        type: notifData.type,
        title: notifData.title,
        message: notifData.message,
        action_url: `/loan-portfolio/${loan.loan_number}`,
      });
    }
  };

  const formatCurrency = (amount: string | number): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(num);
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    // Initial check
    checkForUpdates();

    // Check for updates every 30 seconds
    const interval = setInterval(checkForUpdates, 30000);

    // Subscribe to notification changes
    const unsubscribe = notificationManager.subscribe(() => {
      setNotifications([...notificationManager.getNotifications()]);
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [isAuthenticated]);

  const markAsRead = (id: string) => {
    notificationManager.markAsRead(id);
  };

  const markAllAsRead = () => {
    notificationManager.markAllAsRead();
  };

  const unreadCount = notificationManager.getUnreadCount();

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        checkForUpdates,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};