export type LoanStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "rejected"
  | "disbursed"
  | "cleared";
export type TransactionType = "disbursement" | "payment" | "fee" | "interest";

export interface UserResponse {
data: {
  agent: any;
  kyc_status: string;
  businesspartner: any;
  id: number;
  name: string;
  organization_id: number;
  email: string;
  email_verified_at: string;
  type: number;
  roles: number;
  member_id: number | null;
  is_admin: boolean;
  is_superadmin: number;
  ext_ref: string | null;
  created_at: string;
  updated_at: string;
  user_id: number | null;
  user_type: number;
  active_until: string;
  package_id: number | null;
  other_account_user_id: number | null;
}
}

export type User = UserResponse['data'];

export interface UserProfile {
  data: User;
}

export interface Client {
  id: string;
  // Personal Information
  fullName: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  nationality: string;
  maritalStatus: "single" | "married" | "divorced" | "widowed";
  avatar?: string;

  // ID
  nationalId: string;
  passportNumber?: string;
  kraPin: string;

  // Contact Information
  phone: string;
  email: string;
  postalAddress: string;
  residentialAddress: string;

  // Employment Information
  occupation: string;
  employmentType: "permanent" | "contract" | "self_employed"; // enum
  employerName?: string;
  businessName?: string;
  employerAddress?: string;
  businessAddress?: string;
  monthlyIncome: number;
  annualIncome: number;

  // Banking Information
  bankName: string;
  bankBranch: string;
  bankAccountNumber: string;
  preferredPaymentMethod: "bank_transfer" | "mobile_money" | "cheque";

  // Next of Kin
  nextOfKin: {
    name: string;
    relationship: string;
    phone: string;
    address: string;
  };

  // KYC Documents
  documents: {
    idPassport: string[];
    proofOfAddress: string[];
    passportPhoto: string[];
    payslips: string[];
    bankStatements: string[];
    businessRegistration?: string[];
    taxComplianceCertificate?: string[];
  };

  // System fields
  memberNumber: string;
  registrationDate: string;
  kycStatus: "pending" | "verified" | "rejected";
  status: "active" | "inactive" | "suspended";
}

export interface LoanApplication {
  id: string;
  clientId: string;
  clientName: string;
  memberNumber: string;

  // Loan Details
  amount: number;
  purpose: string;
  loanType: string;
  status: LoanStatus;
  applicationDate: string;
  approvalDate?: string;
  disbursementDate?: string;

  // Terms
  interestRate: number;
  term: number; // in months
  monthlyPayment: number;
  totalAmount: number;

  // Staff Assignment
  officerId: string;
  officerName: string;
  approverId?: string;
  approverName?: string;

  // Processing
  comments?: string;
  rejectionReason?: string;

  // Documents
  requiredDocuments: string[];
  uploadedDocuments: string[];

  // Repayment Tracking
  disbursedAmount: number;
  outstandingBalance: number;
  totalPaid: number;
  nextPaymentDate: string;
  paymentSchedule: PaymentSchedule[];
}

export interface PaymentSchedule {
  id: string;
  loanId: string;
  paymentNumber: number;
  dueDate: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  status: "pending" | "paid" | "overdue" | "partial";
  paidAmount?: number;
  paidDate?: string;
}

export interface Transaction {
  id: string;
  loanId: string;
  clientId: string;
  clientName: string;
  memberNumber: string;
  type: TransactionType;
  amount: number;
  date: string;
  description: string;
  balance: number;
  reference: string;
  paymentMethod: "bank_transfer" | "mobile_money" | "cash" | "cheque";
  processedBy: string;
  status: "pending" | "completed" | "failed" | "cancelled";
}

export interface DashboardMetrics {
  totalLoans: number;
  pendingApprovals: number;
  rejectedLoans: number;
  totalRepayments: number;
  totalOutstanding: number;
  activeClients: number;
  portfolioValue: number;
  defaultRate: number;
  approvalRate: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  resourceId?: string;
  severity: "low" | "medium" | "high" | "critical";
  ipAddress: string;
  userAgent?: string;
  details: string;
  success: boolean;
}

