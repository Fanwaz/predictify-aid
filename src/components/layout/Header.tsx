
import React from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon, User, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';

interface HeaderProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const Header: React.FC<HeaderProps> = ({ isDarkMode, toggleDarkMode }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const isMobile = useIsMobile();

  const getInitials = (name?: string) => {
    if (!name && user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    
    if (!name) return 'U';
    
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <header className="w-full py-4 px-4 md:px-6 bg-background/80 backdrop-blur-md border-b border-border/40 fixed top-0 z-10">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 transition-all hover:opacity-80">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-semibold text-xl">P</span>
          </div>
          <span className="font-medium text-base md:text-xl hidden sm:inline-block">
            Exam Question Predictor AI
          </span>
          <span className="font-medium text-base md:text-xl sm:hidden inline-block">
            Question AI
          </span>
        </Link>

        <div className="flex items-center space-x-2 md:space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="rounded-full transition-all duration-300 ease-in-out"
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 bg-primary/10 text-primary">
                  {getInitials(user?.name)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 animate-scale-in">
                <DropdownMenuItem>
                  <Link to="/settings" className="w-full flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-danger">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/sign-in">
              <Button variant="default" size={isMobile ? "sm" : "default"}>Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
