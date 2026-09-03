import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { User, Mail, Calendar, Shield } from "lucide-react"
import { Separator } from "@radix-ui/react-separator"
import { useAuth } from "@/hooks/use-auth"
import { apiService } from "@/services/api"
import { formatDate } from "@/lib/utils"

interface Role {
  value: string
  label: string
  description: string
  bit_value: number
}

interface ProfileData {
  id: number
  name: string
  organization_id: number
  email: string
  email_verified_at: string | null
  type: number
  member_id: number | null
  is_admin: boolean
  is_superadmin: number
  ext_ref: string | null
  created_at: string
  updated_at: string
  user_id: number | null
  user_type: number // bitmask for roles
  active_until: string
  package_id: number | null
  other_account_user_id: number | null
  roles?: Role[]
}

export function UserProfile() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [allRoles, setAllRoles] = useState<Role[]>([])
  const { user } = useAuth()

  const getRoles = async () => {
    try {
      setLoading(true)
      const response = await apiService.get("user-roles")
      setAllRoles(response.data as Role[])
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while fetching roles")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getRoles()
  }, [])

  // ✅ Correctly maps the user_type bitmask to roles
  const getUserRoles = (userType: number): Role[] => {
    if (!userType || !Array.isArray(allRoles)) return []
    return allRoles.filter(role => (userType & role.bit_value) !== 0)
  }

  useEffect(() => {
    if (user) {
      const roles = getUserRoles(user.roles)
      setProfile({ ...(user as unknown as ProfileData), roles })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, allRoles])

  if (loading) return <ProfileSkeleton />

  if (error || !profile) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Profile</CardTitle>
            <CardDescription>{error || "Profile data not available"}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-8xl">
      <Card className="flex items-center justify-between mb-8 p-6 shadow-lg">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">{profile.name}</h1>
          <p className="text-gray-400 flex items-center">
            <Calendar className="mr-2 h-4 w-4" /> Member since {formatDate(profile.created_at)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {profile.roles && profile.roles.length > 0 ? (
            profile.roles.map(role => (
              <Badge key={role.value} variant="outline" className="bg-primary/10 text-primary">
                {role.label}
              </Badge>
            ))
          ) : (
            <Badge variant="secondary">Client</Badge>
          )}
        </div>
      </Card>

      <Separator />

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-8">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" /> Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{profile.email}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email Verification</p>
                <Badge variant={profile.email_verified_at ? "default" : "secondary"}>
                  {profile.email_verified_at ? "Verified" : "Not Verified"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Permissions & Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" /> Permissions & Status
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex flex-wrap gap-2">
              {profile.roles && profile.roles.length > 0 ? (
                profile.roles.map(role => (
                  <Badge
                    key={role.value}
                    variant="default"
                    className={
                      role.value === "system_administrator"
                        ? "bg-destructive text-destructive-foreground"
                        : "bg-primary/10 text-primary"
                    }
                  >
                    {role.label}
                  </Badge>
                ))
              ) : (
                <Badge variant="secondary">Standard User</Badge>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Until</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{formatDate(profile.active_until)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">External Reference</p>
                <p className="font-mono text-sm">{profile.ext_ref || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" /> Account Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Account Created</p>
                <p className="font-medium">{formatDate(profile.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Last Updated</p>
                <p className="font-medium">{formatDate(profile.updated_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-8xl">
      <div className="mb-8">
        <Skeleton className="h-40 w-full mb-2" />
      </div>
      <div className="grid gap-6">
        {[1].map(i => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
