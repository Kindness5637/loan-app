import { SidebarInset } from "@/components/ui/sidebar"
import AdminSidebar from "./Sidebar"
import AdminHeader from "./Header"

interface LayoutProps {
  children: React.ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          [data-sidebar="sidebar"] {
            display: none !important;
          }
          [data-slot="sidebar-inset"] > .sticky {
            display: none !important;
          }
          [data-slot="sidebar-inset"] {
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          [data-slot="sidebar-inset"] > main {
            overflow: visible !important;
            padding: 0 !important;
          }
        }
      ` }} />
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
