export type UserRole = "system_admin" | "loan_officer" | "approver" | "client" | "auditor"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
  department?: string
  permissions: string[]
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

// Role-based permissions
export const ROLE_PERMISSIONS = {
  system_admin: [
    "manage_users",
    "manage_roles",
    "view_system_settings",
    "view_audit_logs",
    "manage_system_config",
    "view_all_loans",
    "view_all_transactions",
    "generate_reports",
  ],
  loan_officer: [
    "create_loan_application",
    "update_loan_application",
    "view_assigned_loans",
    "manage_client_documents",
    "view_client_transactions",
  ],
  approver: ["view_pending_approvals", "approve_loan", "reject_loan", "add_approval_comments", "view_loan_details"],
  client: [
    "view_own_loans",
    "upload_documents",
    "view_own_transactions",
    "generate_own_reports",
    "download_statements",
  ],
  auditor: ["view_all_loans", "view_all_transactions", "view_audit_logs", "generate_reports", "export_data"],
}

// Mock users for demo
export const MOCK_USERS: User[] = [
  {
    id: "1",
    email: "admin@loanmanager.com",
    name: "james",
    role: "system_admin",
    avatar: "/user.png",
    department: "IT Administration",
    permissions: ROLE_PERMISSIONS.system_admin,
  },
  {
    id: "2",
    email: "officer@loanmanager.com",
    name: "Justine",
    role: "loan_officer",
    avatar: "/user.png",
    department: "Loan Processing",
    permissions: ROLE_PERMISSIONS.loan_officer,
  },
  {
    id: "3",
    email: "approver@loanmanager.com",
    name: "Fredrick",
    role: "approver",
    avatar: "/user.png",
    department: "Credit Approval",
    permissions: ROLE_PERMISSIONS.approver,
  },
  {
    id: "5",
    email: "auditor@loanmanager.com",
    name: "Kirui",
    role: "auditor",
    avatar: "/user.png",
    department: "Compliance",
    permissions: ROLE_PERMISSIONS.auditor,
  },
  {
    id: "4",
    email: "client@loanmanager.com",
    name: "David",
    role: "client",
    avatar: "/user.png",
    department: "Client",
    permissions: ROLE_PERMISSIONS.client,
  },
]

// Auth context and hooks
export function hasPermission(user: User | null, permission: string): boolean {
  return user?.permissions.includes(permission) ?? false
}

export function getRoleDisplayName(role: UserRole): string {
  const roleNames = {
    system_admin: "System Administrator",
    loan_officer: "Loan Officer",
    approver: "Loan Approver",
    client: "Client",
    auditor: "Auditor",
  }
  return roleNames[role]
}
