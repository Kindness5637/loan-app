import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Loader2, ArrowLeft, X, Search, User, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiService } from "@/services/api";
import { toast } from "sonner";

interface Member {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  id_number: string;
}

interface Role {
  value: string;
  label: string;
}

interface UserFormData {
  member_id: number | null;
  email: string;
  password: string;
  roles: string[];
}

export const CreateUser = () => {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");

  const [formData, setFormData] = useState<UserFormData>({
    member_id: null,
    email: "",
    password: "",
    roles: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load members and roles on mount
  useEffect(() => {
    loadMembers();
    loadRoles();
  }, []);

  const loadMembers = async () => {
    try {
      setIsLoadingMembers(true);
      const response = await apiService.get("/members");
      if (response.data) {
        setMembers(response.data);
      }
    } catch (error) {
      console.error("Failed to load members:", error);
      toast.error("Failed to load members");
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await apiService.get("/user-roles");
      console.log("Roles API response:", response);

      // Handle nested data structure
      let rolesData = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          rolesData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          rolesData = response.data.data;
        }
      }

      console.log("Processed roles:", rolesData);
      setAvailableRoles(rolesData);
    } catch (error) {
      console.error("Failed to load roles:", error);
      toast.error("Failed to load roles");
      setAvailableRoles([]);
    }
  };

  const handleMemberSelect = (member: Member) => {
    setSelectedMember(member);
    setFormData((prev) => ({
      ...prev,
      member_id: member.id,
      email: member.email || "",
    }));
    setIsSearchOpen(false);
    setSearchQuery("");

    // Clear member selection error
    if (errors.member_id) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.member_id;
        return newErrors;
      });
    }
  };

  const addRole = (roleValue: string) => {
    if (roleValue && !formData.roles.includes(roleValue)) {
      setFormData((prev) => ({
        ...prev,
        roles: [...prev.roles, roleValue],
      }));
      setSelectedRole("");

      // Clear roles error
      if (errors.roles) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.roles;
          return newErrors;
        });
      }
    }
  };

  const removeRole = (roleValue: string) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.filter((r) => r !== roleValue),
    }));
  };

  const handleEmailChange = (value: string) => {
    setFormData((prev) => ({ ...prev, email: value }));

    // Clear email error
    if (errors.email) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.email;
        return newErrors;
      });
    }
  };

  const handlePasswordChange = (value: string) => {
    setFormData((prev) => ({ ...prev, password: value }));

    // Clear password error
    if (errors.password) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.password;
        return newErrors;
      });
    }
  };

  const filteredMembers = members.filter(
    (member) =>
      member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.id_number.includes(searchQuery) ||
      member.id.toString().includes(searchQuery),
  );

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.member_id) {
      newErrors.member_id = "Please select a member";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = "Password must contain at least 1 uppercase letter";
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password = "Password must contain at least 1 lowercase letter";
    }

    if (formData.roles.length === 0) {
      newErrors.roles = "At least one role is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    if (!selectedMember) {
      toast.error("Please select a member");
      return;
    }

    const submitData = {
      member_id: formData.member_id as number,
      name: selectedMember.full_name,
      email: formData.email,
      password: formData.password,
      roles: formData.roles,
    };

    try {
      setIsSaving(true);
      const response = await apiService.post("/users", submitData);
      console.log("User creation response:", response);
      toast.success("User created successfully");
      navigate("/users");
    } catch (error: unknown) {
      console.error("Failed to create user:", error);
      toast.error("Failed to create user", {
        description: (error as Error)?.message || "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Card className="border-b rounded-none">
        <div className="mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/users")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold">Create User</h1>
          </div>
        </div>
      </Card>

      {/* Content */}
      <div className="mx-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Member Selection Card */}
          <Card>
            <CardHeader>
              <CardTitle>Select Member</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>
                  Member<span className="text-red-500">*</span>
                </Label>
                <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isSearchOpen}
                      className={`w-full justify-between ${
                        errors.member_id ? "border-red-500" : ""
                      }`}
                    >
                      {selectedMember ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{selectedMember.full_name}</span>
                          <span className="text-muted-foreground">
                            ({selectedMember.email})
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">
                          Search and select a member...
                        </span>
                      )}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[600px] p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search by name, email, or ID..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                      />
                      <CommandEmpty>
                        {isLoadingMembers
                          ? "Loading members..."
                          : "No members found."}
                      </CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-auto">
                        {filteredMembers.map((member) => (
                          <CommandItem
                            key={member.id}
                            onSelect={() => handleMemberSelect(member)}
                            className="flex items-center justify-between"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {member.full_name}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {member.email} • ID: {member.id_number}
                              </span>
                            </div>
                            {selectedMember?.id === member.id && (
                              <Check className="h-4 w-4" />
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                {errors.member_id && (
                  <p className="text-xs text-red-500">{errors.member_id}</p>
                )}
              </div>

              {/* Display selected member info */}
              {selectedMember && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Member Information</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>
                      <p className="font-medium">{selectedMember.full_name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone:</span>
                      <p className="font-medium">{selectedMember.phone}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">ID Number:</span>
                      <p className="font-medium">{selectedMember.id_number}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className={errors.email ? "border-red-500" : ""}
                  placeholder="user@example.com"
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className={errors.password ? "border-red-500" : ""}
                  placeholder="Enter password"
                />
                {errors.password && (
                  <p className="text-xs text-red-500">{errors.password}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters with at least 1 uppercase and 1
                  lowercase letter
                </p>
              </div>

              {/* Roles Selection */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="roles">
                    User Roles<span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={selectedRole}
                    onValueChange={(value) => {
                      console.log("Selected role:", value);
                      setSelectedRole(value);
                      addRole(value);
                    }}
                  >
                    <SelectTrigger
                      className={errors.roles ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="Select roles to add" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.length === 0 ? (
                        <SelectItem value="loading" disabled>
                          Loading roles...
                        </SelectItem>
                      ) : (
                        availableRoles
                          .filter(
                            (role) => !formData.roles.includes(role.value),
                          )
                          .map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                  {errors.roles && (
                    <p className="text-xs text-red-500">{errors.roles}</p>
                  )}
                  {availableRoles.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Loading available roles...
                    </p>
                  )}
                </div>

                {/* Selected Roles Display */}
                {formData.roles.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected Roles:</Label>
                    <div className="flex flex-wrap gap-2">
                      {formData.roles.map((role) => (
                        <div
                          key={role}
                          className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-md text-sm font-medium"
                        >
                          <span>
                            {availableRoles.find((r) => r.value === role)
                              ?.label || role}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeRole(role)}
                            className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/users")}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating User...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create User
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
