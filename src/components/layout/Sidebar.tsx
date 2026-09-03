import { CreditCard } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Link } from "react-router-dom"

export interface MenuItem {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
}

export interface MenuGroup {
  label: string
  items: MenuItem[]
}

export interface SidebarProps {
  brandLogo?: string
  brandName: string
  brandSubtitle: string
  brandUrl: string
  menuGroups: MenuGroup[]
  footerGroups?: MenuGroup[]
}

const AppSidebar = ({ 
  brandLogo,
  brandName, 
  brandUrl, 
  menuGroups, 
  footerGroups 
}: SidebarProps) => {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip={brandName}>
              <Link to={brandUrl}>
                {brandLogo ? (
                  <img src={brandLogo} alt={brandName} />
                ) : (
                  <CreditCard className="size-4" />
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent className="space-y-0">
        {menuGroups.map((group, index) => (
          <SidebarGroup 
            key={index} 
            className="-mb-6"  
          >
            <SidebarGroupLabel className="font-bold text-l leading-tight mb-0.5">
              {group.label}
            </SidebarGroupLabel>

            <SidebarGroupContent className="space-y-0">
              <SidebarMenu className="space-y-0">
                {group.items.map((item) => (
                  <SidebarMenuItem 
                    key={item.title} 
                    className="-mb-1"
                  >
                    <SidebarMenuButton 
                      asChild 
                      tooltip={item.title} 
                      className="h-8 px-2 text-sm"
                    >
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer groups - also compact */}
      {footerGroups && footerGroups.length > 0 && (
        <SidebarFooter className="mt-1 space-y-0">
          {footerGroups.map((group, index) => (
            <SidebarGroup key={index} className="mb-0">
              <SidebarGroupLabel className="font-bold  text-l leading-tight mb-0.5">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent className="space-y-0">
                <SidebarMenu className="space-y-0">
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.title} className="py-0">
                      <SidebarMenuButton 
                        asChild 
                        tooltip={item.title} 
                        className="h-8 px-2 text-sm"
                      >
                        <Link to={item.url} className="flex items-center gap-2">
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarFooter>
      )}
    </Sidebar>
  )
}

export default AppSidebar