//loan applications
export const MOCK_LOANS: LoanApplication[] = [
  {
    id: "LN001",
    clientId: "4",
    clientName: "David James Thompson",
    memberNumber: "LAMS001",
    amount: 50000,
    purpose: "Business Expansion",
    loanType: "Business Loan",
    status: "pending",
    applicationDate: "2024-01-15",
    officerId: "2",
    officerName: "Michael Chen",
    interestRate: 8.5,
    term: 36,
    monthlyPayment: 1580.45,
    totalAmount: 56896.2,
    requiredDocuments: [
      "National ID/Passport",
      "Proof of Address",
      "Business Registration",
      "Tax Compliance Certificate",
      "Bank Statements (6 months)",
      "Business Income Statement",
    ],
    uploadedDocuments: [
      "national_id.pdf",
      "business_registration.pdf",
      "tax_compliance.pdf",
      "bank_statements.pdf",
    ],
    disbursedAmount: 0,
    outstandingBalance: 0,
    totalPaid: 0,
    nextPaymentDate: "2024-03-15",
    paymentSchedule: [],
  },
  {
    id: "LN002",
    clientId: "6",
    clientName: "Justine",
    memberNumber: "LAMS002",
    amount: 25000,
    purpose: "Home Renovation",
    loanType: "Home Loan",
    status: "approved",
    applicationDate: "2024-01-10",
    approvalDate: "2024-01-18",
    officerId: "2",
    officerName: "Michael Chen",
    approverId: "3",
    approverName: "Fredrick Mwaura",
    interestRate: 7.2,
    term: 24,
    monthlyPayment: 1134.89,
    totalAmount: 27237.36,
    requiredDocuments: [
      "National ID/Passport",
      "Proof of Address",
      "Property Valuation",
      "Income Proof",
    ],
    uploadedDocuments: [
      "national_id.pdf",
      "property_valuation.pdf",
      "income_proof.pdf",
    ],
    disbursedAmount: 25000,
    outstandingBalance: 23865.11,
    totalPaid: 1134.89,
    nextPaymentDate: "2024-02-22",
    paymentSchedule: [],
  },
  {
    id: "LN003",
    clientId: "7",
    clientName: "Robert Kim",
    memberNumber: "LAMS003",
    amount: 75000,
    purpose: "Equipment Purchase",
    loanType: "Equipment Loan",
    status: "under_review",
    applicationDate: "2024-01-12",
    officerId: "2",
    officerName: "Michael Chen",
    interestRate: 9.0,
    term: 48,
    monthlyPayment: 1869.15,
    totalAmount: 89719.2,
    requiredDocuments: [
      "National ID/Passport",
      "Proof of Address",
      "Equipment Quote",
      "Financial Statements",
    ],
    uploadedDocuments: [
      "national_id.pdf",
      "equipment_quote.pdf",
      "financial_statements.pdf",
    ],
    disbursedAmount: 0,
    outstandingBalance: 0,
    totalPaid: 0,
    nextPaymentDate: "2024-03-15",
    paymentSchedule: [],
  },
  {
    id: "LN004",
    clientId: "8",
    clientName: "Amanda Foster",
    memberNumber: "LAMS004",
    amount: 15000,
    purpose: "Debt Consolidation",
    loanType: "Debt Loan",
    status: "rejected",
    applicationDate: "2024-01-08",
    approvalDate: "2024-01-16",
    officerId: "2",
    officerName: "Michael Chen",
    approverId: "3",
    approverName: "Fredrick Mwaura",
    interestRate: 12.0,
    term: 24,
    monthlyPayment: 706.12,
    totalAmount: 16946.88,
    comments: "Insufficient income to support loan repayment",
    rejectionReason: "Insufficient income verification",
    requiredDocuments: [
      "National ID/Passport",
      "Proof of Address",
      "Credit Report",
      "Income Statement",
    ],
    uploadedDocuments: [
      "national_id.pdf",
      "credit_report.pdf",
      "income_statement.pdf",
    ],
    disbursedAmount: 0,
    outstandingBalance: 0,
    totalPaid: 0,
    nextPaymentDate: "2024-03-15",
    paymentSchedule: [],
  },
  {
    id: "LN005",
    clientId: "4",
    clientName: "David James Thompson",
    memberNumber: "LAMS001",
    amount: 100000,
    purpose: "Real Estate Investment",
    loanType: "Investment Loan",
    status: "disbursed",
    applicationDate: "2023-12-01",
    approvalDate: "2023-12-15",
    disbursementDate: "2023-12-20",
    officerId: "2",
    officerName: "Michael Chen",
    approverId: "3",
    approverName: "Fredrick Mwaura",
    interestRate: 6.8,
    term: 60,
    monthlyPayment: 1957.34,
    totalAmount: 117440.4,
    requiredDocuments: [
      "National ID/Passport",
      "Proof of Address",
      "Property Deed",
      "Property Valuation",
      "Insurance Policy",
    ],
    uploadedDocuments: [
      "national_id.pdf",
      "property_deed.pdf",
      "valuation_report.pdf",
      "insurance_policy.pdf",
    ],
    disbursedAmount: 100000,
    outstandingBalance: 96085.32,
    totalPaid: 3914.68,
    nextPaymentDate: "2024-03-20",
    paymentSchedule: [],
  },
];

