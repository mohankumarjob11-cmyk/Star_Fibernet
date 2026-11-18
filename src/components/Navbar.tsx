import { useState } from 'react';
import { Menu, ShoppingCart, X } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { PageRoute } from '../types.ts';

export function Navbar() {
  const { route, navigate, user, cartCount } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: { label: string; target: PageRoute }[] = [
    { label: 'Plans', target: 'plans' },
    { label: 'Prebook', target: 'prebook' },
    { label: 'Installation', target: 'installation' },
    { label: 'Shop', target: 'shop' },
    { label: 'About', target: 'about' },
  ];

  const handleNav = (target: PageRoute) => {
    setMobileOpen(false);
    navigate(target);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => handleNav('home')}
          className="font-display text-lg font-extrabold tracking-tight text-slate-950 whitespace-nowrap shrink-0 hover:text-blue-700 transition-colors cursor-pointer"
        >
          Star Fibernet
        </button>

        {/* Zone 2: Clean single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          {navItems.map((item) => {
            const active = route === item.target;
            return (
              <button
                key={item.target}
                onClick={() => handleNav(item.target)}
                className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                  active
                    ? 'text-blue-700 border-blue-600 font-semibold'
                    : 'border-transparent hover:text-slate-950 hover:border-slate-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Cart icon + Primary Auth/Portal action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => handleNav('cart')}
            aria-label="Open shopping cart"
            className="relative inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-700 transition-colors cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-md bg-blue-600 text-white text-[11px] font-semibold flex items-center justify-center tabular-nums">
                {cartCount}
              </span>
            )}
          </button>

          {user ? (
            <button
              onClick={() => handleNav(user.role === 'admin' ? 'admin' : 'dashboard')}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-slate-950 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {user.role === 'admin' ? 'Admin Panel' : 'My Dashboard'}
            </button>
          ) : (
            <button
              onClick={() => handleNav('auth')}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sign In
            </button>
          )}

          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle navigation menu"
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 text-slate-700"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2">
          {[
            { label: 'Home', target: 'home' as PageRoute },
            ...navItems,
            { label: 'Contact', target: 'contact' as PageRoute },
          ].map((item) => (
            <button
              key={item.target}
              onClick={() => handleNav(item.target)}
              className={`block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                route === item.target
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
