import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlobalMenu from "@/components/GlobalMenu";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  showBackButton?: boolean;
  actions?: ReactNode;
  subtitle?: string;
}

const PageHeader = ({ title, showBackButton = true, actions, subtitle }: PageHeaderProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    // Use browser history to go back to the actual previous page
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-40">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {showBackButton && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleBack}
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium opacity-70">ScoutFlow</span>
                <span className="text-sm opacity-50">→</span>
                <h1 className="text-lg font-bold">{title}</h1>
              </div>
              {subtitle && (
                <p className="text-sm opacity-80 ml-0">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {actions}
            <GlobalMenu />
          </div>
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
