import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import PlayerForm from "./pages/PlayerForm";
import PlayerDetails from "./pages/PlayerDetails";
import ObservationForm from "./pages/ObservationForm";
import ObservationDetails from "./pages/ObservationDetails";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
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
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