//transactions
export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "TXN001",
    loanId: "LN005",
    clientId: "4",
    clientName: "David James Thompson",
    memberNumber: "LAMS001",
    type: "disbursement",
    amount: 100000,
    date: "2023-12-20",
    description: "Loan disbursement - Real Estate Investment",
    balance: 100000,
    reference: "DISB-LN005-001",
    paymentMethod: "bank_transfer",
    processedBy: "Fredrick Mwaura",
    status: "completed",
  },
  {
    id: "TXN002",
    loanId: "LN005",
    clientId: "4",
    clientName: "David James Thompson",
    memberNumber: "LAMS001",
    type: "payment",
    amount: 1957.34,
    date: "2024-01-20",
    description: "Monthly payment - January 2024",
    balance: 98042.66,
    reference: "PMT-LN005-001",
    paymentMethod: "bank_transfer",
    processedBy: "System",
    status: "completed",
  },
  {
    id: "TXN003",
    loanId: "LN002",
    clientId: "6",
    clientName: "Justine",
    memberNumber: "LAMS002",
    type: "disbursement",
    amount: 25000,
    date: "2024-01-22",
    description: "Loan disbursement - Home Renovation",
    balance: 25000,
    reference: "DISB-LN002-001",
    paymentMethod: "bank_transfer",
    processedBy: "Fredrick Mwaura",
    status: "completed",
  },
  {
    id: "TXN004",
    loanId: "LN005",
    clientId: "4",
    clientName: "David James Thompson",
    memberNumber: "LAMS001",
    type: "payment",
    amount: 1957.34,
    date: "2024-02-20",
    description: "Monthly payment - February 2024",
    balance: 96085.32,
    reference: "PMT-LN005-002",
    paymentMethod: "bank_transfer",
    processedBy: "System",
    status: "completed",
  },
  {
    id: "TXN005",
    loanId: "LN002",
    clientId: "6",
    clientName: "Justine",
    memberNumber: "LAMS002",
    type: "payment",
    amount: 1134.89,
    date: "2024-02-22",
    description: "Monthly payment - February 2024",
    balance: 23865.11,
    reference: "PMT-LN002-001",
    paymentMethod: "bank_transfer",
    processedBy: "System",
    status: "completed",
  },
];

//dashboard metrics
export const MOCK_METRICS: DashboardMetrics = {
  totalLoans: 5,
  pendingApprovals: 2,
  rejectedLoans: 1,
  totalRepayments: 125000,
  totalOutstanding: 485000,
  activeClients: 4,
  portfolioValue: 265000,
  defaultRate: 2.1,
  approvalRate: 78.5,
};

