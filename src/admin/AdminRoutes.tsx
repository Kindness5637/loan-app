import { Routes, Route, Navigate } from "react-router-dom";
import Layout from './layout/Layout';
import Dashboard from './pages/AdminDashboard';
import MultiStepMemberForm from './pages/Member Management/NewMember';
import { AuditLogs } from './system/AuditLogs';
import { Members } from "./pages/Member Management/Members";
import { LoanProducts } from "./pages/Credit services/LoanProducts";
import { LoanPortfolio } from "./pages/Credit services/LoanPortfolio";
import AddLoanProduct from "./pages/Credit services/AddLoanProduct";
import EditLoanProduct from "./pages/Credit services/EditLoanProduct";
import ErrorPage from '../components/common/404ErrorPage';
import { LoanEdit } from "./pages/Credit services/LoanEdit";
import { MemberView } from "./pages/Member Management/MemberView";
import { MemberEdit } from "./pages/Member Management/MemberUpdate";
import { LoanApplication } from "./pages/Credit services/loanApplication";
import DepositAccounts from "./pages/Deposit Services/DepositAccounts";
import NewDepositAccount from "./pages/Deposit Services/NewDepositAccount";
import ShareCapitalAccount from "./pages/Deposit Services/ShareCapitalAccount";
import NewShareCapitalAccount from "./pages/Deposit Services/NewShareCapitalAccount";
import FundTransfer from "./pages/Deposit Services/FundTransfer";
import LoanDetails from "./pages/Credit services/LoanDetails";
import { UserProfile } from "./pages/userProfile";
import { Reports } from "./reports/Reports";
import Analytics from "./reports/Analytics";
import LoanPreview from "./pages/Credit services/loanPreview";
import { CreateUser } from "./pages/Member Management/createUser";
import User from "./pages/Member Management/Users";
import { LoanProductDetail } from "./pages/Credit services/LoanProductDetails";
import FontTest from "./fontTest";
import { CommentsPage } from "@/admin/pages/comments";
import Settings from "./system/Settings";
import Transactions from "./pages/Deposit Services/Transactions";

// const PlaceholderPage = ({ title }: { title: string }) => (
//   <div className="flex items-center justify-center h-96">
//     <div className="text-center">
//       <h2 className="text-2xl font-semibold text-muted-foreground mb-2">{title}</h2>
//       <p className="text-sm text-muted-foreground">This feature is coming soon...</p>
//     </div>
//   </div>
// );

export default function AdminRoutes() {
  return (
    <Layout>
      <Routes>
        {/* Dashboard - root route */}
        <Route index element={<Dashboard />} />
        
        {/* Member Management */}
        <Route path="new-member" element={<MultiStepMemberForm />} />
        <Route path="members" element={<Members />} />  
        <Route path="members/view/:id" element={<MemberView />} />
        <Route path="members/update/:id" element={<MemberEdit />} />
        
        {/* Credit Services - Loan Products */}
        <Route path="loan-products" element={<LoanProducts />} /> 
        <Route path="loan-products/:loanCode" element={<LoanProductDetail />} />
        <Route path="loan-products/edit/:loanCode" element={<EditLoanProduct />} />
        <Route path="add-loan-product" element={<AddLoanProduct />} />
        
        {/* Credit Services - Loan Portfolio */}
        <Route path="loan-portfolio" element={<LoanPortfolio />} />
        <Route path="loan-portfolio/:loanNumber" element={<LoanDetails />} />
        <Route path="loan/edit/:id" element={<LoanEdit />} />
        <Route path="loan-application" element={<LoanApplication />} /> 
        <Route path="loan-preview" element={<LoanPreview />} />
        
        {/* Deposit Services */}
        <Route path="deposit-accounts" element={<DepositAccounts />} />
        <Route path="new-deposit-account" element={<NewDepositAccount />} />
        <Route path="share-capital-account" element={<ShareCapitalAccount />} />
        <Route path="new-share-capital-account" element={<NewShareCapitalAccount />} />
        <Route path="fund-transfer" element={<FundTransfer />} />
        <Route path="transactions" element={<Transactions />} />
        
        {/* User Management */}
        <Route path="users" element={<User />} />
        <Route path="create-user" element={<CreateUser />} />
        <Route path="profile" element={<UserProfile />} />
        
        {/* Reports & Analytics */}
        <Route path="reports" element={<Reports />} />
        <Route path="analytics" element={<Analytics />} />
        
        {/* System */}
        <Route path="audit" element={<AuditLogs />} />
        <Route path="settings" element={<Settings />} />
        <Route path="comments" element={<CommentsPage />} />
        
        {/* Development/Testing */}
        <Route path="font-test" element={<FontTest />} />
        
        {/* Redirect /client attempts to admin dashboard */}
        <Route path="client/*" element={<Navigate to="/" replace />} />
        
        {/* 404 - catch all unmatched routes */}
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </Layout>
  );
}