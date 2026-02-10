import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export default function Header() {
  const { user, isAuthenticated, signOut } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path ? 'text-claw-purple' : 'text-slate-400 hover:text-white';
  
  return (
    <header className="bg-slate-900 border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🦞</span>
            <span className="text-xl font-bold text-white">ClawAuction</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/auctions" className={`transition-colors ${isActive('/auctions')}`}>
              Auctions
            </Link>
            {isAuthenticated() && (
              <Link to="/dashboard" className={`transition-colors ${isActive('/dashboard')}`}>
                Dashboard
              </Link>
            )}
            <Link to="/about" className={`transition-colors ${isActive('/about')}`}>
              About
            </Link>
          </nav>
          
          {/* User Actions */}
          <div className="flex items-center gap-4">
            {isAuthenticated() ? (
              <>
                <Link to="/profile" className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-claw-purple rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold">
                      {(user?.user_metadata?.display_name || user?.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden sm:block text-sm">
                    {user?.user_metadata?.display_name || user?.email || 'User'}
                  </span>
                </Link>
                <button
                  onClick={() => signOut()}
                  className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link to="/login" className="btn-primary text-sm">
                Sign In
              </Link>
            )}
            
            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-slate-400"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-700">
            <nav className="flex flex-col gap-4">
              <Link to="/auctions" className={`transition-colors ${isActive('/auctions')}`}>
                Auctions
              </Link>
              {isAuthenticated() && (
                <Link to="/dashboard" className={`transition-colors ${isActive('/dashboard')}`}>
                  Dashboard
                </Link>
              )}
              <Link to="/about" className={`transition-colors ${isActive('/about')}`}>
                About
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
