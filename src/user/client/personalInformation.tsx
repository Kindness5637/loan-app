import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { formatDate } from "@/lib/utils";
import type { User as UserType } from "@/lib/data";
import {
  MapPin,
  Building,
  CreditCard,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  Phone,
  Mail,
  Calendar,
  Users,
  User2,
} from "lucide-react";

interface ClientData {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  kycStatus: string;
  registrationDate: string;
  nationalId?: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  maritalStatus?: string;
  kraPin?: string;
  residentialAddress?: string;
  postalAddress?: string;
  nextOfKin?: {
    name?: string;
    relationship?: string;
    phone?: string;
    address?: string;
  };
  occupation?: string;
  employmentType?: string;
  employerName?: string;
  monthlyIncome?: string | number;
  employerAddress?: string;
  bankName?: string;
  bankBranch?: string;
  bankAccountNumber?: string;
  preferredPaymentMethod?: string;
}

export function PersonalInformation() {
  const { user } = useAuth() as { user: UserType | null };
  console.log("user", user);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] px-4">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-semibold text-muted-foreground mb-2">
            Loading profile...
          </h2>
        </div>
      </div>
    );
  }

  // Safety check - if user doesn't have required fields, return error
  if (!user.id || !user.name) {
    console.error("User data is incomplete:", user);
    return (
      <div className="flex items-center justify-center min-h-[50vh] px-4">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-semibold text-muted-foreground mb-2">
            Unable to load profile
          </h2>
          <p className="text-sm text-muted-foreground">
            Please try refreshing the page
          </p>
        </div>
      </div>
    );
  }

  const clientData: ClientData = {
    id: user.id,
    fullName: user.name,
    email: user.email,
    phone: user.businesspartner?.phone,
    kycStatus: user.kyc_status || 'pending',
    registrationDate: user.created_at,
    nationalId: user.businesspartner?.id_number?.toString(),
    dateOfBirth: user.businesspartner?.dob,
    gender: user.businesspartner?.gender === 'm' ? 'Male' : 
            user.businesspartner?.gender === 'f' ? 'Female' : 
            user.businesspartner?.gender,
    nationality: user.businesspartner?.nationality,
    maritalStatus: user.businesspartner?.marital_status,
    kraPin: user.businesspartner?.kra_pin,
    residentialAddress: [
      user.businesspartner?.address, 
      user.businesspartner?.address2, 
      user.businesspartner?.apartment_name
    ]
      .filter(Boolean)
      .join(', '),
    postalAddress: user.businesspartner?.postal_address,
    nextOfKin: {
      name: user.businesspartner?.nok_full_name,
      relationship: user.businesspartner?.nok_relation,
      phone: user.businesspartner?.nok_phone,
      address: user.businesspartner?.nok_address,
    },
    occupation: user.businesspartner?.position,
    employmentType: user.businesspartner?.employment_type,
    employerName: user.businesspartner?.employer_name,
    monthlyIncome: user.businesspartner?.monthly_income,
    employerAddress: user.businesspartner?.employer_address,
    bankName: user.businesspartner?.bank_name,
    bankBranch: user.businesspartner?.bank_branch,
    bankAccountNumber: user.businesspartner?.bank_account_number,
    preferredPaymentMethod: user.businesspartner?.payment_mode === 'b' ? 'Bank Transfer' : 
                           user.businesspartner?.payment_mode === 'm' ? 'Mobile Money' : 
                           user.businesspartner?.payment_mode,
  };

  const getKYCStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "default";
      case "pending":
        return "secondary";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getKYCStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-4 w-4" />;
      case "pending":
        return <AlertCircle className="h-4 w-4" />;
      case "rejected":
        return <X className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const InfoItem = ({
    label,
    value,
    icon,
  }: {
    label: string;
    value?: string;
    icon?: React.ReactNode;
  }) => (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
      {icon && <div className="text-muted-foreground mt-0.5 flex-shrink-0">{icon}</div>}
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-sm sm:text-base text-foreground break-words">
          {value || "Not provided"}
        </p>
      </div>
    </div>
  );

  const DocumentCard = ({
    title,
    status,
    uploadDate,
  }: {
    title: string;
    status: string;
    uploadDate?: string;
  }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-sm sm:text-base">{title}</h4>
              {uploadDate && (
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Uploaded {formatDate(uploadDate)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 justify-end sm:justify-start">
            {getKYCStatusIcon(status)}
            <Badge variant={getKYCStatusColor(status)} className="text-xs">
              {status.toUpperCase()}
            </Badge>
          </div>
        </div>
        <div className="mt-4">
          <Button variant="outline" size="sm" className="w-full bg-transparent text-xs sm:text-sm">
            View Document
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Personal Information</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Your profile and KYC information
        </p>
      </div>

      {/* Profile Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Profile Card */}
        <Card className="lg:col-span-2">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0">
                <AvatarImage
                  src={"/placeholder.svg"}
                  alt={clientData.fullName}
                />
                <AvatarFallback className="text-xl sm:text-2xl">
                  {clientData.fullName
                    ? clientData.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                    : "??"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 w-full">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl sm:text-2xl font-bold truncate">{clientData.fullName}</h2>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{clientData.email}</span>
                    </p>
                    {clientData.phone && (
                      <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        <Phone className="h-4 w-4 flex-shrink-0" />
                        <span>{clientData.phone}</span>
                      </p>
                    )}
                  </div>
                  <Badge variant={getKYCStatusColor(clientData.kycStatus)} className="h-6 text-xs flex-shrink-0">
                    {clientData.kycStatus.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agent Information */}
        <Card className={!user.agent ? 'opacity-75' : ''}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <User2 className="h-5 w-5 text-primary flex-shrink-0" />
              <CardTitle className="text-base sm:text-lg">
                {user.agent ? 'Your Agent' : 'Agent Assignment'}
              </CardTitle>
            </div>
            <CardDescription className="text-xs sm:text-sm">
              {user.agent 
                ? 'Your dedicated agent'
                : 'You do not have an agent yet'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user.agent ? (
              <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                <Avatar className="h-12 w-12 sm:h-16 sm:w-16 flex-shrink-0">
                  <AvatarFallback className="text-base sm:text-lg">
                    {user.agent.agent_name
                      ? user.agent.agent_name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                      : "AG"}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-base sm:text-lg truncate">{user.agent.agent_name}</h3>
                    <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                    <p className="flex items-center gap-2">
                      <Phone className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">{user.agent.agent_phone || 'Not provided'}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">{user.agent.agent_email || 'Not provided'}</span>
                    </p>
                    {user.agent.agent_id_number && (
                      <p className="flex items-center gap-2 text-xs mt-1 text-muted-foreground/70">
                        <span className="font-medium">ID:</span> 
                        <span className="truncate">{user.agent.agent_id_number}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 sm:gap-4 opacity-70">
                <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <User2 className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2 flex-1">
                  <div className="h-5 sm:h-6 bg-muted rounded w-3/4 animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-3 sm:h-4 bg-muted rounded w-full max-w-[200px] animate-pulse"></div>
                    <div className="h-3 sm:h-4 bg-muted rounded w-5/6 max-w-[180px] animate-pulse"></div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="personal" className="space-y-4 sm:space-y-6">
        <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="personal" className="text-xs sm:text-sm px-2 py-2">
            Personal
          </TabsTrigger>
          <TabsTrigger value="contact" className="text-xs sm:text-sm px-2 py-2">
            Contact
          </TabsTrigger>
          <TabsTrigger value="employment" className="text-xs sm:text-sm px-2 py-2">
            Employment
          </TabsTrigger>
          <TabsTrigger value="documents" className="text-xs sm:text-sm px-2 py-2">
            Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <User2 className="h-5 w-5 flex-shrink-0" />
                <span>Personal Details</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Your basic personal information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                <InfoItem
                  label="Full Name"
                  value={clientData.fullName}
                  icon={<User2 className="h-4 w-4" />}
                />
                <InfoItem
                  label="National ID/Passport"
                  value={clientData.nationalId}
                  icon={<FileText className="h-4 w-4" />}
                />
                <InfoItem
                  label="Date of Birth"
                  value={
                    clientData.dateOfBirth
                      ? formatDate(clientData.dateOfBirth)
                      : undefined
                  }
                  icon={<Calendar className="h-4 w-4" />}
                />
                <InfoItem label="Gender" value={clientData.gender} />
                <InfoItem label="Nationality" value={clientData.nationality} />
                <InfoItem
                  label="Marital Status"
                  value={clientData.maritalStatus}
                />
              </div>
              <div className="mt-3 sm:mt-4">
                <InfoItem
                  label="KRA PIN"
                  value={clientData.kraPin}
                  icon={<FileText className="h-4 w-4" />}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <MapPin className="h-5 w-5 flex-shrink-0" />
                <span>Contact Information</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Your contact details and addresses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                <InfoItem
                  label="Mobile Phone"
                  value={clientData.phone}
                  icon={<Phone className="h-4 w-4" />}
                />
                <InfoItem
                  label="Email Address"
                  value={clientData.email}
                  icon={<Mail className="h-4 w-4" />}
                />
              </div>
              <div className="grid gap-3 sm:gap-4">
                <InfoItem
                  label="Residential Address"
                  value={clientData.residentialAddress}
                  icon={<MapPin className="h-4 w-4" />}
                />
                <InfoItem
                  label="Postal Address"
                  value={clientData.postalAddress}
                  icon={<MapPin className="h-4 w-4" />}
                />
              </div>

              {/* Next of Kin */}
              {clientData.nextOfKin && (
                <div className="border-t pt-4">
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5 flex-shrink-0" />
                    <span>Next of Kin</span>
                  </h3>
                  <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                    <InfoItem
                      label="Full Name"
                      value={clientData.nextOfKin.name}
                      icon={<User2 className="h-4 w-4" />}
                    />
                    <InfoItem
                      label="Relationship"
                      value={clientData.nextOfKin.relationship}
                    />
                    <InfoItem
                      label="Phone Number"
                      value={clientData.nextOfKin.phone}
                      icon={<Phone className="h-4 w-4" />}
                    />
                  </div>
                  <div className="mt-3 sm:mt-4">
                    <InfoItem
                      label="Address"
                      value={clientData.nextOfKin.address}
                      icon={<MapPin className="h-4 w-4" />}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Building className="h-5 w-5 flex-shrink-0" />
                <span>Employment Information</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Your employment and income details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                <InfoItem
                  label="Occupation/Job Title"
                  value={clientData.occupation}
                  icon={<Building className="h-4 w-4" />}
                />
                <InfoItem
                  label="Employment Type"
                  value={clientData.employmentType}
                />
                <InfoItem
                  label="Employer/Business Name"
                  value={clientData.employerName}
                  icon={<Building className="h-4 w-4" />}
                />
                <InfoItem
                  label="Monthly Income"
                  value={
                    clientData.monthlyIncome
                      ? `KES ${Number(clientData.monthlyIncome).toLocaleString()}`
                      : undefined
                  }
                />
              </div>
              {clientData.employerAddress && (
                <div className="mt-3 sm:mt-4">
                  <InfoItem
                    label="Employer/Business Address"
                    value={clientData.employerAddress}
                    icon={<MapPin className="h-4 w-4" />}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <CreditCard className="h-5 w-5 flex-shrink-0" />
                <span>Banking Information</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Your banking and payment details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                <InfoItem
                  label="Bank Name"
                  value={clientData.bankName}
                  icon={<Building className="h-4 w-4" />}
                />
                <InfoItem label="Bank Branch" value={clientData.bankBranch} />
                <InfoItem
                  label="Account Number"
                  value={clientData.bankAccountNumber}
                  icon={<CreditCard className="h-4 w-4" />}
                />
                {clientData.preferredPaymentMethod && (
                  <InfoItem
                    label="Preferred Payment Method"
                    value={clientData.preferredPaymentMethod}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <FileText className="h-5 w-5 flex-shrink-0" />
                <span>KYC Documents</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Your uploaded documents and their verification status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                <DocumentCard
                  title="National ID/Passport"
                  status="verified"
                  uploadDate={clientData.registrationDate}
                />
                <DocumentCard
                  title="Proof of Address"
                  status="verified"
                  uploadDate={clientData.registrationDate}
                />
                <DocumentCard
                  title="Passport Photo"
                  status="verified"
                  uploadDate={clientData.registrationDate}
                />
                <DocumentCard
                  title="KRA PIN Certificate"
                  status={clientData.kraPin ? "verified" : "not_uploaded"}
                  uploadDate={clientData.registrationDate}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}