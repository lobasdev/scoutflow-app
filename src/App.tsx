import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Shortlists from "./pages/Shortlists";
import Inbox from "./pages/Inbox";
import InboxForm from "./pages/InboxForm";
import Tournaments from "./pages/Tournaments";
import TournamentForm from "./pages/TournamentForm";
import TournamentDetails from "./pages/TournamentDetails";
import TournamentMatchForm from "./pages/TournamentMatchForm";
import TournamentPlayerForm from "./pages/TournamentPlayerForm";
import Matches from "./pages/Matches";
import MatchForm from "./pages/MatchForm";
import MatchDetails from "./pages/MatchDetails";
import PlayerForm from "./pages/PlayerForm";
import PlayerDetails from "./pages/PlayerDetails";
import ObservationForm from "./pages/ObservationForm";
import ObservationDetails from "./pages/ObservationDetails";
import Profile from "./pages/Profile";
import PlayerComparison from "./pages/PlayerComparison";
import Teams from "./pages/Teams";
import TeamDetails from "./pages/TeamDetails";
import TeamForm from "./pages/TeamForm";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Landing from "./pages/Landing";
import Contact from "./pages/Contact";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import BottomNav from "@/components/BottomNav";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const AppContent = () => {
  const location = useLocation();
  const hideBottomNav = ["/auth", "/forgot-password", "/reset-password", "/", "/contact"].includes(location.pathname);

  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/contact" element={<Contact />} />
        
        {/* Protected routes - require authentication */}
        <Route path="/dashboard" element={<ProtectedRoute requireSubscription><Dashboard /></ProtectedRoute>} />
        <Route path="/players" element={<ProtectedRoute requireSubscription><Home /></ProtectedRoute>} />
        <Route path="/shortlists" element={<ProtectedRoute requireSubscription><Shortlists /></ProtectedRoute>} />
        <Route path="/inbox" element={<ProtectedRoute requireSubscription><Inbox /></ProtectedRoute>} />
        <Route path="/inbox/new" element={<ProtectedRoute requireSubscription><InboxForm /></ProtectedRoute>} />
        <Route path="/tournaments" element={<ProtectedRoute requireSubscription><Tournaments /></ProtectedRoute>} />
        <Route path="/tournaments/new" element={<ProtectedRoute requireSubscription><TournamentForm /></ProtectedRoute>} />
        <Route path="/tournaments/:id" element={<ProtectedRoute requireSubscription><TournamentDetails /></ProtectedRoute>} />
        <Route path="/tournaments/:tournamentId/matches/new" element={<ProtectedRoute requireSubscription><TournamentMatchForm /></ProtectedRoute>} />
        <Route path="/tournaments/:tournamentId/players/new" element={<ProtectedRoute requireSubscription><TournamentPlayerForm /></ProtectedRoute>} />
        <Route path="/matches" element={<ProtectedRoute requireSubscription><Matches /></ProtectedRoute>} />
        <Route path="/matches/new" element={<ProtectedRoute requireSubscription><MatchForm /></ProtectedRoute>} />
        <Route path="/matches/:matchId" element={<ProtectedRoute requireSubscription><MatchDetails /></ProtectedRoute>} />
        <Route path="/matches/:matchId/edit" element={<ProtectedRoute requireSubscription><MatchForm /></ProtectedRoute>} />
        <Route path="/player/new" element={<ProtectedRoute requireSubscription><PlayerForm /></ProtectedRoute>} />
        <Route path="/player/:id/edit" element={<ProtectedRoute requireSubscription><PlayerForm /></ProtectedRoute>} />
        <Route path="/player/:id" element={<ProtectedRoute requireSubscription><PlayerDetails /></ProtectedRoute>} />
        <Route path="/player/:playerId/observation/new" element={<ProtectedRoute requireSubscription><ObservationForm /></ProtectedRoute>} />
        <Route path="/player/:playerId/observation/:observationId/edit" element={<ProtectedRoute requireSubscription><ObservationForm /></ProtectedRoute>} />
        <Route path="/player/:playerId/observation/:observationId" element={<ProtectedRoute requireSubscription><ObservationDetails /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/comparison" element={<ProtectedRoute requireSubscription><PlayerComparison /></ProtectedRoute>} />
        <Route path="/teams" element={<ProtectedRoute requireSubscription><Teams /></ProtectedRoute>} />
        <Route path="/teams/new" element={<ProtectedRoute requireSubscription><TeamForm /></ProtectedRoute>} />
        <Route path="/teams/:id" element={<ProtectedRoute requireSubscription><TeamDetails /></ProtectedRoute>} />
        <Route path="/teams/:id/edit" element={<ProtectedRoute requireSubscription><TeamForm /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!hideBottomNav && <BottomNav />}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
