import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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
  const showBottomNav = location.pathname !== "/auth";

  return (
    <>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/players" element={<Home />} />
        <Route path="/shortlists" element={<Shortlists />} />
        <Route path="/inbox" element={<Inbox />} />
        <Route path="/inbox/new" element={<InboxForm />} />
        <Route path="/tournaments" element={<Tournaments />} />
        <Route path="/tournaments/new" element={<TournamentForm />} />
        <Route path="/tournaments/:id" element={<TournamentDetails />} />
        <Route path="/tournaments/:tournamentId/matches/new" element={<TournamentMatchForm />} />
        <Route path="/tournaments/:tournamentId/players/new" element={<TournamentPlayerForm />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/matches/new" element={<MatchForm />} />
        <Route path="/matches/:matchId" element={<MatchDetails />} />
        <Route path="/matches/:matchId/edit" element={<MatchForm />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/player/new" element={<PlayerForm />} />
        <Route path="/player/:id/edit" element={<PlayerForm />} />
        <Route path="/player/:id" element={<PlayerDetails />} />
        <Route path="/player/:playerId/observation/new" element={<ObservationForm />} />
        <Route path="/player/:playerId/observation/:observationId/edit" element={<ObservationForm />} />
        <Route path="/player/:playerId/observation/:observationId" element={<ObservationDetails />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {showBottomNav && <BottomNav />}
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
