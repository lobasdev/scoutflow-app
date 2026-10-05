import { useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import MenuSheetContent from "@/components/MenuSheetContent";

const GlobalMenu = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-[280px] flex-col overflow-hidden sm:w-[320px]">
        <SheetHeader>
          <SheetTitle className="text-left">Menu</SheetTitle>
        </SheetHeader>
        <MenuSheetContent
          onNavigate={(path) => {
            navigate(path);
            setOpen(false);
          }}
        />
      </SheetContent>
    </Sheet>
  );
};

export default GlobalMenu;
