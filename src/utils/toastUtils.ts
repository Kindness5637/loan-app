import { toast } from 'sonner';

export const toastUtils = {
  // Success toasts
  success: {
    created: (itemName: string) => 
      toast.success('Created Successfully', {
        description: `${itemName} has been created successfully.`,
        duration: 4000,
      }),
    
    updated: (itemName: string) => 
      toast.success('Updated Successfully', {
        description: `${itemName} has been updated successfully.`,
        duration: 4000,
      }),
    
    deleted: (itemName: string) => 
      toast.success('Deleted Successfully', {
        description: `${itemName} has been deleted successfully.`,
        duration: 4000,
      }),
    
    saved: (itemName: string) => 
      toast.success('Saved Successfully', {
        description: `${itemName} has been saved successfully.`,
        duration: 4000,
      }),
    
    submitted: (itemName: string) => 
      toast.success('Submitted Successfully', {
        description: `${itemName} has been submitted successfully.`,
        duration: 4000,
      }),
    
    approved: (itemName: string) => 
      toast.success('Approved Successfully', {
        description: `${itemName} has been approved successfully.`,
        duration: 4000,
      }),
    
    rejected: (itemName: string) => 
      toast.success('Rejected Successfully', {
        description: `${itemName} has been rejected successfully.`,
        duration: 4000,
      }),
    
    custom: (title: string, description?: string) => 
      toast.success(title, {
        description,
        duration: 4000,
      }),
  },

  // Error toasts
  error: {
    failed: (action: string, itemName?: string) => 
      toast.error('Operation Failed', {
        description: `Failed to ${action}${itemName ? ` ${itemName}` : ''}. Please try again.`,
        duration: 6000,
      }),
    
    notFound: (itemName: string) => 
      toast.error('Not Found', {
        description: `${itemName} could not be found.`,
        duration: 5000,
      }),
    
    unauthorized: () => 
      toast.error('Unauthorized', {
        description: 'You do not have permission to perform this action.',
        duration: 5000,
      }),
    
    validation: (message?: string) => 
      toast.error('Validation Error', {
        description: message || 'Please check your input and try again.',
        duration: 6000,
      }),
    
    network: () => 
      toast.error('Network Error', {
        description: 'Please check your internet connection and try again.',
        duration: 6000,
      }),
    
    custom: (title: string, description?: string) => 
      toast.error(title, {
        description,
        duration: 6000,
      }),
  },

  // Warning toasts
  warning: {
    unsavedChanges: () => 
      toast.warning('Unsaved Changes', {
        description: 'You have unsaved changes. Please save before leaving.',
        duration: 5000,
      }),
    
    custom: (title: string, description?: string) => 
      toast.warning(title, {
        description,
        duration: 5000,
      }),
  },

  // Info toasts
  info: {
    loading: (action: string) => 
      toast.loading(`${action}...`, {
        duration: Infinity, // Will be dismissed manually
      }),
    
    custom: (title: string, description?: string) => 
      toast.info(title, {
        description,
        duration: 4000,
      }),
  },

  // Promise-based toasts for async operations
  promise: <T>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return toast.promise(promise, {
      loading,
      success,
      error,
    });
  },

  // Dismiss all toasts
  dismiss: () => toast.dismiss(),
};