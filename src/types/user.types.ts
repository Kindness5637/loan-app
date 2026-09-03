export interface AgentInfo {
  agent_id_number: string;
  agent_name: string;
  agent_email: string;
  agent_phone: string;
  agent_image?: string;
}

export interface BusinessPartner {
  id_number?: string;
  phone?: string;
  dob?: string;
  gender?: string;
  nationality?: string;
  marital_status?: string;
  kra_pin?: string;
  address?: string;
  address2?: string;
  apartment_name?: string;
  postal_address?: string;
  nok_full_name?: string;
  nok_relation?: string;
  nok_phone?: string;
  nok_address?: string;
  position?: string;
  employment_type?: string;
  employer_name?: string;
  monthly_income?: number;
  employer_address?: string;
  bank_name?: string;
  bank_branch?: string;
  bank_account_number?: string;
  payment_mode?: string;
  agent?: AgentInfo;
}

export interface UserData {
  id: number;
  name: string;
  email: string;
  phone?: string;
  kyc_status?: string;
  created_at: string;
  national_id?: string;
  date_of_birth?: string;
  gender?: string;
  businesspartner?: BusinessPartner;
  agent?: AgentInfo;
}

export interface User {
  data: UserData;
}
