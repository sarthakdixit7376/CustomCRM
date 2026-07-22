import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './Components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import Login from './Pages/Login';
import Signup from './Pages/Signup';
import CustomersPage from './Pages/CustomersPage';
import LeadsPage from './Pages/LeadsPage';
import UserManagement from './Pages/UserManagement';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected routes with sidebar layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/leads" replace />} />
              <Route path="leads" element={<LeadsPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route element={<ProtectedRoute allow={['ADMIN']} />}>
                <Route path="admin/users" element={<UserManagement />} />
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

