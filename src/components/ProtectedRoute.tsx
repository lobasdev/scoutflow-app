import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription, useIsAdmin } from "@/hooks/useSubscription";
import { SubscriptionPaywall } from "@/components/subscription/SubscriptionPaywall";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSubscription?: boolean;
}

const ProtectedRoute = ({ children, requireSubscription = false }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { hasAccess, isLoading: subLoading } = useSubscription();
  const isAdmin = useIsAdmin();

  // Show nothing while checking auth status
  if (authLoading) {
    return null;
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check subscription if required
  if (requireSubscription) {
    // Still loading subscription
    if (subLoading) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    // Admin always has access
    if (isAdmin) {
      return <>{children}</>;
    }

    // Show paywall if no subscription
    if (!hasAccess) {
      return <SubscriptionPaywall />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
