import AppSidebar from "@/components/layout/Sidebar";
import { clientMenuConfig } from "./menu-config";

const ClientSidebar = () => {
  // Future: Add client-specific customizations here
  // - Dynamic menu items based on client status
  // - Loan application status indicators
  // - Client-specific features like recent applications
  
  return <AppSidebar {...clientMenuConfig} />;
};

export default ClientSidebar;
