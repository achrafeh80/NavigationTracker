import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'wouter';
import { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  Map,
  History,
  Heart,
  BarChart2,
  Settings,
  Menu,
  X,
  LogOut,
  Navigation
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface SidebarProps {
  isMobile?: boolean;
}

export default function Sidebar({ isMobile = false }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(!isMobile);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Responsive handler - close sidebar on mobile when screen gets small
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Handle logout
  const handleLogout = () => {
    logoutMutation();
  };
  
  // Common navigation items
  const navItems = [
    { name: 'Navigation', path: '/', icon: <Map className="mr-3 h-5 w-5" /> },
    { name: 'Historique', path: '/history', icon: <History className="mr-3 h-5 w-5" /> },
    { name: 'Favoris', path: '/favorites', icon: <Heart className="mr-3 h-5 w-5" /> },
    { name: 'Statistiques', path: '/statistics', icon: <BarChart2 className="mr-3 h-5 w-5" /> },
    { name: 'Paramètres', path: '/settings', icon: <Settings className="mr-3 h-5 w-5" /> }
  ];
  
  // Mobile sidebar content
  const mobileMenu = (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}
      role="button"
      tabIndex={0}
      onClick={() => setMobileMenuOpen(false)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          setMobileMenuOpen(false);
        }
      }}
    >
      <div 
        className={`bg-white h-full w-64 p-4 transform transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Logo and App Name */}
        <div className="flex items-center mb-6">
          <div className="bg-primary rounded-md w-10 h-10 flex items-center justify-center">
            <Navigation className="text-white h-5 w-5" />
          </div>
          <h1 className="ml-3 text-xl font-heading font-semibold text-neutral-900">SupMap</h1>
        </div>
        
        {/* User Profile */}
        {user && (
          <div className="p-4 border border-neutral-200 rounded-lg mb-4">
            <div className="flex items-center">
              <Avatar className="h-10 w-10">
                <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} alt={user.name} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <p className="font-medium text-neutral-900">{user.name}</p>
                <p className="text-sm text-neutral-500">{user.email}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Navigation Menu */}
        <nav>
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link href={item.path}>
                  <a 
                    className={`flex items-center p-3 rounded-md ${
                      location === item.path 
                        ? 'bg-primary bg-opacity-10 text-primary' 
                        : 'hover:bg-neutral-100 text-neutral-700'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.icon}
                    <span className="font-medium">{item.name}</span>
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Logout Button */}
        <div className="mt-auto pt-4 border-t border-neutral-200">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-neutral-700 hover:bg-neutral-100"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-5 w-5" />
            <span>Déconnexion</span>
          </Button>
          
          {/* App Info */}
          <div className="mt-4 text-sm text-neutral-500">
            <p>SupMap v1.0.0</p>
            <p className="mt-1">&copy; 2023 Trafine</p>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Desktop sidebar content
  const desktopSidebar = isOpen && (
    <aside className="hidden md:flex flex-col w-80 border-r border-neutral-200 bg-white h-full z-10 transition-all duration-300 ease-in-out overflow-y-auto">
      {/* Logo and App Name */}
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center">
          <div className="bg-primary rounded-md w-10 h-10 flex items-center justify-center">
            <Navigation className="text-white h-5 w-5" />
          </div>
          <h1 className="ml-3 text-xl font-heading font-semibold text-neutral-900">SupMap</h1>
        </div>
      </div>

      {/* User Profile */}
      {user && (
        <div className="p-4 border-b border-neutral-200">
          <div className="flex items-center">
            <Avatar className="h-10 w-10">
              <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="font-medium text-neutral-900">{user.name}</p>
              <p className="text-sm text-neutral-500">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="p-2">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link href={item.path}>
                <a 
                  className={`flex items-center p-3 rounded-md ${
                    location === item.path 
                      ? 'bg-primary bg-opacity-10 text-primary' 
                      : 'hover:bg-neutral-100 text-neutral-700'
                  }`}
                >
                  {item.icon}
                  <span className="font-medium">{item.name}</span>
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* App Info */}
      <div className="mt-auto p-4 border-t border-neutral-200 text-sm text-neutral-500">
        <p>SupMap v1.0.0</p>
        <p className="mt-1">&copy; 2023 Trafine</p>
      </div>
    </aside>
  );
  
  // Mobile Header (visible only on mobile)
  const mobileHeader = isMobile && (
    <div className="md:hidden fixed top-0 left-0 right-0 bg-white z-20 shadow-md">
      <div className="flex items-center justify-between p-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="p-1"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Menu</span>
        </Button>
        <div className="flex items-center">
          <div className="bg-primary rounded-md w-8 h-8 flex items-center justify-center">
            <Navigation className="text-white h-4 w-4" />
          </div>
          <h1 className="ml-2 text-lg font-heading font-semibold text-neutral-900">SupMap</h1>
        </div>
        <Link href="/profile">
          <a className="p-1">
            <Avatar className="h-8 w-8">
              {user ? (
                <>
                  <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </>
              ) : (
                <AvatarFallback>U</AvatarFallback>
              )}
            </Avatar>
          </a>
        </Link>
      </div>
    </div>
  );
  
  return (
    <>
      {mobileHeader}
      {desktopSidebar}
      {mobileMenu}
    </>
  );
}
