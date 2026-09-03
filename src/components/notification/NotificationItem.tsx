// components/notifications/NotificationItem.tsx
import { type Notification } from '@/types/notification';
import { useNotifications } from '@/user/contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  CheckCircle,
  XCircle,
  Banknote,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

const notificationIcons = {
  loan_approved: <CheckCircle className="h-5 w-5 text-green-500" />,
  loan_rejected: <XCircle className="h-5 w-5 text-red-500" />,
  loan_disbursed: <Banknote className="h-5 w-5 text-blue-500" />,
  repayment_due: <Calendar className="h-5 w-5 text-orange-500" />,
  repayment_received: <CheckCircle className="h-5 w-5 text-green-500" />,
  loan_completed: <CheckCircle className="h-5 w-5 text-gray-500" />,
  loan_defaulted: <AlertTriangle className="h-5 w-5 text-red-600" />,
};

interface NotificationItemProps {
  notification: Notification;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification }) => {
  const { markAsRead } = useNotifications();
  const navigate = useNavigate();

  const handleClick = () => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'p-4 cursor-pointer hover:bg-accent transition-colors',
        !notification.is_read && 'bg-blue-50/50 border-l-4 border-l-blue-500'
      )}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-1">
          {notificationIcons[notification.type]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={cn(
              'text-sm',
              !notification.is_read ? 'font-semibold' : 'font-medium'
            )}>
              {notification.title}
            </h4>
            {!notification.is_read && (
              <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>
    </div>
  );
};