//audit logs
export const auditLogs: AuditLog[] = [
  {
    id: "AUD001",
    timestamp: "2024-01-20T10:30:00Z",
    user: "Sarah Johnson",
    action: "login",
    resource: "Authentication",
    severity: "low",
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    details: "Successful login from desktop application",
    success: true,
  },
  {
    id: "AUD002",
    timestamp: "2024-01-20T10:35:00Z",
    user: "Michael Chen",
    action: "create",
    resource: "Loan Application",
    resourceId: "LN001",
    severity: "medium",
    ipAddress: "192.168.1.101",
    details: "Created new loan application for David James Thompson - $50,000",
    success: true,
  },
  {
    id: "AUD003",
    timestamp: "2024-01-20T11:15:00Z",
    user: "Fredrick Mwaura",
    action: "approve",
    resource: "Loan Application",
    resourceId: "LN002",
    severity: "high",
    ipAddress: "192.168.1.102",
    details: "Approved loan application LN002 for Justine - $25,000",
    success: true,
  },
  {
    id: "AUD004",
    timestamp: "2024-01-20T11:45:00Z",
    user: "Unknown User",
    action: "login",
    resource: "Authentication",
    severity: "critical",
    ipAddress: "203.0.113.45",
    details:
      "Failed login attempt with invalid credentials - potential security breach",
    success: false,
  },
  {
    id: "AUD005",
    timestamp: "2024-01-20T12:00:00Z",
    user: "David James Thompson",
    action: "view",
    resource: "Loan Status",
    resourceId: "LN001",
    severity: "low",
    ipAddress: "192.168.1.103",
    details: "Client viewed loan application status",
    success: true,
  },
  {
    id: "AUD006",
    timestamp: "2024-01-20T14:20:00Z",
    user: "Michael Chen",
    action: "update",
    resource: "Client Profile",
    resourceId: "4",
    severity: "medium",
    ipAddress: "192.168.1.101",
    details: "Updated client KYC information and uploaded new documents",
    success: true,
  },
  {
    id: "AUD007",
    timestamp: "2024-01-20T15:30:00Z",
    user: "Fredrick Mwaura",
    action: "reject",
    resource: "Loan Application",
    resourceId: "LN004",
    severity: "high",
    ipAddress: "192.168.1.102",
    details:
      "Rejected loan application LN004 - insufficient income verification",
    success: true,
  },
  {
    id: "AUD008",
    timestamp: "2024-01-20T16:45:00Z",
    user: "Sarah Johnson",
    action: "export",
    resource: "Reports",
    severity: "medium",
    ipAddress: "192.168.1.100",
    details: "Exported monthly loan portfolio report to PDF",
    success: true,
  },
  {
    id: "AUD009",
    timestamp: "2024-01-20T17:00:00Z",
    user: "System",
    action: "create",
    resource: "Backup",
    severity: "low",
    ipAddress: "127.0.0.1",
    details: "Automated daily database backup completed successfully",
    success: true,
  },
  {
    id: "AUD010",
    timestamp: "2024-01-20T18:15:00Z",
    user: "Michael Chen",
    action: "logout",
    resource: "Authentication",
    severity: "low",
    ipAddress: "192.168.1.101",
    details: "User logged out successfully",
    success: true,
  },
];

