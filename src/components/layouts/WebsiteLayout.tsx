'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, LayoutDashboard, Phone, MapPin, MessageCircle } from 'lucide-react';

export function WebsiteLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in by checking localStorage
    const checkAuth = () => {
      const accessToken = localStorage.getItem('accessToken');
      const userStr = localStorage.getItem('user');
      if (accessToken && userStr) {
        setIsLoggedIn(true);
        try {
          const user = JSON.parse(userStr);
          setUserRole(user.role);
        } catch {
          setUserRole(null);
        }
      } else {
        setIsLoggedIn(false);
        setUserRole(null);
      }
    };
    
    checkAuth();
    // Listen for storage changes (in case of logout in another tab)
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const handleGoToDashboard = useCallback(() => {
    if (userRole === 'ADMIN') {
      router.push('/app/admin');
    } else {
      router.push('/app/home');
    }
  }, [userRole, router]);

  const navLinks = useMemo(() => [
    { label: 'Home', href: '/' },
    { label: 'Services', href: '/services' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ], []);

  return (
    <div className="min-h-screen bg-primary text-white selection:bg-accent-gold/30">
      {/* Navigation - Premium floating translucent glass */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl">
        <div className="relative backdrop-blur-2xl backdrop-saturate-150 bg-black/30 border border-white/[0.1] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] px-6 sm:px-8 h-16 flex items-center justify-between overflow-hidden">
          {/* Inner glow highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
          
          <Link href="/" className="relative flex items-center gap-3 hover:opacity-90 transition-opacity duration-200">
            <div className="relative overflow-hidden rounded-xl w-10 h-10 sm:w-11 sm:h-11">
              <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/30 to-accent-gold/20 blur-xl pointer-events-none" style={{ transform: 'scale(1.4)' }} />
              <img src="/logo.png" alt="FitSense Logo" className="relative w-full h-full object-cover drop-shadow-[0_0_15px_rgba(250,52,25,0.4)]" style={{ filter: 'brightness(1.2) contrast(1.15)', transform: 'scale(1.35)' }} />
            </div>
            <span className="font-bold text-lg sm:text-xl tracking-tight text-white drop-shadow-sm">FitSense</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 text-sm font-semibold relative">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => router.push(link.href)}
                className="px-4 py-2 rounded-full text-white/90 hover:text-white hover:bg-white/[0.1] transition-all duration-150 font-medium"
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="relative flex items-center gap-3">
            {isLoggedIn ? (
              <button 
                onClick={handleGoToDashboard} 
                className="flex items-center gap-2 bg-gradient-to-r from-accent-blue to-accent-gold text-white px-5 py-2.5 rounded-full text-sm font-bold tracking-wide hover:shadow-lg hover:shadow-accent-blue/25 transition-all duration-200 active:scale-[0.98]"
              >
                <LayoutDashboard size={16} />
                Dashboard
              </button>
            ) : (
              <>
                <button 
                  onClick={() => router.push('/login')} 
                  className="hidden sm:block text-sm font-semibold text-white/90 hover:text-white px-4 py-2 rounded-full hover:bg-white/[0.1] transition-all duration-150"
                >
                  Log In
                </button>
                <button 
                  onClick={() => router.push('/register')} 
                  className="bg-gradient-to-r from-accent-blue to-accent-gold text-white px-5 py-2.5 rounded-full text-sm font-bold tracking-wide hover:shadow-lg hover:shadow-accent-blue/25 transition-all duration-200 active:scale-[0.98]"
                >
                  Join Now
                </button>
              </>
            )}
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-white/90 hover:text-white hover:bg-white/[0.1] rounded-full transition-colors duration-150"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-2 backdrop-blur-2xl backdrop-saturate-150 bg-black/30 border border-white/[0.1] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden">
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => {
                    router.push(link.href);
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-3 rounded-xl text-white/90 hover:text-white hover:bg-white/[0.1] transition-all duration-150 text-base font-medium"
                >
                  {link.label}
                </button>
              ))}
              <div className="pt-2 mt-2 border-t border-white/[0.1]">
                {isLoggedIn ? (
                  <button
                    onClick={() => {
                      handleGoToDashboard();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2 w-full text-left px-4 py-3 rounded-xl text-accent-blue hover:bg-accent-blue/10 transition-all duration-150 text-base font-semibold"
                  >
                    <LayoutDashboard size={18} />
                    Go to Dashboard
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      router.push('/login');
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-3 rounded-xl text-white/90 hover:text-white hover:bg-white/[0.1] transition-all duration-150 text-base font-medium"
                  >
                    Log In
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      <main className="">
        {children}
      </main>

      {/* Footer - Elegant & Minimal */}
      <footer className="border-t border-white/[0.06] bg-gradient-to-b from-transparent to-black/40 pt-16 pb-8 mt-20">
         <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-12">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-3 mb-4 hover:opacity-90 transition-opacity">
                <div className="relative overflow-hidden rounded-xl w-12 h-12">
                  <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/25 to-accent-gold/15 blur-lg pointer-events-none" style={{ transform: 'scale(1.3)' }} />
                  <img src="/logo.png" alt="FitSense Logo" className="relative w-full h-full object-cover drop-shadow-[0_0_10px_rgba(250,52,25,0.3)]" style={{ filter: 'brightness(1.2) contrast(1.15)', transform: 'scale(1.35)' }} />
                </div>
                <h4 className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent">FitSense</h4>
              </Link>
              <p className="text-accent-gold/90 text-sm font-semibold mb-2">Where Fitness Becomes a Lifestyle</p>
              <p className="text-white/40 text-sm leading-relaxed font-medium">Train Smart • Live Strong • Feel Elite</p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-white/95 tracking-wide">Quick Links</h4>
              <ul className="space-y-2.5 text-sm text-white/50 font-medium">
                <li><button onClick={() => router.push('/')} className="hover:text-accent-gold transition-colors duration-150">Home</button></li>
                <li><button onClick={() => router.push('/services')} className="hover:text-accent-gold transition-colors duration-150">Services</button></li>
                <li><button onClick={() => router.push('/about')} className="hover:text-accent-gold transition-colors duration-150">About Us</button></li>
                <li><button onClick={() => router.push('/contact')} className="hover:text-accent-gold transition-colors duration-150">Contact</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-white/95 tracking-wide">Legal</h4>
              <ul className="space-y-2.5 text-sm text-white/50 font-medium">
                <li><button onClick={() => router.push('/privacy')} className="hover:text-accent-gold transition-colors duration-150">Privacy Policy</button></li>
                <li><button onClick={() => router.push('/terms')} className="hover:text-accent-gold transition-colors duration-150">Terms & Conditions</button></li>
                <li><button onClick={() => router.push('/refund')} className="hover:text-accent-gold transition-colors duration-150">Refund Policy</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-white/95 tracking-wide">Connect</h4>
              <ul className="space-y-2.5 text-sm text-white/50 font-medium">
                <li>
                  <a href="https://wa.me/919136688997" target="_blank" rel="noopener noreferrer" className="hover:text-accent-gold transition-colors duration-150 flex items-center gap-2">
                    <MessageCircle size={14} />
                    <span>WhatsApp</span>
                  </a>
                </li>
                <li>
                  <a href="tel:+919136688997" className="hover:text-accent-gold transition-colors duration-150 flex items-center gap-2">
                    <Phone size={14} />
                    <span>+91 91366 88997</span>
                  </a>
                </li>
                <li>
                  <a href="https://www.google.com/maps/place/fitsense+fitness+hub/data=!4m2!3m1!1s0x3be7bf000af46b77:0xd7e20cde809bc9e" target="_blank" rel="noopener noreferrer" className="hover:text-accent-gold transition-colors duration-150 flex items-center gap-2">
                    <MapPin size={14} />
                    <span>View on Maps</span>
                  </a>
                </li>
              </ul>
              <p className="text-white/30 text-xs mt-3 leading-relaxed">Devi Krupa Chawl, near Adhikar Chowk, Bhaskar Nagar, Kalwa, Thane 400605</p>
            </div>
         </div>
         <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-white/[0.06]">
           <div className="flex flex-col md:flex-row justify-between items-center gap-4">
             <p className="text-accent-gold/60 text-sm italic font-medium">Train with Purpose. Transform with Pride.</p>
             <p className="text-white/30 text-xs font-medium">© 2025 FitSense Fitness Hub. All rights reserved.</p>
           </div>
         </div>
      </footer>
    </div>
  );
}
