import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User,
  MapPin, 
  Briefcase, 
  Building2, 
  CreditCard, 
  UserCircle,
  Calendar,
  FileText,
  Edit,
  ArrowLeft,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { apiService } from '@/services/api';
import {type Member} from '@/types/member';


export function MemberView() {
  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const UpdateMember = async () => {
    navigate(`/members/update/${id}`)
  }

  useEffect(() => {
    const fetchMember = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const response = await apiService.get(`/members/${id}`);
        console.log(id);

        console.info(response);
        
        // Assuming response.data is the member object directly (not an array)
        // Removed the incorrect length check - adjust based on your API structure
        const memberData = response.data;
        setMember(memberData);
        
      } catch (error: any) {
        console.error('Failed to fetch member:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMember();
  }, [id]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="">Loading member profile...</p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="">Member not found</p>
      </div>
    );
  }

  // Helper function to safely parse float for financial calculations
  const safeParseFloat = (value: number): number => {
    return parseFloat(value.toString()) || 0;
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-8xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Back to Members
          </Button>
          <Button className="gap-2" onClick={UpdateMember}>
            <Edit className="h-4 w-4" />
            Update Member
          </Button>
        </div>

        {/* Member Header Card */}
        <Card className="border-none shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="h-24 w-24 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  {member.full_name.split(' ').map(n => n[0]).join('')}
                </div>
              </div>

              {/* Member Info */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{member.full_name}</h1>
                    <p className=" mt-1">{member.ocupation}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge variant={member.status === 1 ? "default" : "secondary"} className="bg-green-500">
                        {member.status === 1 ? (
                          <><CheckCircle2 className="h-3 w-3 mr-1" /> Active</>
                        ) : (
                          <><XCircle className="h-3 w-3 mr-1" /> Inactive</>
                        )}
                      </Badge>
                      <Badge variant="outline">Member #{member.CardCode}</Badge>
                      <Badge variant="outline">Group {member.GroupCode}</Badge>
                      <Badge variant={member.isRegFeePaid ? "default" : "destructive"}>
                        {member.isRegFeePaid ? "Reg Fee Paid" : "Reg Fee Pending"}
                      </Badge>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4 md:text-right">
                    <div>
                      <p className="text-sm ">Total Savings</p>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(member.total_savings)}</p>
                    </div>
                    <div>
                      <p className="text-sm ">Loan Balance</p>
                      <p className="text-lg font-bold text-orange-600">{formatCurrency(member.loan_balance)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* All Content in Single Page - Sequential Sections */}
        
        {/* Personal Information Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold border-b pb-2">Personal Information</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <InfoCard
              icon={<User className="h-5 w-5" />}
              title="Contact Information"
              items={[
                { label: "Email", value: member.email },
                { label: "Phone", value: member.phone },
                { label: "Phone 2", value: member.phone2 },
                { label: "ID Number", value: member.id_number.toString() },
                { label: "KRA PIN", value: member.kra_pin }
              ]}
            />

            <InfoCard
              icon={<Calendar className="h-5 w-5" />}
              title="Personal Details"
              items={[
                { label: "Date of Birth", value: formatDate(member.dob) },
                { label: "Gender", value: member.gender === 'm' ? 'Male' : 'Female' },
                { label: "Marital Status", value: member.marital_status },
                { label: "Nationality", value: member.nationality },
                { label: "Date of Joining", value: formatDate(member.date_of_joining) }
              ]}
            />

            <InfoCard
              icon={<MapPin className="h-5 w-5" />}
              title="Address Information"
              items={[
                { label: "Address", value: member.address },
                { label: "Address 2", value: member.address2 },
                { label: "Apartment", value: member.apartment_name },
                { label: "Postal Address", value: member.postal_address }
              ]}
            />

            <InfoCard
              icon={<FileText className="h-5 w-5" />}
              title="Membership Details"
              items={[
                { label: "Card Code", value: member.CardCode },
                { label: "Card Type", value: member.CardType },
                { label: "Group Code", value: member.GroupCode.toString() },
                { label: "Contribution Mode", value: member.mode_of_contribution === 'm' ? 'Monthly' : 'Other' },
                { label: "Opening Balance", value: formatCurrency(member.opening_balance) }
              ]}
            />
          </div>
        </section>

        {/* Employment Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold border-b pb-2">Employment Information</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <InfoCard
              icon={<Briefcase className="h-5 w-5" />}
              title="Employment Information"
              items={[
                { label: "Occupation", value: member.ocupation },
                { label: "Position", value: member.position },
                { label: "Employment Type", value: member.employment_type },
                { label: "Employer Name", value: member.employer_name }
              ]}
            />

            <InfoCard
              icon={<Building2 className="h-5 w-5" />}
              title="Employer Contact"
              items={[
                { label: "Employer Address", value: member.employer_address },
                { label: "Employer Phone", value: member.employer_phone },
                { label: "Employer Phone 2", value: member.employer_phone_2 }
              ]}
            />
          </div>
        </section>

        {/* Financial Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold border-b pb-2">Financial Information</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium ">Monthly Income</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(member.monthly_income)}</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium ">Other Income</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(member.others_income)}</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium ">Monthly Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(member.monthly_expenses)}</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-cyan-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium ">Total Savings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-cyan-600">{formatCurrency(member.total_savings)}</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium ">Loan Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(member.loan_balance)}</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-slate-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium ">Subscription Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-slate-600">{formatCurrency(member.subscription_balance)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
              <CardDescription>Overview of member's financial standing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="">Net Monthly Income</span>
                  <span className="font-semibold">
                    {formatCurrency(
                      (safeParseFloat(member.monthly_income) + 
                       safeParseFloat(member.others_income) - 
                       safeParseFloat(member.monthly_expenses)).toString()
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="">Total Income</span>
                  <span className="font-semibold">
                    {formatCurrency(
                      (safeParseFloat(member.monthly_income) + 
                       safeParseFloat(member.others_income)).toString()
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Next of Kin Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold border-b pb-2">Next of Kin</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <InfoCard
              icon={<UserCircle className="h-5 w-5" />}
              title="Next of Kin Information"
              items={[
                { label: "Full Name", value: member.nok_full_name },
                { label: "Relationship", value: member.nok_relation },
                { label: "Phone Number", value: member.nok_phone },
                { label: "Email", value: member.nok_email },
                { label: "Address", value: member.nok_address }
              ]}
            />
          </div>
        </section>

        {/* Banking Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold border-b pb-2">Banking Details</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <InfoCard
              icon={<CreditCard className="h-5 w-5" />}
              title="Banking Details"
              items={[
                { label: "Bank Name", value: member.bank_name },
                { label: "Branch", value: member.bank_branch },
                { label: "Account Number", value: member.bank_account_number },
                { label: "Payment Mode", value: member.payment_mode || 'Not specified' }
              ]}
            />
          </div>
        </section>

        {/* Footer Metadata */}
        <Card className="border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row justify-between text-sm ">
              <p>Created: {formatDate(member.created_at)}</p>
              <p>Last Updated: {formatDate(member.updated_at)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper Component
interface InfoCardProps {
  icon: React.ReactNode;
  title: string;
  items: { label: string; value: string }[];
}

function InfoCard({ icon, title, items }: InfoCardProps) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg text-blue-600">
            {icon}
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="flex flex-col space-y-1">
              <dt className="text-sm ">{item.label}</dt>
              <dd className="text-sm font-medium text-gray-900">{item.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
