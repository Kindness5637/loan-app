// AuditLogs.tsx - Rewritten to use DataTable component
import { DataTable, type DataTableConfig } from "@/components/DataTablePage";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, Eye, Download } from "lucide-react";

interface AuditLog {
  id: string | number;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ipAddress: string;
  details: string;
}

const actionIcons = {
  login: <CheckCircle className="h-4 w-4" />,
  logout: <XCircle className="h-4 w-4" />,
  create: <CheckCircle className="h-4 w-4" />,
  update: <AlertTriangle className="h-4 w-4" />,
  delete: <XCircle className="h-4 w-4" />,
  approve: <CheckCircle className="h-4 w-4" />,
  reject: <XCircle className="h-4 w-4" />,
  view: <Eye className="h-4 w-4" />,
  export: <Download className="h-4 w-4" />,
};

const severityColors = {
  low: "bg-green-500/10 text-green-500 border-green-500/20",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  high: "bg-red-500/10 text-red-500 border-red-500/20",
  critical: "bg-red-600/10 text-red-600 border-red-600/20",
};

export function AuditLogs() {
  const auditLogsConfig: DataTableConfig<AuditLog> = {
    title: "Audit Logs",
    description: "Track all system activities and user actions",
    emptyStateMessage: "No audit logs found",
    apiEndpoint: "/audit-logs", // Replace with your actual API endpoint

    columns: [
      {
        key: "timestamp",
        label: "Timestamp",
        render: (log) => (
          <span className="font-mono text-sm">
            {new Date(log.timestamp).toLocaleString()}
          </span>
        ),
        sortable: true,
        width: "180px",
      },
      {
        key: "user",
        label: "User",
        render: (log) => <span className="font-medium">{log.user}</span>,
        sortable: true,
        searchable: true,
      },
      {
        key: "action",
        label: "Action",
        render: (log) => (
          <div className="flex items-center gap-2">
            {actionIcons[log.action as keyof typeof actionIcons]}
            <span className="capitalize">{log.action}</span>
          </div>
        ),
        sortable: true,
        searchable: true,
      },
      {
        key: "resource",
        label: "Resource",
        sortable: true,
        searchable: true,
      },
      {
        key: "severity",
        label: "Severity",
        render: (log) => (
          <Badge
            variant="outline"
            className={severityColors[log.severity]}
          >
            {log.severity.toUpperCase()}
          </Badge>
        ),
        sortable: true,
        searchable: true,
      },
      {
        key: "ipAddress",
        label: "IP Address",
        render: (log) => (
          <span className="font-mono text-sm">{log.ipAddress}</span>
        ),
        sortable: true,
        searchable: true,
      },
      {
        key: "details",
        label: "Details",
        render: (log) => (
          <span className="max-w-xs truncate block" title={log.details}>
            {log.details}
          </span>
        ),
        searchable: true,
        exportable: true,
      },
    ],

    stats: [
      {
        label: "Successful Actions",
        getValue: (data: AuditLog[]) =>
          data.filter((log) =>
            ["login", "create", "approve"].includes(log.action)
          ).length,
        description: "Login, create, and approve actions",
      },
      {
        label: "Warning Events",
        getValue: (data: AuditLog[]) =>
          data.filter((log) => log.severity === "medium").length,
        description: "Medium severity events",
      },
      {
        label: "Critical Events",
        getValue: (data: AuditLog[]) =>
          data.filter((log) => log.severity === "critical").length,
        description: "High priority incidents",
      },
      {
        label: "Recent Activity (24h)",
        getValue: (data: AuditLog[]) =>
          data.filter(
            (log) =>
              new Date(log.timestamp) >
              new Date(Date.now() - 24 * 60 * 60 * 1000)
          ).length,
        description: "Activities in the last 24 hours",
      },
    ],

    actions: [
      {
        label: "View Details",
        icon: <Eye className="h-4 w-4" />,
        onClick: (log) => {
          console.log("View log details:", log);
          // Implement view details functionality
        },
      },
    ],

    searchPlaceholder: "Search logs by user, action, resource, or details...",
    searchKeys: ["user", "action", "resource", "details", "ipAddress"],

    // Custom filters for advanced filtering
    customFilters: (data, searchQuery) => {
      const query = searchQuery.toLowerCase();
      return data.filter((log: AuditLog) => {
        return (
          log.user.toLowerCase().includes(query) ||
          log.action.toLowerCase().includes(query) ||
          log.resource.toLowerCase().includes(query) ||
          log.details.toLowerCase().includes(query) ||
          log.ipAddress.toLowerCase().includes(query) ||
          log.severity.toLowerCase().includes(query)
        );
      });
    },

    enableExport: true,
    enableColumnVisibility: true,
    defaultPageSize: 20,
    pageSizeOptions: [10, 20, 50, 100],
    defaultSort: {
      key: "timestamp",
      direction: "desc",
    },
    refreshInterval: 30000, // Auto-refresh every 30 seconds
  };

  return <DataTable config={auditLogsConfig} />;
}