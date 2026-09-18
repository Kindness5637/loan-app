import { Routes, Route, Navigate } from "react-router-dom";
import Client from "./pages/Dashboard";
import ClientLoans from "./pages/Loans";
import Profile from "./pages/Profile";
import ClientPayments from "./pages/Payments";
import ClientStatements from "./pages/Statements";
import ClientSupport from "./pages/Support";
import LoanDetail from "./client/loanDetail";

export default function UserRoutes() {
  return (
    <Routes>
      {/* Main client dashboard */}
      <Route path="/client" element={<Client />} />
      
      <Route path="/client/profile" element={<Profile />} />
      <Route path="/client/loans" element={<ClientLoans />} />
      <Route path="/client/loans/:loanNumber" element={<LoanDetail />} />
      <Route path="/client/payments" element={<ClientPayments />} />
      <Route path="/client/statements" element={<ClientStatements />} />
      <Route path="/client/statements/:loanNumber" element={<ClientStatements />} />
      <Route path="/client/support" element={<ClientSupport />} />
      
      <Route path="/" element={<Navigate to="/client" replace />} />
      
      {/* Catch all unmatched routes and redirect to client dashboard */}
      <Route path="*" element={<Navigate to="/client" replace />} />
    </Routes>
  );
}