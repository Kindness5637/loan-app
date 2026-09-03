// MemberEdit.tsx - Edit page for a single member
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiService } from '@/services/api';
import { toast } from 'react-toastify';

// Updated interface to exactly match the required API structure for GET and PATCH
interface ClientDetails {
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
}

interface Member {
  encodedKey: string;
  id: string;
  creationDate: string;
  lastModifiedDate: string;
  activationDate?: string;
  approvedDate?: string;
  full_name: string;
  gender: string;
  id_number: string;
  phone: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  preferredLanguage?: string;
  clientRoleKey?: string;
  loanCycle?: number;
  state?: string;
  _Client_Details?: ClientDetails;
}

const getStatusBadge = (state?: string) => {
  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-500',
    INACTIVE: 'bg-gray-500',
    PENDING_APPROVAL: 'bg-yellow-500',
    REJECTED: 'bg-red-500',
  };
  const color = statusColors[state || 'ACTIVE'] || 'bg-green-500';
  
  return (
    <Badge className={`${color} text-white`}>
      {state || 'ACTIVE'}
    </Badge>
  );
};

export const MemberEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Member>({
    encodedKey: '',
    id: '',
    creationDate: '',
    lastModifiedDate: '',
    activationDate: '',
    approvedDate: '',
    full_name: '',
    gender: '',
    id_number: '',
    phone: '',
    firstName: '',
    lastName: '',
    middleName: '',
    preferredLanguage: 'ENGLISH',
    clientRoleKey: '',
    loanCycle: 0,
    state: 'ACTIVE',
    _Client_Details: {},
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) {
      fetchMemberData();
    }
  }, [id]);

  const fetchMemberData = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.get(`/members/${id}`);
      const memberData: Member = response.data;
      
      // Ensure _Client_Details exists (initialize if missing)
      if (!memberData._Client_Details) {
        memberData._Client_Details = {};
      }

      if (typeof memberData.state === 'undefined' && memberData.id_number) {
        memberData.state = 'ACTIVE';
      }

      setFormData(memberData);
      console.info('Fetched member data:', memberData); // For debugging
    } catch (error: any) {
      console.error('Failed to fetch member:', error);
      toast.error('Failed to load member details');
      navigate(-1);
    } finally {
      setIsLoading(false);
    }
  };

        //spliting full name

  let memberFirstName = "";
  let memberMiddleName = "";
  let memberLastName = "";
  if (formData.full_name) {
    const memberName = formData.full_name.trim().split(" ");
    if (memberName.length === 2) {
      memberFirstName = memberName[0];
      memberLastName = memberName[1];
    } else if (memberName.length === 3) {
      memberFirstName = memberName[0];
      memberMiddleName = memberName[1];
      memberLastName = memberName[2];
    } else {
      memberFirstName = memberName[0];
    }

    console.log({ memberFirstName, memberMiddleName, memberLastName });
  }

  const handleInputChange = (field: string, value: any, isClientDetail = false) => {
    if (isClientDetail) {
      setFormData(prev => ({
        ...prev,
        _Client_Details: {
          ...prev._Client_Details,
          [field]: value,
        },
      }));
    } else {
      // For top-level fields like firstName, also update full_name if it's a name field
      let updatedValue = value;
      if (field === 'firstName' || field === 'lastName' || field === 'middleName') {
        const fullName = `${formData.firstName || ''} ${formData.middleName || ''} ${formData.lastName || ''}`.trim();
        updatedValue = { ...formData, full_name: fullName.replace(/\s+/g, ' ') };
      }
      setFormData(prev => ({ ...prev, [field]: value, ...(field === 'firstName' || field === 'lastName' || field === 'middleName' ? { full_name: updatedValue.full_name } : {}) }));
    }
    
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName?.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    // if (!formData.id_number?.trim()) {
    //   newErrors.id_number = 'ID number is required';
    // }
    if (!formData.phone?.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    if (!formData.gender?.trim()) {
      newErrors.gender = 'Gender is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const MemberUpdate = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      setIsSaving(true);
      
      // Construct full update payload matching the exact required structure
      // Preserve read-only fields from fetched data
      // Compute full_name from name parts
      const fullName = `${formData.firstName} ${formData.middleName || ''} ${formData.lastName}`.trim();
      
      const updatePayload: Member = {
        encodedKey: formData.encodedKey,
        id: formData.id,
        creationDate: formData.creationDate,
        lastModifiedDate: formData.lastModifiedDate,
        activationDate: formData.activationDate,
        approvedDate: formData.approvedDate,
        full_name: fullName,
        gender: formData.gender,
        id_number: formData.id_number,
        phone: formData.phone,
        firstName: formData.firstName,
        lastName: formData.lastName,
        middleName: formData.middleName,
        preferredLanguage: formData.preferredLanguage,
        clientRoleKey: formData.clientRoleKey,
        loanCycle: formData.loanCycle || 0,
        state: formData.state,
        _Client_Details: {
          ...formData._Client_Details,
          postal_address: formData._Client_Details?.postal_address || '',
          nok_address: formData._Client_Details?.nok_address || '',
          ocupation: formData._Client_Details?.ocupation || '',
          address: formData._Client_Details?.address || '',
          nok_email: formData._Client_Details?.nok_email || '',
          nok_phone: formData._Client_Details?.nok_phone || '',
          employer_phone: formData._Client_Details?.employer_phone || '',
          apartment_name: formData._Client_Details?.apartment_name || '',
          employer_name: formData._Client_Details?.employer_name || '',
          monthly_income: formData._Client_Details?.monthly_income || '0.00',
          others_income: formData._Client_Details?.others_income || '0.00',
          employer_address: formData._Client_Details?.employer_address || '',
          marital_status: formData._Client_Details?.marital_status || '',
          nok_full_name: formData._Client_Details?.nok_full_name || '',
          employer_phone_2: formData._Client_Details?.employer_phone_2 || '',
          position: formData._Client_Details?.position || '',
          nok_relation: formData._Client_Details?.nok_relation || '',
          monthly_expenses: formData._Client_Details?.monthly_expenses || '0.00',
        },
      };

      console.info('Update payload:', updatePayload);

      await apiService.patch(`/members/${id}`, updatePayload);
      toast.success('Member updated successfully');
      navigate(`/members/view/${id}`);
    } catch (error: any) {
      console.error('Failed to update member:', error);
      toast.error('Failed to update member');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading member details...</p>
        </div>
      </div>
    );
  }

  // const fullName = `${formData.firstName} ${formData.middleName || ''} ${formData.lastName}`.trim();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <Card className="p-6 border border-b-solid rounded-lg space-y-6 mx-auto shadow-md">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/members')}
            className="mb-4 flex items-center gap-2 border border-b-solid"
          >
            <ArrowLeft size={20} />
            <span className="">Back to Members</span>
          </Button>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-1">Update Member</h1>
              <p className="text-muted-foreground">
                {formData.full_name} - ID: {formData.id}
              </p>
            </div>
            {getStatusBadge(formData.state)}
          </div>
        </div>
      </Card>

      {/* Content */}
      <div className="max-w-8xl mx-auto p-6 space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update member's personal details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName || ''}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={errors.firstName ? 'border-red-500' : ''}
                  placeholder={`${memberFirstName}`}
                />
                {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName || ''}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={errors.lastName ? 'border-red-500' : ''}
                  placeholder={`${memberLastName}`}
                />
                {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="middleName">Middle Name</Label>
                <Input
                  id="middleName"
                  value={formData.middleName || ''}
                  onChange={(e) => handleInputChange('middleName', e.target.value)}
                  placeholder={`${memberMiddleName}`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="id_number">ID Number *</Label>
                <Input
                  id="id_number"
                  value={formData.id_number || ''}
                  onChange={(e) => handleInputChange('id_number', e.target.value)}
                  className={errors.id_number ? 'border-red-500' : ''}
                />
                {errors.id_number && <p className="text-xs text-red-500">{errors.id_number}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select
                  value={formData.gender || ''}
                  onValueChange={(value) => handleInputChange('gender', value)}
                >
                  <SelectTrigger className={errors.gender ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="m">Male</SelectItem>
                    <SelectItem value="f">Female</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && <p className="text-xs text-red-500">{errors.gender}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferredLanguage">Preferred Language</Label>
                <Select
                  value={formData.preferredLanguage || 'ENGLISH'}
                  onValueChange={(value) => handleInputChange('preferredLanguage', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENGLISH">English</SelectItem>
                    <SelectItem value="SWAHILI">Swahili</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="marital_status">Marital Status</Label>
                <Select
                  value={formData._Client_Details?.marital_status || ''}
                  onValueChange={(value) => handleInputChange('marital_status', value, true)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                    <SelectItem value="widowed">Widowed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact & Address Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact & Address Information</CardTitle>
            <CardDescription>Update contact and address details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postal_address">Postal Address</Label>
                <Input
                  id="postal_address"
                  value={formData._Client_Details?.postal_address || ''}
                  onChange={(e) => handleInputChange('postal_address', e.target.value, true)}
                  placeholder="P.O Box 12345-00100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Physical Address</Label>
                <Input
                  id="address"
                  value={formData._Client_Details?.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value, true)}
                  placeholder="123 Main Street"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="apartment_name">Apartment/Building</Label>
                <Input
                  id="apartment_name"
                  value={formData._Client_Details?.apartment_name || ''}
                  onChange={(e) => handleInputChange('apartment_name', e.target.value, true)}
                  placeholder="Sunshine Apartments"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employment Information */}
        <Card>
          <CardHeader>
            <CardTitle>Employment Information</CardTitle>
            <CardDescription>Update employment and occupation details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ocupation">Occupation</Label>
                <Input
                  id="ocupation"
                  value={formData._Client_Details?.ocupation || ''}
                  onChange={(e) => handleInputChange('ocupation', e.target.value, true)}
                  placeholder="Software Engineer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={formData._Client_Details?.position || ''}
                  onChange={(e) => handleInputChange('position', e.target.value, true)}
                  placeholder="Senior Developer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employer_name">Employer Name</Label>
                <Input
                  id="employer_name"
                  value={formData._Client_Details?.employer_name || ''}
                  onChange={(e) => handleInputChange('employer_name', e.target.value, true)}
                  placeholder="Tech Solutions Ltd"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employer_address">Employer Address</Label>
                <Input
                  id="employer_address"
                  value={formData._Client_Details?.employer_address || ''}
                  onChange={(e) => handleInputChange('employer_address', e.target.value, true)}
                  placeholder="456 Business Park"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employer_phone">Employer Phone</Label>
                <Input
                  id="employer_phone"
                  value={formData._Client_Details?.employer_phone || ''}
                  onChange={(e) => handleInputChange('employer_phone', e.target.value, true)}
                  placeholder="0712343211"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employer_phone_2">Employer Phone 2</Label>
                <Input
                  id="employer_phone_2"
                  value={formData._Client_Details?.employer_phone_2 || ''}
                  onChange={(e) => handleInputChange('employer_phone_2', e.target.value, true)}
                  placeholder="0717654111"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Information</CardTitle>
            <CardDescription>Update income and expense details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthly_income">Monthly Income</Label>
                <Input
                  id="monthly_income"
                  type="number"
                  step="0.01"
                  value={formData._Client_Details?.monthly_income || ''}
                  onChange={(e) => handleInputChange('monthly_income', e.target.value, true)}
                  placeholder="75000.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="others_income">Other Income</Label>
                <Input
                  id="others_income"
                  type="number"
                  step="0.01"
                  value={formData._Client_Details?.others_income || ''}
                  onChange={(e) => handleInputChange('others_income', e.target.value, true)}
                  placeholder="15000.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthly_expenses">Monthly Expenses</Label>
                <Input
                  id="monthly_expenses"
                  type="number"
                  step="0.01"
                  value={formData._Client_Details?.monthly_expenses || ''}
                  onChange={(e) => handleInputChange('monthly_expenses', e.target.value, true)}
                  placeholder="50000.00"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next of Kin */}
        <Card>
          <CardHeader>
            <CardTitle>Next of Kin</CardTitle>
            <CardDescription>Update emergency contact information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nok_full_name">Full Name</Label>
                <Input
                  id="nok_full_name"
                  value={formData._Client_Details?.nok_full_name || ''}
                  onChange={(e) => handleInputChange('nok_full_name', e.target.value, true)}
                  placeholder="Jane Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nok_relation">Relationship</Label>
                <Input
                  id="nok_relation"
                  value={formData._Client_Details?.nok_relation || ''}
                  onChange={(e) => handleInputChange('nok_relation', e.target.value, true)}
                  placeholder="Spouse"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nok_phone">Phone</Label>
                <Input
                  id="nok_phone"
                  value={formData._Client_Details?.nok_phone || ''}
                  onChange={(e) => handleInputChange('nok_phone', e.target.value, true)}
                  placeholder="0712335432"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nok_email">Email</Label>
                <Input
                  id="nok_email"
                  type="email"
                  value={formData._Client_Details?.nok_email || ''}
                  onChange={(e) => handleInputChange('nok_email', e.target.value, true)}
                  placeholder="test@example.com"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="nok_address">Address</Label>
                <Input
                  id="nok_address"
                  value={formData._Client_Details?.nok_address || ''}
                  onChange={(e) => handleInputChange('nok_address', e.target.value, true)}
                  placeholder="123 Main Street, Nairobi"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/members/view/${id}`)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={MemberUpdate} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                updating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                update member
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
