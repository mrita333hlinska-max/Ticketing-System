import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/app/layouts/AppLayout';
import { BoardPage } from '@/pages/board';
import { EpicsPage } from '@/pages/epics';
import { TeamsPage } from '@/pages/teams';
import { TicketPage } from '@/pages/ticket';
import { LoginPage, SignUpPage, VerifyEmailPage } from '@/pages/auth';
import { RequireAuth } from './RequireAuth';

export function AppRouter() {
  return (
    <Routes>
      {/* Public auth routes (no nav chrome). */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/verify" element={<VerifyEmailPage />} />

      {/* Authenticated app. */}
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/board" replace />} />
          <Route path="/board" element={<BoardPage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/epics" element={<EpicsPage />} />
          <Route path="/tickets/:ticketId" element={<TicketPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/board" replace />} />
    </Routes>
  );
}
