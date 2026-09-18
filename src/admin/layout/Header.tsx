import Header from "@/components/layout/Header";
import { useAuth } from "@/hooks/use-auth";
import type { User } from "@/lib/data";
import { apiService } from "@/services/api";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useView } from "@/contexts/viewContext";

const AdminHeader = () => {
  const { logout } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const { currentView, switchUser } = useView();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      let response = await apiService.getProfile();
      if (response.data.length != 0) {
        setUser(response.data);
      }
    };
    fetchProfile();
  }, []);
  const adminUser: User = {
    id: user?.id || 0,
    name: user?.name || "User",
    email: user?.email || "",
    organization_id: user?.organization_id || 0,
    email_verified_at: user?.email_verified_at || "",
    type: user?.type || 0,
    member_id: user?.member_id || null,
    is_admin: user?.is_admin || false,
    is_superadmin: user?.is_superadmin || 0,
    ext_ref: user?.ext_ref || null,
    created_at: user?.created_at || "",
    updated_at: user?.updated_at || "",
    user_id: user?.user_id || null,
    user_type: user?.user_type || 0,
    active_until: user?.active_until || "",
    package_id: user?.package_id || null,
    other_account_user_id: user?.other_account_user_id || null,
    roles: 0,
    agent: undefined,
    kyc_status: "",
    businesspartner: undefined
  };

  const mappedUserInfo = {
    name: adminUser.name,
    email: adminUser.email,
    avatar: undefined,
    initials: adminUser.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase(),
  };

  const signOut = async () => {
    await logout();
    window.location.href = "/login";
  };

  const profile = () => {
    navigate("/profile");
  };

  return (
    <Header
      // title="Loan Application Management System"
      title="Admin Dashboard"
      // subtitle="Admin Dashboard"
      // showSearch={true}
      showNotifications={true}
      showUserMenu={true}
      userInfo={mappedUserInfo}
      onSearch={(q) => console.log("Admin search:", q)}
      onProfileClick={profile}
      onSettingsClick={() =>
        console.log(
          `${currentView === "admin" ? "admin" : "client"} settings clicked`
        )
      }
      onSwitchUserView={() => {
        switchUser();
        navigate("/client");
      }}
      onLogoutClick={signOut}
    />
  );
};

export default AdminHeader;
