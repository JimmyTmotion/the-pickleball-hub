import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { User, Shield, LogOut, ShoppingBag, GraduationCap, Info, Phone, Menu, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import ContactForm from '../ContactForm';

const Navigation = () => {
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth');
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link to="/" className="text-xl font-bold text-primary">
            The Pickleball Hub
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/scheduler" className="text-gray-600 hover:text-primary transition-colors">
              Scheduler
            </Link>
            <button className="text-gray-400 cursor-not-allowed" disabled>
              Shop
            </button>
            <button className="text-gray-400 cursor-not-allowed" disabled>
              Coaching
            </button>
            <button className="text-gray-400 cursor-not-allowed" disabled>
              About
            </button>
            <button 
              className="text-gray-600 hover:text-primary transition-colors cursor-pointer"
              onClick={() => setIsContactFormOpen(true)}
            >
              Contact Us
            </button>
          </div>

          {/* Desktop User Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/account">
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    My Account
                  </Button>
                </Link>
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Admin
                    </Button>
                  </Link>
                )}
                <Button variant="outline" size="sm" onClick={handleSignOut} className="flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="default" size="sm">
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-4">
              {/* Mobile Navigation Links */}
              <Link 
                to="/scheduler" 
                className="text-gray-600 hover:text-primary transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Scheduler
              </Link>
              <button className="text-gray-400 cursor-not-allowed text-left py-2" disabled>
                Shop
              </button>
              <button className="text-gray-400 cursor-not-allowed text-left py-2" disabled>
                Coaching
              </button>
              <button className="text-gray-400 cursor-not-allowed text-left py-2" disabled>
                About
              </button>
              <button 
                className="text-gray-600 hover:text-primary transition-colors cursor-pointer text-left py-2"
                onClick={() => {
                  setIsContactFormOpen(true);
                  setIsMobileMenuOpen(false);
                }}
              >
                Contact Us
              </button>

              {/* Mobile User Actions */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                {user ? (
                  <div className="flex flex-col space-y-3">
                    <Link to="/account" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="ghost" size="sm" className="flex items-center gap-2 justify-start w-full">
                        <User className="h-4 w-4" />
                        My Account
                      </Button>
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="ghost" size="sm" className="flex items-center gap-2 justify-start w-full">
                          <Shield className="h-4 w-4" />
                          Admin
                        </Button>
                      </Link>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        handleSignOut();
                        setIsMobileMenuOpen(false);
                      }} 
                      className="flex items-center gap-2 justify-start w-full"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="default" size="sm" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <ContactForm 
        isOpen={isContactFormOpen} 
        onClose={() => setIsContactFormOpen(false)} 
      />
    </nav>
  );
};

export default Navigation;