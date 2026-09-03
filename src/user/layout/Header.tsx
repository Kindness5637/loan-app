import Header from "@/components/layout/Header"
import { useView } from "@/contexts/viewContext"
import { useNavigate } from "react-router-dom"

const ClientHeader = () => {
  const { switchUser } = useView()
    const navigate = useNavigate()
  const clientUser = {
    name: "John Doe",
    email: "john.doe@example.com",
    initials: "JD"
  }

  const handleSearch = (query: string) => {
    console.log("Client search:", query)
  }

  const handleProfileClick = () => {
    navigate("/client/profile")
  }

  const handleSettingsClick = () => {
    navigate("/client/settings")
  }

  const handleLogoutClick = () => {
    navigate("/login")
  }
  
  return (
    <div className=""> 
      
      <Header
        title="Client Portal"
        showSearch={false}
        showUserMenu={true}
        userInfo={clientUser}
        onSearch={handleSearch}
        onProfileClick={handleProfileClick}
        onSettingsClick={handleSettingsClick}
        onSwitchUserView={() => {
          switchUser();
          navigate("/"); 
        }}
        onLogoutClick={handleLogoutClick}
        showNotifications={false}
        notificationCount={0}
      />
    </div>

  )
}

export default ClientHeader