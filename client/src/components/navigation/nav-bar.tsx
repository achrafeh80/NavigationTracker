import { useState } from "react";
import { Link} from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2 } from "lucide-react";

export default function NavBar() {
  const { user, logoutMutation } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen);
  };

  return (
    <div className="bg-white shadow-md px-4 py-3 absolute top-0 left-0 right-0 flex justify-between items-center z-10">
      <div className="flex items-center gap-2">
        <span className="material-icons text-primary">navigation</span>
        <h1 className="text-xl font-semibold text-primary">SupMap</h1>
      </div>

      <div className="flex items-center gap-4">
        <button
          className="flex items-center gap-1 text-neutral-700 hover:text-primary transition-colors"
          onClick={toggleSettings}
        >
          <span className="material-icons">settings</span>
          <span className="hidden md:inline text-sm">Settings</span>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 text-neutral-700 hover:text-primary transition-colors">
              <span className="material-icons">account_circle</span>
              <span className="hidden md:inline text-sm">{user?.name || user?.username}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="cursor-pointer">
              Your Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              Your Routes
            </DropdownMenuItem>
            <Link href="/statistics">
              <DropdownMenuItem className="cursor-pointer">
                Statistics
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging out...
                </div>
              ) : (
                "Logout"
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
