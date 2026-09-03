import { SidebarInset } from "@/components/ui/sidebar"
import AdminSidebar from "./Sidebar"
import AdminHeader from "./Header"

interface LayoutProps {
  children: React.ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <>
      <AdminSidebar />
      <SidebarInset>
        <AdminHeader />
        <main className="flex-1 overflow-auto p-4">
          {children}
        </main>
      </SidebarInset>
    </>
  )
}

export default Layout
