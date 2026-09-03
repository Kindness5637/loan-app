// Users.tsx - Rewritten to use DataTable component
import { useState } from "react";
import { DataTable, type DataTableConfig } from "@/components/DataTablePage";
import { Pencil, Trash2, FileText, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiService } from "@/services/api";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface User {
  id: number;
  name: string;
  email: string;
  roles: string[];
  member: string | null;
  created_at: string;
  updated_at: string;
}

export default function Users() {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    password: "",
    roles: [] as string[],
    member_id: null as number | null,
  });
  const [users, setUsers] = useState<User[]>([]);
  const { toast } = useToast();

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      password: "",
      roles: user.roles || [],
      member_id: user.member ? parseInt(user.member) : null,
    });
    setEditModalOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleUpdate = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const updateData: any = {
        name: editFormData.name,
        email: editFormData.email,
        roles: editFormData.roles,
      };

      if (editFormData.password) {
        updateData.password = editFormData.password;
      }

      if (editFormData.member_id) {
        updateData.member_id = editFormData.member_id;
      }

      await apiService.put(`/users/${selectedUser.id}`, updateData);
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      setEditModalOpen(false);
      // Trigger refresh by updating a key or calling a refresh function
      // window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      await apiService.delete(`/users/${selectedUser.id}`);
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      setDeleteDialogOpen(false);
      // window.location.reload(); 
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    autoTable(doc, {
      head: [["ID", "Name", "Email", "Roles", "Created At"]],
      body: users.map((user) => [
        user.id,
        user.name,
        user.email,
        user.roles.join(", ") || "None",
        formatDate(user.created_at),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`users-${Date.now()}.pdf`);
    toast({
      title: "Success",
      description: "Users exported to PDF",
    });
  };

  const exportToXML = () => {
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<users>
${users
  .map(
    (user) => `  <user>
    <id>${user.id}</id>
    <name>${user.name}</name>
    <email>${user.email}</email>
    <roles>${user.roles.join(", ")}</roles>
    <member>${user.member || ""}</member>
    <created_at>${user.created_at}</created_at>
    <updated_at>${user.updated_at}</updated_at>
  </user>`
  )
  .join("\n")}
</users>`;

    const blob = new Blob([xmlContent], { type: "text/xml" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${Date.now()}.xml`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Users exported to XML",
    });
  };

  const usersConfig: DataTableConfig<User> = {
    title: "Users Management",
    description: "View and manage user accounts",
    emptyStateMessage: "No users found",
    apiEndpoint: "/users",

    columns: [
      {
        key: "id",
        label: "ID",
        render: (user) => <span className="font-medium">{user.id}</span>,
        sortable: true,
        width: "80px",
      },
      {
        key: "name",
        label: "Name",
        sortable: true,
        searchable: true,
      },
      {
        key: "email",
        label: "Email",
        sortable: true,
        searchable: true,
      },
      {
        key: "roles",
        label: "Roles",
        render: (user) =>
          user.roles.length > 0 ? (
            <div className="flex gap-1 flex-wrap">
              {user.roles.map((role, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                >
                  {role}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">No roles</span>
          ),
        searchable: true,
      },
      {
        key: "created_at",
        label: "Created At",
        render: (user) => (
          <span className="text-muted-foreground">{formatDate(user.created_at)}</span>
        ),
        sortable: true,
      },
    ],

    stats: [
      {
        label: "Total Users",
        getValue: (data) => data.length,
      },
      {
        label: "Active This Month",
        getValue: (data) => {
          const now = new Date();
          return data.filter((user: User) => {
            const userDate = new Date(user.created_at);
            return (
              userDate.getMonth() === now.getMonth() &&
              userDate.getFullYear() === now.getFullYear()
            );
          }).length;
        },
      },
      {
        label: "With Roles",
        getValue: (data) =>
          data.filter((user: User) => user.roles.length > 0).length,
      },
    ],

    actions: [
      {
        label: "Edit",
        icon: <Pencil className="h-4 w-4" />,
        onClick: handleEditClick,
      },
      {
        label: "Delete",
        icon: <Trash2 className="h-4 w-4" />,
        onClick: handleDeleteClick,
        variant: "destructive",
        separator: true,
      },
    ],

    headerActions: (_data) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={exportToPDF}>
            <FileText className="h-4 w-4 mr-2" />
            Export as PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={exportToXML}>
            <FileCode className="h-4 w-4 mr-2" />
            Export as XML
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),

    searchPlaceholder: "Search by name, email, or role...",
    searchKeys: ["name", "email", "roles"],

    customFilters: (data, searchQuery) => {
      const query = searchQuery.toLowerCase();
      return data.filter((user: User) => {
        return (
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.roles.some((role) => role.toLowerCase().includes(query))
        );
      });
    },

    onDataLoad: (data) => {
      setUsers(data);
    },

    enableExport: true,
    enableColumnVisibility: true,
    defaultPageSize: 10,
    pageSizeOptions: [5, 10, 20, 50],
    defaultSort: {
      key: "created_at",
      direction: "desc",
    },
  };

  return (
    <>
      <DataTable config={usersConfig} />

      {/* Edit User Dialog */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update User</DialogTitle>
            <DialogDescription>
              Make changes to the user information here.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editFormData.email}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Leave blank to keep current password"
                value={editFormData.password}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, password: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roles">Roles (comma-separated)</Label>
              <Input
                id="roles"
                placeholder="e.g., loan_officer, approver"
                value={editFormData.roles.join(", ")}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    roles: e.target.value
                      .split(",")
                      .map((r) => r.trim())
                      .filter((r) => r),
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user
              account for {selectedUser?.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}