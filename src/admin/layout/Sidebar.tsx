import AppSidebar from "@/components/layout/Sidebar";
import { adminMenuConfig } from "./MenuConfig";

const AdminSidebar = () => {

  
  return <AppSidebar {...adminMenuConfig} />;
};

export default AdminSidebar;
