import {type Notification } from "@/types/notification";

class NotificationManager {
    private notifications: Notification[] = [];
    private listeners: Array<() => void> = [];
  
    addNotification(notification: Omit<Notification, 'id' | 'created_at' | 'is_read'>) {
      const newNotification: Notification = {
        ...notification,
        id: `notif_${Date.now()}_${Math.random()}`,
        created_at: new Date().toISOString(),
        is_read: false,
      };
      
      this.notifications.unshift(newNotification);
      this.notifyListeners();
    }
  
    getNotifications(): Notification[] {
      return this.notifications;
    }
  
    getUnreadCount(): number {
      return this.notifications.filter(n => !n.is_read).length;
    }
  
    markAsRead(id: string) {
      const notification = this.notifications.find(n => n.id === id);
      if (notification) {
        notification.is_read = true;
        this.notifyListeners();
      }
    }
  
    markAllAsRead() {
      this.notifications.forEach(n => n.is_read = true);
      this.notifyListeners();
    }
  
    subscribe(listener: () => void) {
      this.listeners.push(listener);
      return () => {
        this.listeners = this.listeners.filter(l => l !== listener);
      };
    }
  
    private notifyListeners() {
      this.listeners.forEach(listener => listener());
    }
  }
  
  export const notificationManager = new NotificationManager();