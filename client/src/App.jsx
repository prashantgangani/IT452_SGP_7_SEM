import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FeatureProvider, FeatureGuard } from './context/FeatureContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import MSMEDashboard from './pages/MSMEDashboard';
import LenderDashboard from './pages/LenderDashboard';
import UploadInvoice from './pages/UploadInvoice';
import Analytics from './pages/Analytics';
import './App.css';
import { Toaster } from 'react-hot-toast'; // Import Toaster
import AdminDashboard from './pages/AdminDashboard';
import SystemControl from './pages/SystemControl';
import WalletPage from './pages/WalletPage';

import Landing from './pages/Landing'; // Import Landing page
import InvoiceList from './pages/InvoiceList';
import KycForm from './pages/KycForm';
import Profile from './pages/Profile';
import AdminKycPage from './pages/AdminKycPage';
import AdminLenderKycPage from './pages/AdminLenderKycPage';
import LenderOnboardingPage from './pages/LenderOnboardingPage';
import AdminDealPage from './pages/AdminDealPage';
import MeetingRoom from './pages/MeetingRoom';
import AdminDataPage from './pages/AdminDataPage';
import AdminSettingsPage from './pages/AdminSettingsPage';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-theme-bg text-theme-text flex flex-col pt-16">
        <div className="absolute top-0 right-1/4 w-[480px] h-[480px] bg-blue-600 rounded-full -z-10 blur-3xl opacity-[0.12] pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent -z-10 pointer-events-none"></div>
        <div className="p-8 space-y-8 animate-pulse flex-1 w-full max-w-7xl mx-auto">
          <div className="h-10 w-64 bg-theme-surface border border-theme-border rounded-xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-40 bg-theme-surface rounded-2xl border border-theme-border"></div>)}
          </div>
          <div className="h-96 bg-theme-surface rounded-2xl border border-theme-border"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to a generic unauthorized page or home if role doesn't match
    return <Navigate to="/" />; // Or unauthorized page
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 bg-blue-500/20 rounded-full border border-blue-500/30"></div>
          <div className="h-4 w-24 bg-theme-surface border border-theme-border rounded-full"></div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    if (user.role === 'MSME') return <Navigate to="/msme" />;
    if (user.role === 'LENDER') return <Navigate to="/lender" />;
    if (user.role === 'ADMIN') return <Navigate to="/admin" />;
    if (user.role === 'CONTROLLER') return <Navigate to="/system-control" />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <FeatureProvider>
            <Navbar />
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#1e293b',
                  color: '#fff',
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                },
                success: {
                  iconTheme: {
                    primary: '#22c55e',
                  },
                },
              }
              } />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={
                <PublicRoute>
                  <Landing />
                </PublicRoute>
              } />
              <Route path="/login" element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } />
              <Route path="/register" element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } />

              {/* Protected Routes - MSME */}
              <Route path="/msme" element={
                <ProtectedRoute allowedRoles={['MSME']}>
                  <MSMEDashboard />
                </ProtectedRoute>
              } />
              <Route path="/upload-invoice" element={
                <ProtectedRoute allowedRoles={['MSME']}>
                  <UploadInvoice />
                </ProtectedRoute>
              } />
              <Route path="/invoices" element={
                <ProtectedRoute allowedRoles={['MSME']}>
                  <InvoiceList />
                </ProtectedRoute>
              } />
              <Route path="/kyc" element={
                <ProtectedRoute allowedRoles={['MSME']}>
                  <KycForm />
                </ProtectedRoute>
              } />

              {/* Protected Routes - Lender */}
              <Route path="/lender" element={
                <ProtectedRoute allowedRoles={['LENDER']}>
                  <LenderDashboard />
                </ProtectedRoute>
              } />
              <Route path="/lender/kyc" element={
                <ProtectedRoute allowedRoles={['LENDER']}>
                  <LenderOnboardingPage />
                </ProtectedRoute>
              } />

              {/* Protected Routes - Admin & Controller */}
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'CONTROLLER']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/kyc" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'CONTROLLER']}>
                  <AdminKycPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/lender-kyc" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'CONTROLLER']}>
                  <AdminLenderKycPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/deals" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'CONTROLLER']}>
                  <AdminDealPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['ADMIN', 'CONTROLLER']}><AdminDataPage type="users" /></ProtectedRoute>} />
              <Route path="/admin/invoices" element={<ProtectedRoute allowedRoles={['ADMIN', 'CONTROLLER']}><AdminDataPage type="invoices" /></ProtectedRoute>} />
              <Route path="/admin/bids" element={<ProtectedRoute allowedRoles={['ADMIN', 'CONTROLLER']}><AdminDataPage type="bids" /></ProtectedRoute>} />
              <Route path="/admin/transactions" element={<ProtectedRoute allowedRoles={['ADMIN', 'CONTROLLER']}><AdminDataPage type="transactions" /></ProtectedRoute>} />
              <Route path="/admin/alerts" element={<ProtectedRoute allowedRoles={['ADMIN', 'CONTROLLER']}><AdminDataPage type="alerts" /></ProtectedRoute>} />
              <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['ADMIN', 'CONTROLLER']}><AdminSettingsPage /></ProtectedRoute>} />

              {/* Protected Route - Controller & Admin */}
              <Route path="/system-control" element={
                <ProtectedRoute allowedRoles={['CONTROLLER', 'ADMIN']}>
                  <SystemControl />
                </ProtectedRoute>
              } />

              {/* Shared Protected Routes */}
              <Route path="/wallet" element={
                <FeatureGuard featureKey="WALLET_MODULE">
                  <ProtectedRoute allowedRoles={['MSME', 'LENDER']}>
                    <WalletPage />
                  </ProtectedRoute>
                </FeatureGuard>
              } />
              <Route path="/analytics" element={
                <FeatureGuard featureKey="ANALYTICS_MODULE">
                  <ProtectedRoute allowedRoles={['MSME', 'LENDER']}>
                    <Analytics />
                  </ProtectedRoute>
                </FeatureGuard>
              } />
              <Route path="/profile" element={
                <ProtectedRoute allowedRoles={['MSME', 'LENDER']}>
                  <Profile />
                </ProtectedRoute>
              } />

              {/* Meeting Room */}
              <Route path="/meeting/:dealId" element={
                <FeatureGuard featureKey="COMMUNICATION_MODULE">
                  <ProtectedRoute allowedRoles={['MSME', 'LENDER', 'ADMIN']}>
                    <MeetingRoom />
                  </ProtectedRoute>
                </FeatureGuard>
              } />

              {/* Default Redirect */}
              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          </FeatureProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
