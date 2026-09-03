import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useBreadcrumb } from '@/contexts/BreadcrumbContext';

interface RouteConfig {
  [key: string]: {
    label: string;
    icon?: React.ReactNode;
  };
}

// Route configuration for breadcrumb labels
const routeConfig: RouteConfig = {
  '/': { label: 'Dashboard' },
  '/members': { label: 'Members' },
  '/new-member': { label: 'New Member' },
  '/loan-products': { label: 'Loan Products' },
  '/add-loan-product': { label: 'Add Loan Product' },
  '/loan-portfolio': { label: 'Loan Portfolio' },
  '/loan-application': { label: 'Loan Application' },
  '/deposit-accounts': { label: 'Deposit Accounts' },
  '/new-deposit-account': { label: 'New Deposit Account' },
  '/share-capital-account': { label: 'Share Capital Account' },
  '/new-share-capital-account': { label: 'New Share Capital Account' },
  '/fund-transfer': { label: 'Fund Transfer' },
  '/analytics': { label: 'Analytics' },
  '/audit': { label: 'Audit Logs' },
  '/settings': { label: 'Settings' },
  // User routes
  '/user': { label: 'Dashboard' },
  '/client/dashboard': { label: 'Dashboard' },
  '/client/loans': { label: 'My Loans' },
  '/client/apply-loan': { label: 'Apply for Loan' },
  '/client/payments': { label: 'Payments' },
  '/client/statements': { label: 'Statements' },
  '/client/profile': { label: 'Profile' },
  '/client/support': { label: 'Support' },
};

const BreadcrumbNavigation: React.FC = () => {
  const location = useLocation();
  const breadcrumbContext = useBreadcrumb();
  
  // Handle case where context might be undefined
  const customBreadcrumbs = breadcrumbContext?.breadcrumbs || [];
  
  // Don't show breadcrumbs on login page or main dashboard pages
  const isDashboardPage = 
    location.pathname === '/' || 
    location.pathname === '/user' ||
    location.pathname === '/client/dashboard';

  if (location.pathname === '/login' || isDashboardPage) {
    return null;
  }

  // If custom breadcrumbs are set via context, use those
  if (customBreadcrumbs.length > 0) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          {customBreadcrumbs.map((crumb, index) => {
            const key = `${crumb.href || crumb.label}-${index}`;
            return (
              <React.Fragment key={key}>
                <BreadcrumbItem>
                  {crumb.href && index < customBreadcrumbs.length - 1 ? (
                    <BreadcrumbLink asChild>
                      <Link to={crumb.href} className="flex items-center gap-2">
                        {crumb.icon}
                        {crumb.label}
                      </Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage className="flex items-center gap-2">
                      {crumb.icon}
                      {crumb.label}
                    </BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {index < customBreadcrumbs.length - 1 && <BreadcrumbSeparator />}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  // Auto-generate breadcrumbs from current path
  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  // Build breadcrumb items from path segments
  const breadcrumbItems = [];
  
  // Determine if this is a user route
  const isUserRoute = location.pathname.startsWith('/user');
  const homeRoute = isUserRoute ? '/client/dashboard' : '/';
  
  // Always start with home/dashboard
  breadcrumbItems.push({
    label: 'Dashboard',
    href: homeRoute,
    icon: <Home className="h-4 w-4" />,
    path: homeRoute,
  });

  // Build path progressively
  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // Skip segments that are already represented by the home breadcrumb
    if (currentPath === '/' || 
        currentPath === '/client/dashboard') {
      return;
    }
    
    // For user routes, skip the standalone '/user' segment
    if (isUserRoute && currentPath === '/user') {
      return;
    }
    
    const config = routeConfig[currentPath];
    const isLastSegment = index === pathSegments.length - 1;
    
    if (config) {
      breadcrumbItems.push({
        label: config.label,
        href: isLastSegment ? undefined : currentPath,
        icon: undefined, // Don't show icons for non-home items
        path: currentPath,
      });
    } else {
      // Fallback: capitalize and format segment
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      breadcrumbItems.push({
        label,
        href: isLastSegment ? undefined : currentPath,
        icon: undefined,
        path: currentPath,
      });
    }
  });

  // Don't show breadcrumbs if we only have one item (home)
  if (breadcrumbItems.length <= 1) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbItems.map((item, index) => {
          const key = `${item.path}-${index}`;
          return (
            <React.Fragment key={key}>
              <BreadcrumbItem>
                {item.href ? (
                  <BreadcrumbLink asChild>
                    <Link to={item.href} className="flex items-center gap-2">
                      {item.icon}
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="flex items-center gap-2">
                    {item.icon}
                    {item.label}
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {index < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default BreadcrumbNavigation;