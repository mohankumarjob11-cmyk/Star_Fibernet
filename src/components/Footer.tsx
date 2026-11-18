import { Mail, MapPin, Phone } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

export function Footer() {
  const { navigate } = useApp();

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="space-y-3">
          <h3 className="font-display text-lg font-bold text-white">
            Star Fibernet
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Connecting you to a faster tomorrow. Symmetrical optical fiber broadband, certified FTTH installations, and enterprise networking hardware.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white mb-3">Connectivity</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li>
              <button onClick={() => navigate('plans')} className="hover:text-white transition-colors cursor-pointer">
                Fiber Internet Plans
              </button>
            </li>
            <li>
              <button onClick={() => navigate('prebook')} className="hover:text-white transition-colors cursor-pointer">
                New Connection Prebooking
              </button>
            </li>
            <li>
              <button onClick={() => navigate('installation')} className="hover:text-white transition-colors cursor-pointer">
                Installation & Service Request
              </button>
            </li>
            <li>
              <button onClick={() => navigate('shop')} className="hover:text-white transition-colors cursor-pointer">
                Networking Hardware Store
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white mb-3">Company</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li>
              <button onClick={() => navigate('about')} className="hover:text-white transition-colors cursor-pointer">
                About Star Fibernet
              </button>
            </li>
            <li>
              <button onClick={() => navigate('contact')} className="hover:text-white transition-colors cursor-pointer">
                Contact & NOC Support
              </button>
            </li>
            <li>
              <button onClick={() => navigate('dashboard')} className="hover:text-white transition-colors cursor-pointer">
                Customer Portal
              </button>
            </li>
            <li>
              <button onClick={() => navigate('auth')} className="hover:text-white transition-colors cursor-pointer">
                Sign In / Register
              </button>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-white mb-3">Headquarters & NOC</h4>
          <div className="flex items-start gap-2.5 text-sm text-slate-400">
            <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <span>Star Fibernet Towers, MG Road, Bengaluru 560001</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-slate-400">
            <Phone className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="tabular-nums">+91 80 4420 9900</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-slate-400">
            <Mail className="w-4 h-4 text-blue-400 shrink-0" />
            <span>support@starfibernet.com</span>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} Star Fibernet Broadband & Hardware Pvt. Ltd. All rights reserved.</span>
          <span>GSTIN: 29AAACS8842K1Z5</span>
        </div>
      </div>
    </footer>
  );
}
