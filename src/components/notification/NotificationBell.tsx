import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useNotifications } from '@/user/contexts/NotificationContext';
import { NotificationList } from '@/components/notification/NotificationList';

interface NotificationBellProps {
  count?: number;
  className?: string;
}

export const NotificationBell = ({ count, className }: NotificationBellProps) => {
  const { unreadCount } = useNotifications();
  const visibleCount = count ?? unreadCount;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-primary">
          <Bell className={className ?? 'h-5 w-5'} />
          {visibleCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center font-semibold">
              {visibleCount > 9 ? '9+' : visibleCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <NotificationList />
      </PopoverContent>
    </Popover>
  );
};