export const MOCK_CLIENTS: Client[] = [
  {
    id: "4",
    fullName: "David James Thompson",
    firstName: "David",
    middleName: "James",
    lastName: "Thompson",
    dateOfBirth: "1985-03-15",
    gender: "male",
    nationality: "Kenyan",
    maritalStatus: "married",
    nationalId: "12345678",
    kraPin: "A123456789P",
    phone: "+254700123456",
    email: "david.thompson@email.com",
    postalAddress: "P.O. Box 12345, Nairobi",
    residentialAddress: "123 Westlands Avenue, Nairobi",
    occupation: "Business Owner",
    employmentType: "self_employed",
    employerName: "Thompson Enterprises Ltd",
    employerAddress: "456 Industrial Area, Nairobi",
    monthlyIncome: 150000,
    annualIncome: 1800000,
    bankName: "KCB Bank",
    bankBranch: "Westlands Branch",
    bankAccountNumber: "1234567890",
    preferredPaymentMethod: "bank_transfer",
    nextOfKin: {
      name: "Sarah Thompson",
      relationship: "Spouse",
      phone: "+254700987654",
      address: "123 Westlands Avenue, Nairobi",
    },
    documents: {
      idPassport: ["national_id_front.jpg", "national_id_back.jpg"],
      proofOfAddress: ["utility_bill.pdf"],
      passportPhoto: ["passport_photo.jpg"],
      payslips: ["business_income_statement.pdf"],
      bankStatements: ["bank_statement_6months.pdf"],
      businessRegistration: ["business_certificate.pdf"],
      taxComplianceCertificate: ["tax_compliance.pdf"],
    },
    memberNumber: "LAMS001",
    registrationDate: "2023-01-15",
    kycStatus: "verified",
    status: "active",
    avatar: "/placeholder.svg",
  },
  {
    id: "6",
    fullName: "Justine",
    firstName: "Jennifer",
    lastName: "Martinez",
    dateOfBirth: "1990-07-22",
    gender: "female",
    nationality: "Kenyan",
    maritalStatus: "single",
    nationalId: "87654321",
    kraPin: "B987654321Q",
    phone: "+254701234567",
    email: "jennifer.martinez@email.com",
    postalAddress: "P.O. Box 54321, Mombasa",
    residentialAddress: "789 Nyali Road, Mombasa",
    occupation: "Software Engineer",
    employmentType: "permanent",
    employerName: "Tech Solutions Ltd",
    employerAddress: "101 Tech Park, Mombasa",
    monthlyIncome: 120000,
    annualIncome: 1440000,
    bankName: "Equity Bank",
    bankBranch: "Nyali Branch",
    bankAccountNumber: "0987654321",
    preferredPaymentMethod: "mobile_money",
    nextOfKin: {
      name: "Carlos Martinez",
      relationship: "Brother",
      phone: "+254702345678",
      address: "456 Coast Road, Mombasa",
    },
    documents: {
      idPassport: ["national_id_scan.pdf"],
      proofOfAddress: ["lease_agreement.pdf"],
      passportPhoto: ["photo.jpg"],
      payslips: ["payslip_jan.pdf", "payslip_feb.pdf", "payslip_mar.pdf"],
      bankStatements: ["equity_statement.pdf"],
    },
    memberNumber: "LAMS002",
    registrationDate: "2023-02-10",
    kycStatus: "verified",
    status: "active",
    avatar: "/placeholder.svg",
  },
  {
    id: "1",
    fullName: "David James Thompson",
    firstName: "David",
    middleName: "James",
    lastName: "Thompson",
    dateOfBirth: "1985-03-15",
    gender: "male",
    nationality: "Kenyan",
    maritalStatus: "married",
    nationalId: "12345678",
    kraPin: "A123456789P",
    phone: "+254700123456",
    email: "david.thompson@email.com",
    postalAddress: "P.O. Box 12345, Nairobi",
    residentialAddress: "123 Westlands Avenue, Nairobi",
    occupation: "Business Owner",
    employmentType: "self_employed",
    employerName: "Thompson Enterprises Ltd",
    employerAddress: "456 Industrial Area, Nairobi",
    monthlyIncome: 150000,
    annualIncome: 1800000,
    bankName: "KCB Bank",
    bankBranch: "Westlands Branch",
    bankAccountNumber: "1234567890",
    preferredPaymentMethod: "bank_transfer",
    nextOfKin: {
      name: "Sarah Thompson",
      relationship: "Spouse",
      phone: "+254700987654",
      address: "123 Westlands Avenue, Nairobi",
    },
    documents: {
      idPassport: ["national_id_front.jpg", "national_id_back.jpg"],
      proofOfAddress: ["utility_bill.pdf"],
      passportPhoto: ["passport_photo.jpg"],
      payslips: ["business_income_statement.pdf"],
      bankStatements: ["bank_statement_6months.pdf"],
      businessRegistration: ["business_certificate.pdf"],
      taxComplianceCertificate: ["tax_compliance.pdf"],
    },
    memberNumber: "LAMS001",
    registrationDate: "2023-01-15",
    kycStatus: "verified",
    status: "active",
    avatar: "/placeholder.svg",
  },
  {
    id: "2",
    fullName: "Jennifer Martinez",
    firstName: "Jennifer",
    lastName: "Martinez",
    dateOfBirth: "1990-07-22",
    gender: "female",
    nationality: "Kenyan",
    maritalStatus: "single",
    nationalId: "87654321",
    kraPin: "B987654321Q",
    phone: "+254701234567",
    email: "jennifer.martinez@email.com",
    postalAddress: "P.O. Box 54321, Mombasa",
    residentialAddress: "789 Nyali Road, Mombasa",
    occupation: "Software Engineer",
    employmentType: "permanent",
    employerName: "Tech Solutions Ltd",
    employerAddress: "101 Tech Park, Mombasa",
    monthlyIncome: 120000,
    annualIncome: 1440000,
    bankName: "Equity Bank",
    bankBranch: "Nyali Branch",
    bankAccountNumber: "0987654321",
    preferredPaymentMethod: "mobile_money",
    nextOfKin: {
      name: "Carlos Martinez",
      relationship: "Brother",
      phone: "+254702345678",
      address: "456 Coast Road, Mombasa",
    },
    documents: {
      idPassport: ["national_id_scan.pdf"],
      proofOfAddress: ["lease_agreement.pdf"],
      passportPhoto: ["photo.jpg"],
      payslips: ["payslip_jan.pdf", "payslip_feb.pdf", "payslip_mar.pdf"],
      bankStatements: ["equity_statement.pdf"],
    },
    memberNumber: "LAMS002",
    registrationDate: "2023-02-10",
    kycStatus: "verified",
    status: "active",
    avatar: "/placeholder.svg",
  },
  {
    id: "3",
    fullName: "Samuel Okello",
    firstName: "Samuel",
    lastName: "Okello",
    dateOfBirth: "1992-11-03",
    gender: "male",
    nationality: "Kenyan",
    maritalStatus: "single",
    nationalId: "33445566",
    kraPin: "C112233445K",
    phone: "+254703987654",
    email: "samuel.okello@email.com",
    postalAddress: "P.O. Box 10101, Kisumu",
    residentialAddress: "Milimani Estate, Kisumu",
    occupation: "Teacher",
    employmentType: "contract",
    employerName: "Kisumu Boys High School",
    employerAddress: "Oginga Odinga Street, Kisumu",
    monthlyIncome: 80000,
    annualIncome: 960000,
    bankName: "Cooperative Bank",
    bankBranch: "Kisumu Branch",
    bankAccountNumber: "5566778899",
    preferredPaymentMethod: "cheque",
    nextOfKin: {
      name: "Mary Okello",
      relationship: "Mother",
      phone: "+254704112233",
      address: "Milimani Estate, Kisumu",
    },
    documents: {
      idPassport: ["id_scan.jpg"],
      proofOfAddress: ["rental_agreement.pdf"],
      passportPhoto: ["sam_photo.jpg"],
      payslips: ["contract_payslip.pdf"],
      bankStatements: ["coop_statement.pdf"],
    },
    memberNumber: "LAMS003",
    registrationDate: "2023-04-05",
    kycStatus: "pending",
    status: "inactive",
    avatar: "/placeholder.svg",
  },
  {
    id: "4",
    fullName: "Grace Njeri",
    firstName: "Grace",
    lastName: "Njeri",
    dateOfBirth: "1988-06-19",
    gender: "female",
    nationality: "Kenyan",
    maritalStatus: "married",
    nationalId: "99887766",
    kraPin: "D998877665P",
    phone: "+254705998877",
    email: "grace.njeri@email.com",
    postalAddress: "P.O. Box 20202, Nakuru",
    residentialAddress: "Lanet Estate, Nakuru",
    occupation: "Doctor",
    employmentType: "permanent",
    employerName: "Nakuru County Hospital",
    employerAddress: "Nakuru CBD",
    monthlyIncome: 200000,
    annualIncome: 2400000,
    bankName: "Stanbic Bank",
    bankBranch: "Nakuru Branch",
    bankAccountNumber: "4455667788",
    preferredPaymentMethod: "bank_transfer",
    nextOfKin: {
      name: "James Kariuki",
      relationship: "Husband",
      phone: "+254706112233",
      address: "Lanet Estate, Nakuru",
    },
    documents: {
      idPassport: ["id_card.jpg"],
      proofOfAddress: ["electricity_bill.pdf"],
      passportPhoto: ["grace_photo.jpg"],
      payslips: ["stanbic_payslip.pdf"],
      bankStatements: ["stanbic_statement.pdf"],
      taxComplianceCertificate: ["tax_clearance.pdf"],
    },
    memberNumber: "LAMS004",
    registrationDate: "2023-05-12",
    kycStatus: "rejected",
    status: "suspended",
    avatar: "/placeholder.svg",
  },
];

