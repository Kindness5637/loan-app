import {
  FileText,
  BarChart3,
  Settings,
  Home,
  Database,
  History,
  Plus,
  Table,
  User,
  ListPlus,
  // FileSearch2,
  Clipboard,
  ClipboardPlus,
  MessageSquare,
  ArrowLeftRight,
} from "lucide-react";

import type { SidebarProps } from "@/components/layout/Sidebar";

export const adminMenuConfig: SidebarProps = {
  brandLogo: "/logo-transparent.png",
  brandName: "Stalis Glow",
  brandSubtitle: "Loan Application Management",
  brandUrl: "/",
  menuGroups: [
    {
      label: "Main Menu",
      items: [
        {
          title: "Dashboard",
          url: "/",
          icon: Home,
        },
      ],
    },
    {
      label: "Member Management",
      items: [
        {
          title: "Clients",
          url: "/members",
          icon: FileText,
        },
        {
          title: "New client",
          url: "/new-member",
          icon: ClipboardPlus,
        },
      ],
    },
    {
      label: "Users",
      items: [
        {
          title: "New User",
          url: "/create-user",
          icon: ListPlus,
        },
        {
          title: "Users",
          url: "/users",
          icon: User,
        },
      ],
    },

    {
      label: "Credit Services",
      items: [
        {
          title: "Loan Products",
          url: "/loan-products",
          icon: Table,
        },

        {
          title: "Loan Portfolio",
          url: "/loan-portfolio",
          icon: Clipboard,
        },

        {
          title: "Loan Application",
          url: "/loan-application",
          icon: Plus,
        },

        {
          title: "Transactions",
          url: "/transactions",
          icon: ArrowLeftRight,
        }
      ],
    },

    {label: "Feedback",
      items: [
        {
          title: "Comments",
          url: "/comments",
          icon: MessageSquare,
        }
      ]
    },

    {
      label: "Reports",
      items: [
        {
          title: "Analytics",
          url: "/analytics",
          icon: BarChart3,
        },
        {
          title: "Reports",
          url: "/reports",
          icon: Database,
        },
      ],
    },

  ],
  footerGroups: [
    {
      label: "System",
      items: [
        {
          title: "Audit Logs",
          url: "/audit",
          icon: History,
        },
        {
          title: "System Settings",
          url: "/settings",
          icon: Settings,
        },
      ],
    },
  ],
};
