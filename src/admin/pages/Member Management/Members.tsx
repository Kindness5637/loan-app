
// Members.tsx - Updated to use the latest DataTable component
import { DataTable , type DataTableConfig} from "@/components/DataTablePage"
import { Plus, Edit, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
// import { toastUtils } from "@/utils/toastUtils";

interface Member {
  encodedKey: string;
  id: string;
  phone: string;    
  creationDate: string;
  lastModifiedDate: string;
  activationDate?: string;
  approvedDate?: string;
  full_name: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  preferredLanguage?: string;
  clientRoleKey?: string;
  loanCycle?: number;
  state?: string;
  _Client_Details?: {
    postal_address?: string;
    nok_address?: string;
    ocupation?: string;
    address?: string;
    nok_email?: string;
    nok_phone?: string;
    employer_phone?: string;
    apartment_name?: string;
    employer_name?: string;
    monthly_income?: string;
    others_income?: string;
    employer_address?: string;
    marital_status?: string;
    nok_full_name?: string;
    employer_phone_2?: string;
    position?: string;
    nok_relation?: string;
    monthly_expenses?: string;
  };
}

export const Members = () => {
  const navigate = useNavigate();

  // Set breadcrumbs for this page
  useBreadcrumbs([
    { label: "Dashboard", href: "/" },
    { label: "Member Management", href: "/members" },
    { label: "clients", icon: <Users className="h-4 w-4" /> },
  ]);

  const handleEditMember = (member: Member) => {
    navigate(`/members/update/${member.id}`);
  };

  const membersConfig: DataTableConfig<Member> = {
    title: "Clients",
    description: "Manage and view all registered members",
    emptyStateMessage: "Get started by adding your first member",
    apiEndpoint: "/members",

    addButton: {
      label: "Add New Client",
      link: "/new-member",
      icon: <Plus size={18} />,
    },

    columns: [
      {
        key: "id",
        label: "Member ID",
        render: (member) => (
          <span className="font-mono text-sm">{member.id}</span>
        ),
        sortable: true,
        searchable: true,
      },
      {
        key: "full_name",
        label: "Name",
        render: (member) => (
          <span className="font-medium">{member.full_name}</span>
        ),
        sortable: true,
        searchable: true,
      },
      {
        key: "phone",
        label: "Phone",
        render: (member) => (
          <span className="font-medium">{member.phone}</span>
        ),
        sortable: true,
        searchable: true,
      },
    ],

    stats: [
      {
        label: "Total Members",
        getValue: (data) => data.length,
      },
      {
        label: "New This Month",
        getValue: (data) => {
          const now = new Date();
          return data.filter((m: Member) => {
            const memberDate = new Date(m.creationDate);
            return (
              memberDate.getMonth() === now.getMonth() &&
              memberDate.getFullYear() === now.getFullYear()
            );
          }).length;
        },
      },
      {
        label: "Total Loans",
        getValue: (data) =>
          data.reduce((sum: number, m: Member) => sum + (m.loanCycle || 0), 0),
      },
    ],

    actions: [
      {
        label: "Edit Member",
        icon: <Edit className="h-4 w-4" />,
        onClick: handleEditMember,
      },
    ],

    searchPlaceholder: "Search members...",
    searchKeys: ["firstName", "lastName", "middleName", "id", "full_name"],

    // Custom filter to search in nested _Client_Details
    customFilters: (data, searchQuery) => {
      const query = searchQuery.toLowerCase();
      return data.filter((member: Member) => {
        const fullName = `${member.firstName} ${member.middleName || ""} ${
          member.lastName
        }`.toLowerCase();
        const details = member._Client_Details;

        return (
          fullName.includes(query) ||
          member.id.toLowerCase().includes(query) ||
          details?.ocupation?.toLowerCase().includes(query) ||
          details?.employer_name?.toLowerCase().includes(query) ||
          details?.postal_address?.toLowerCase().includes(query)
        );
      });
    },

    // enableRowSelection: false,
    enableExport: true,
    enableColumnVisibility: true,
    defaultPageSize: 10,
    pageSizeOptions: [5, 10, 20, 50, 100],
  };

  return <DataTable config={membersConfig} />;
};