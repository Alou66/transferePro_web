import { Routes, Route } from 'react-router-dom'
import { UserRole } from './types/index'
import AuthProvider from './features/auth/context/AuthProvider'
import ProtectedRoute from './features/auth/components/ProtectedRoute'
import RoleRoute from './features/auth/components/RoleRoute'
import HomePage from './features/auth/pages/HomePage'
import LoginPage from './features/auth/pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import PendingValidationPage from './pages/PendingValidationPage'
import NotFoundPage from './features/auth/pages/NotFoundPage'
import AgentLayout from './features/agent/layout/AgentLayout'
import AdminLayout from './features/admin/layout/AdminLayout'
import AgentHomePage from './features/auth/pages/AgentHomePage'
import AdminHomePage from './features/auth/pages/AdminHomePage'
import CreateTransferPage from './features/transfers/pages/CreateTransferPage'
import TransferCreatedPage from './features/transfers/pages/TransferCreatedPage'
import IncomingTransfersPage from './features/transfers/pages/IncomingTransfersPage'
import TransferDetailsPage from './features/transfers/pages/TransferDetailsPage'
import VerifyWithdrawalCodePage from './features/transfers/pages/VerifyWithdrawalCodePage'
import PaymentSuccessPage from './features/transfers/pages/PaymentSuccessPage'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
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
          <Route index element={<AdminHomePage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
