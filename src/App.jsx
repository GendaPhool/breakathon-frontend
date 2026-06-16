import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ParticipantSessionProvider } from '@/components/ParticipantSessionProvider';

// Separate login pages — no shared tab UI
import ParticipantLogin from '@/pages/ParticipantLogin';
import MarshalLogin from '@/pages/MarshalLogin';

import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

import AppLayout from '@/components/AppLayout';
import Home from '@/pages/Home';
import SubmitBug from '@/pages/SubmitBug';
import MyReports from '@/pages/MyReports';
import Leaderboard from '@/pages/Leaderboard';
import MarshalQueue from '@/pages/MarshalQueue';
import MarshalStats from '@/pages/MarshalStats';
import MarshalRegistrations from '@/pages/MarshalRegistrations';
import MarshalCheckin from '@/pages/MarshalCheckin';
import AdminSettings from '@/pages/AdminSettings';
import PublicRegister from '@/pages/PublicRegister';
import MarshalGateWrapper from '@/components/MarshalGateWrapper';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  return (
    <Routes>
      {/* Fully public — no auth required */}
      <Route path="/event-register" element={<PublicRegister />} />

      {/* ── Separate login pages ─────────────────────────────────
          Participants  →  /user/login
          Marshals      →  /admin/login
          Old /login    →  redirect to /user/login so old links don't break
      ──────────────────────────────────────────────────────── */}
      <Route path="/user/login"  element={<ParticipantLogin />} />
      <Route path="/admin/login" element={<MarshalLogin />} />
      <Route path="/login"       element={<Navigate to="/user/login" replace />} />
      <Route path="/register"    element={<Navigate to="/user/login" replace />} />

      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password"  element={<ResetPassword />} />

      {/* Participant pages — no JWT needed, ParticipantGateWrapper handles its own gate */}
      <Route element={<AppLayout />}>
        <Route path="/"            element={<Home />} />
        <Route path="/submit"      element={<SubmitBug />} />
        <Route path="/my-reports"  element={<MyReports />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Route>

      {/* Marshal pages — JWT required; unauthenticated → /admin/login */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/admin/login" replace />} />}>
        <Route element={<AppLayout />}>
          <Route path="/marshal/queue"         element={<MarshalGateWrapper><MarshalQueue /></MarshalGateWrapper>} />
          <Route path="/marshal/registrations" element={<MarshalGateWrapper><MarshalRegistrations /></MarshalGateWrapper>} />
          <Route path="/marshal/checkin"       element={<MarshalGateWrapper><MarshalCheckin /></MarshalGateWrapper>} />
          <Route path="/marshal/stats"         element={<MarshalGateWrapper><MarshalStats /></MarshalGateWrapper>} />
          <Route path="/marshal/settings"      element={<MarshalGateWrapper><AdminSettings /></MarshalGateWrapper>} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <ParticipantSessionProvider>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </ParticipantSessionProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
