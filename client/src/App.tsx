import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './Components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import Login from './Pages/Login';
import AcceptInvite from './Pages/AcceptInvite';
import CustomersPage from './Pages/CustomersPage';
import LeadsPage from './Pages/LeadsPage';
import UserManagement from './Pages/UserManagement';
import AgentReportsPage from './Pages/AgentReportsPage';
import CostPricePage from './Pages/CostPricePage';
import EmailPage from './Pages/EmailPage';
import RenewalsPage from './Pages/RenewalsPage';
import PrivacyPolicy from './Pages/PrivacyPolicy';
import Home from './Pages/Home';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/invite" element={<AcceptInvite />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />

          {/* Protected routes with sidebar layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="leads" element={<LeadsPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="email" element={<EmailPage />} />
              <Route path="renewals" element={<RenewalsPage />} />
              <Route element={<ProtectedRoute allow={['ADMIN']} />}>
                <Route path="admin/users" element={<UserManagement />} />
                <Route path="admin/reports" element={<AgentReportsPage />} />
                <Route path="admin/cost-price" element={<CostPricePage />} />
              </Route>
              <Route path="*" element={<Navigate to="/leads" replace />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

