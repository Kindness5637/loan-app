import { useEffect } from 'react';
import { useBreadcrumb, type BreadcrumbItem } from '@/contexts/BreadcrumbContext';

/**
 * Hook to set custom breadcrumbs for a page
 * @param breadcrumbs Array of breadcrumb items to set
 * @param deps Optional dependency array to re-run the effect
 */
export const useBreadcrumbs = (breadcrumbs: BreadcrumbItem[], deps: any[] = []) => {
  const { setBreadcrumbs, clearBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    
    // Cleanup function to clear breadcrumbs when component unmounts
    return () => {
      clearBreadcrumbs();
    };
  }, deps);
};

/**
 * Hook to add a single breadcrumb to the current breadcrumb trail
 * @param breadcrumb Single breadcrumb item to add
 * @param deps Optional dependency array to re-run the effect
 */
export const useAddBreadcrumb = (breadcrumb: BreadcrumbItem, deps: any[] = []) => {
  const { addBreadcrumb } = useBreadcrumb();

  useEffect(() => {
    addBreadcrumb(breadcrumb);
  }, deps);
};

/**
 * Hook to clear all breadcrumbs
 */
export const useClearBreadcrumbs = () => {
  const { clearBreadcrumbs } = useBreadcrumb();
  
  useEffect(() => {
    clearBreadcrumbs();
  }, []);
};