// Helper functions
export function getLoansByStatus(status: LoanStatus): LoanApplication[] {
  return MOCK_LOANS.filter((loan) => loan.status === status);
}

export function getLoansByClient(clientId: string): LoanApplication[] {
  return MOCK_LOANS.filter((loan) => loan.clientId === clientId);
}

export function getTransactionsByClient(clientId: string): Transaction[] {
  return MOCK_TRANSACTIONS.filter(
    (transaction) => transaction.clientId === clientId,
  );
}

export function getTransactionsByLoan(loanId: string): Transaction[] {
  return MOCK_TRANSACTIONS.filter(
    (transaction) => transaction.loanId === loanId,
  );
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "KES",
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getClientById(clientId: string): Client | undefined {
  return MOCK_CLIENTS.find((client) => client.id === clientId);
}

export function getClientByMemberNumber(
  memberNumber: string,
): Client | undefined {
  return MOCK_CLIENTS.find((client) => client.memberNumber === memberNumber);
}

export function searchClients(query: string): Client[] {
  const searchTerm = query.toLowerCase();
  return MOCK_CLIENTS.filter(
    (client) =>
      client.firstName.toLowerCase().includes(searchTerm) ||
      client.lastName.toLowerCase().includes(searchTerm) ||
      client.memberNumber.toLowerCase().includes(searchTerm) ||
      client.nationalId.includes(searchTerm) ||
      client.phone.includes(searchTerm),
  );
}
