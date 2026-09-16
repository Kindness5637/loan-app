import {
  FileText,
  User,
  HelpCircle,
  Home,
} from "lucide-react";

import type { SidebarProps } from "@/components/layout/Sidebar";

export const clientMenuConfig: SidebarProps = {
  brandLogo: "/assets/official-logo.png",

  brandName: "Stalis LendPro",
  brandSubtitle: "Client Portal",
  brandUrl: "/client",
  menuGroups: [
    {
      label: "Main Menu",
      items: [
        {
          title: "Dashboard",
          url: "/client",
          icon: Home,
        },
        {
          title: "My Loans",
          url: "/client/loans",
          icon: FileText,
        },
        // {
        //   title: "Apply for Loan",
        //   url: "/loan-application",
        //   icon: Plus,
        // },
        // {
        //   title: "Statements",
        //   url: "client/statements",
        //   icon: History,
        // },
        // {
        //   title: "Payments",
        //   url: "/client/payments",
        //   icon: Calculator,
        // }
        // {
        //   title: "Personal Information",
        //   url: "client/profile",
        //   icon: User,
        // }
      ],
    },
    {
      label: "My Account",
      items: [
        // {
        //   title: "My Applications",
        //   url: "/applications",
        //   icon: History,
        // },
        {
          title: "Profile",
          url: "/client/profile",
          icon: User,
        },
      ],
    },
  ],
  footerGroups: [
    {
      label: "Support",
      items: [
        {
          title: "Help & Support",
          url: "/client/support",
          icon: HelpCircle,
        },
      ],
    },
  ],
};
