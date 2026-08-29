import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import SmoothScroll from './components/SmoothScroll'
import { AuthProvider } from './context/AuthContext'
import RequireAuth from './components/RequireAuth'
import Home from './pages/Home'
import Departments from './pages/Departments'
import DepartmentDetail from './pages/DepartmentDetail'
import Medications from './pages/Medications'
import Assessment from './pages/Assessment'
import Reports from './pages/Reports'
import CameraPage from './pages/CameraPage'
import RecommendPage from './pages/RecommendPage'
import MLResultsPage from './pages/MLResultsPage'
import DatabasePage from './pages/DatabasePage'
import KnowledgeGraphPage from './pages/KnowledgeGraphPage'
import MedicineSearch from './pages/MedicineSearch'
import TrainedModels from './pages/TrainedModels'
import MrHari from './pages/MrHari'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import EmailVerification from './pages/auth/EmailVerification'
import Onboarding from './pages/auth/Onboarding'
import AccountSettings from './pages/auth/AccountSettings'
import PrivacyPolicy from './pages/legal/PrivacyPolicy'
import TermsOfService from './pages/legal/TermsOfService'
import CookiePolicy from './pages/legal/CookiePolicy'
import CookiePreferences from './pages/legal/CookiePreferences'
import Disclaimer from './pages/legal/Disclaimer'
import AccessibilityStatement from './pages/legal/AccessibilityStatement'
import DataProcessingAgreement from './pages/legal/DataProcessingAgreement'
import AcceptableUsePolicy from './pages/legal/AcceptableUsePolicy'
import SecurityPolicy from './pages/legal/SecurityPolicy'
import ResponsibleDisclosure from './pages/legal/ResponsibleDisclosure'
import CommunityGuidelines from './pages/legal/CommunityGuidelines'
import CustomerLifecycle from './pages/legal/CustomerLifecycle'
import Legal from './pages/legal/Legal'
import Upgrade from './pages/support/Upgrade'
import Downgrade from './pages/support/Downgrade'
import Support from './pages/support/Support'
import HelpCenter from './pages/support/HelpCenter'
import NotFound from './pages/ux/NotFound'
import Forbidden from './pages/ux/Forbidden'
import ServerError from './pages/ux/ServerError'
import Maintenance from './pages/ux/Maintenance'
import Offline from './pages/ux/Offline'
import EmptyState from './pages/ux/EmptyState'
import NoSearchResults from './pages/ux/NoSearchResults'
import LoadingState from './pages/ux/LoadingState'
import ErrorState from './pages/ux/ErrorState'
import SuccessState from './pages/ux/SuccessState'
import SessionExpired from './pages/ux/SessionExpired'
import '@fontsource-variable/geist'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SmoothScroll>
          <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/departments" element={<Departments />} />
            <Route path="/departments/:slug" element={<DepartmentDetail />} />
            <Route path="/medications" element={<Medications />} />
            <Route path="/assessment" element={<Assessment />} />
            <Route path="/reports" element={<RequireAuth><Reports /></RequireAuth>} />
            <Route path="/camera" element={<CameraPage />} />
            <Route path="/recommend" element={<RecommendPage />} />
            <Route path="/ml-results" element={<MLResultsPage />} />
            <Route path="/database" element={<DatabasePage />} />
            <Route path="/knowledge-graph" element={<KnowledgeGraphPage />} />
            <Route path="/medicines-search" element={<MedicineSearch />} />
            <Route path="/trained-models" element={<TrainedModels />} />
            <Route path="/mr-hari" element={<RequireAuth><MrHari /></RequireAuth>} />
            <Route path="/account" element={<RequireAuth><AccountSettings /></RequireAuth>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/email-verification" element={<EmailVerification />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/cookie-policy" element={<CookiePolicy />} />
            <Route path="/cookie-preferences" element={<CookiePreferences />} />
            <Route path="/disclaimer" element={<Disclaimer />} />
            <Route path="/accessibility-statement" element={<AccessibilityStatement />} />
            <Route path="/data-processing-agreement" element={<DataProcessingAgreement />} />
            <Route path="/acceptable-use-policy" element={<AcceptableUsePolicy />} />
            <Route path="/security-policy" element={<SecurityPolicy />} />
            <Route path="/responsible-disclosure" element={<ResponsibleDisclosure />} />
            <Route path="/community-guidelines" element={<CommunityGuidelines />} />
            <Route path="/customer-lifecycle" element={<CustomerLifecycle />} />
            <Route path="/upgrade" element={<Upgrade />} />
            <Route path="/downgrade" element={<Downgrade />} />
            <Route path="/support" element={<Support />} />
            <Route path="/help-center" element={<HelpCenter />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="/403" element={<Forbidden />} />
            <Route path="/500" element={<ServerError />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/offline" element={<Offline />} />
            <Route path="/empty-state" element={<EmptyState />} />
            <Route path="/no-search-results" element={<NoSearchResults />} />
            <Route path="/loading-state" element={<LoadingState />} />
            <Route path="/error-state" element={<ErrorState />} />
            <Route path="/success-state" element={<SuccessState />} />
            <Route path="/session-expired" element={<SessionExpired />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
        </SmoothScroll>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
