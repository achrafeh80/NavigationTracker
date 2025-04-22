import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'wouter';
import { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  Map,
  History,
  BarChart2,
  Settings,
  Navigation
} from 'lucide-react';

export default function Sidebar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    setIsOpen(true);
  }, []);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navItems = [
    { name: 'Navigation', path: '/', icon: <Map className="mr-3 h-5 w-5" /> },
    { name: 'Historique', path: '/history', icon: <History className="mr-3 h-5 w-5" /> },
    { name: 'Statistiques', path: '/statistics', icon: <BarChart2 className="mr-3 h-5 w-5" /> },
    { name: 'Paramètres', path: '/settings', icon: <Settings className="mr-3 h-5 w-5" /> }
  ];

  return isOpen ? (
    <aside className="flex flex-col w-80 border-r border-neutral-200 bg-white h-full z-10 overflow-y-auto">
      {/* Logo */}
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center">
          <div className="bg-primary rounded-md w-10 h-10 flex items-center justify-center">
            <Navigation className="text-white h-5 w-5" />
          </div>
          <h1 className="ml-3 text-xl font-heading font-semibold text-neutral-900">SupMap</h1>
        </div>
      </div>

      {/* User */}
      {user && (
        <div className="p-4 border-b border-neutral-200">
          <div className="flex items-center">
            <Avatar className="h-10 w-10">
              <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name ?? user.username)}&background=random`} />
              <AvatarFallback>{(user.name ?? user.username ?? 'U').charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="font-medium text-neutral-900">{user.name || user.username}</p>
              <p className="text-sm text-neutral-500">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Menu */}
      <nav className="p-2">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link href={item.path}>
                <button
                  className={`flex items-center p-3 rounded-md w-full gap-2 transition-colors ${
                    location === item.path
                      ? 'bg-primary bg-opacity-10 text-white white:text-white font-semibold'
                      : 'hover:bg-neutral-100 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </button>
              </Link>
            </li>
          ))}
        </ul>
      </nav>


      {/* Footer */}
      <div className="mt-auto p-4 border-t border-neutral-200 text-sm text-neutral-500">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-neutral-700 hover:bg-neutral-100"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          {logoutMutation.isPending ? (
            <div className="flex items-center">
              Logging out...
            </div>
          ) : (
            "Logout"
          )}
        </Button>
      </div>
    </aside>
  ) : null;
}
