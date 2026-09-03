import { SidebarProvider } from "@/components/ui/sidebar"
import ClientSidebar from "./Sidebar"
import ClientHeader from "./Header"

interface LayoutProps {
  children: React.ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <ClientSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <ClientHeader />
          <main className="flex-1 overflow-auto p-4">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}

export default Layout
