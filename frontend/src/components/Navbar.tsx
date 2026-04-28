import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Shield, LogOut } from 'lucide-react';
import { HealthIndicator } from './HealthIndicator';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/login/university', label: 'University Login' },
    { to: '/login/verifier', label: 'Verifier Login' },
  ];

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-md bg-background/50 border-b border-border/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xl font-bold text-gradient">CertiVerify</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {!isAuthenticated ? (
              navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  {link.label}
                </Link>
              ))
            ) : (
              <>
                <Link
                  to={user?.role === 'issuer' ? '/dashboard/issuer' : '/dashboard/verifier'}
                  className="text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  Dashboard
                </Link>
                <span className="text-muted-foreground text-sm">
                  {user?.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-muted-foreground hover:text-destructive transition-colors font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <HealthIndicator />
            
            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-muted/30 transition-colors"
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
            >
              {isOpen ? (
                <X className="w-6 h-6 text-foreground" />
              ) : (
                <Menu className="w-6 h-6 text-foreground" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={cn(
          'md:hidden overflow-hidden transition-all duration-300 ease-in-out',
          isOpen ? 'max-h-64' : 'max-h-0'
        )}
      >
        <div className="px-4 py-4 space-y-2 border-t border-border/30">
          {!isAuthenticated ? (
            navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
              >
                {link.label}
              </Link>
            ))
          ) : (
            <>
              <Link
                to={user?.role === 'issuer' ? '/dashboard/issuer' : '/dashboard/verifier'}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
              >
                Dashboard
              </Link>
              <div className="px-4 py-2 text-muted-foreground text-sm">
                {user?.email}
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
