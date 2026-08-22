import { Routes, Route, Navigate } from 'react-router-dom'
import { UserRole } from './types/index'
import AuthProvider from './features/auth/context/AuthProvider'
import ProtectedRoute from './features/auth/components/ProtectedRoute'
import RoleRoute from './features/auth/components/RoleRoute'
import LoginPage from './features/auth/pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import PendingValidationPage from './pages/PendingValidationPage'
import NotFoundPage from './features/auth/pages/NotFoundPage'
import AgentLayout from './features/agent/layout/AgentLayout'
import AdminLayout from './features/admin/layout/AdminLayout'
import AgentHomePage from './features/auth/pages/AgentHomePage'
import AdminAgentsPage from './features/admin/pages/AdminAgentsPage'
import AdminAgentDetailsPage from './features/admin/pages/AdminAgentDetailsPage'
import AdminCitiesPage from './features/admin/pages/AdminCitiesPage'
import AdminDashboardPage from './features/admin/pages/AdminDashboardPage'
import AdminTransfersPage from './features/admin/pages/AdminTransfersPage'
import AdminTransferDetailsPage from './features/admin/pages/AdminTransferDetailsPage'
import AdminFinancialStatisticsPage from './features/admin/pages/AdminFinancialStatisticsPage'
import CreateTransferPage from './features/transfers/pages/CreateTransferPage'
import TransferCreatedPage from './features/transfers/pages/TransferCreatedPage'
import IncomingTransfersPage from './features/transfers/pages/IncomingTransfersPage'
import TransferDetailsPage from './features/transfers/pages/TransferDetailsPage'
import VerifyWithdrawalCodePage from './features/transfers/pages/VerifyWithdrawalCodePage'
import PaymentSuccessPage from './features/transfers/pages/PaymentSuccessPage'
import TransferHistoryPage from './features/transfers/pages/TransferHistoryPage'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/pending-validation" element={<PendingValidationPage />} />
        <Route
          path="/agent"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[UserRole.AGENT]}>
                <AgentLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<AgentHomePage />} />
          <Route path="transfers/new" element={<CreateTransferPage />} />
          <Route path="transfers/incoming" element={<IncomingTransfersPage />} />
          <Route path="transfers/history" element={<TransferHistoryPage />} />
          <Route path="transfers/:transferId" element={<TransferDetailsPage />} />
          <Route path="transfers/:transferId/verify" element={<VerifyWithdrawalCodePage />} />
          <Route path="transfers/:transferId/payment-success" element={<PaymentSuccessPage />} />
          <Route path="transfers/:transferId/success" element={<TransferCreatedPage />} />
        </Route>
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[UserRole.ADMIN]}>
                <AdminLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="agents" element={<AdminAgentsPage />} />
          <Route path="agents/:agentId" element={<AdminAgentDetailsPage />} />
          <Route path="cities" element={<AdminCitiesPage />} />
          <Route path="transfers" element={<AdminTransfersPage />} />
          <Route path="transfers/:transferId" element={<AdminTransferDetailsPage />} />
          <Route path="financial-statistics" element={<AdminFinancialStatisticsPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
