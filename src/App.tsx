import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { UserRole } from './types/index'
import AuthProvider from './features/auth/context/AuthProvider'
import ProtectedRoute from './features/auth/components/ProtectedRoute'
import RoleRoute from './features/auth/components/RoleRoute'
import AgentLayout from './features/agent/layout/AgentLayout'
import AdminLayout from './features/admin/layout/AdminLayout'
import PageLoader from './shared/components/PageLoader'

const LoginPage = lazy(() => import('./features/auth/pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const PendingValidationPage = lazy(() => import('./pages/PendingValidationPage'))
const NotFoundPage = lazy(() => import('./features/auth/pages/NotFoundPage'))
const AgentHomePage = lazy(() => import('./features/auth/pages/AgentHomePage'))
const AdminAgentsPage = lazy(() => import('./features/admin/pages/AdminAgentsPage'))
const AdminAgentDetailsPage = lazy(() => import('./features/admin/pages/AdminAgentDetailsPage'))
const AdminCitiesPage = lazy(() => import('./features/admin/pages/AdminCitiesPage'))
const AdminDashboardPage = lazy(() => import('./features/admin/pages/AdminDashboardPage'))
const AdminTransfersPage = lazy(() => import('./features/admin/pages/AdminTransfersPage'))
const AdminTransferDetailsPage = lazy(() => import('./features/admin/pages/AdminTransferDetailsPage'))
const AdminFinancialStatisticsPage = lazy(() => import('./features/admin/pages/AdminFinancialStatisticsPage'))
const CreateTransferPage = lazy(() => import('./features/transfers/pages/CreateTransferPage'))
const TransferCreatedPage = lazy(() => import('./features/transfers/pages/TransferCreatedPage'))
const IncomingTransfersPage = lazy(() => import('./features/transfers/pages/IncomingTransfersPage'))
const TransferDetailsPage = lazy(() => import('./features/transfers/pages/TransferDetailsPage'))
const VerifyWithdrawalCodePage = lazy(() => import('./features/transfers/pages/VerifyWithdrawalCodePage'))
const PaymentSuccessPage = lazy(() => import('./features/transfers/pages/PaymentSuccessPage'))
const TransferHistoryPage = lazy(() => import('./features/transfers/pages/TransferHistoryPage'))

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<PageLoader />}>
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
      </Suspense>
    </AuthProvider>
  )
}

export default App
