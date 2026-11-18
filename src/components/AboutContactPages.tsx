import { useState } from 'react';
import { Building2, Mail, MapPin, Phone, ShieldCheck, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { ResilientImage } from './ResilientImage.tsx';

export function AboutPage() {
  const { navigate } = useApp();
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-6 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
            About Star Fibernet
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-950">
            Connecting You to a Faster Tomorrow.
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Star Fibernet operates an end-to-end single-mode optical fiber network serving homes, tech parks, and enterprise campuses. We pair low-latency symmetrical broadband with an in-house networking hardware store and certified field engineers.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200">
            <div>
              <div className="font-display text-2xl font-bold text-slate-950 tabular-nums">99.95%</div>
              <div className="text-xs text-slate-500">Core Ring Uptime</div>
            </div>
            <div>
              <div className="font-display text-2xl font-bold text-slate-950 tabular-nums">14+</div>
              <div className="text-xs text-slate-500">Hardware Categories</div>
            </div>
            <div>
              <div className="font-display text-2xl font-bold text-slate-950 tabular-nums">24h</div>
              <div className="text-xs text-slate-500">Average Install</div>
            </div>
          </div>
          <div className="pt-2 flex gap-3">
            <button
              onClick={() => navigate('prebook')}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer"
            >
              Book a Connection
            </button>
            <button
              onClick={() => navigate('contact')}
              className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-800 text-sm font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Contact NOC
            </button>
          </div>
        </div>
        <div className="lg:col-span-6">
          <div className="aspect-[16/9] rounded-xl overflow-hidden border border-slate-200">
            <ResilientImage
              src="/src/assets/images/hero_fiber_network_1795011448000.jpg"
              alt="Star Fibernet Network Operations Center"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white border border-slate-200 rounded-xl">
          <Zap className="w-5 h-5 text-blue-600 mb-3" />
          <h3 className="font-display font-bold text-slate-950">Direct Optical Peering</h3>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            Direct IXP peering across major cloud and gaming exchanges ensures consistent sub-4ms regional hops.
          </p>
        </div>
        <div className="p-6 bg-white border border-slate-200 rounded-xl">
          <ShieldCheck className="w-5 h-5 text-blue-600 mb-3" />
          <h3 className="font-display font-bold text-slate-950">Verified Hardware Supply</h3>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            Every ONT, Wi-Fi 7 router, switch, and patch cord is stocked locally and dispatched with GST tax invoices.
          </p>
        </div>
        <div className="p-6 bg-white border border-slate-200 rounded-xl">
          <Building2 className="w-5 h-5 text-blue-600 mb-3" />
          <h3 className="font-display font-bold text-slate-950">Enterprise SLA Ready</h3>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            Dedicated account engineering, static IP subnets, and dual-path failover for business offices.
          </p>
        </div>
      </div>
    </div>
  );
}

export function ContactPage() {
  const { user, apiFetch, showToast, navigate } = useApp();
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('New Connection Inquiry');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Please sign in to log a tracked support ticket.', 'info');
      navigate('auth');
      return;
    }
    setSending(true);
    try {
      await apiFetch('/api/tickets', {
        method: 'POST',
        body: JSON.stringify({
          subject,
          category,
          description: message,
          priority: 'Medium',
        }),
      });
      setSubject('');
      setMessage('');
      showToast('Inquiry logged in your Customer Dashboard Support Tickets.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit inquiry.', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 mb-1">
              24x7 Network Operations
            </p>
            <h1 className="font-display text-3xl font-extrabold text-slate-950">
              Contact Star Fibernet
            </h1>
            <p className="text-sm text-slate-600 mt-2">
              Reach our provisioning desk for enterprise leased lines, residential feasibility, or hardware order assistance.
            </p>
          </div>
          <div className="space-y-4 bg-white border border-slate-200 rounded-xl p-6 text-sm">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-blue-600 mt-1 shrink-0" />
              <div>
                <div className="font-semibold text-slate-950">Headquarters & NOC</div>
                <div className="text-slate-600 text-xs mt-0.5">
                  Star Fibernet Towers, MG Road, Bengaluru 560001
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-blue-600 mt-1 shrink-0" />
              <div>
                <div className="font-semibold text-slate-950">NOC & Sales Hotline</div>
                <div className="text-slate-600 text-xs mt-0.5 tabular-nums">+91 80 4420 9900</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-blue-600 mt-1 shrink-0" />
              <div>
                <div className="font-semibold text-slate-950">Email Desk</div>
                <div className="text-slate-600 text-xs mt-0.5">support@starfibernet.com</div>
              </div>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5"
        >
          <h2 className="font-display text-xl font-bold text-slate-950">
            Send a Message or Support Ticket
          </h2>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Topic Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:border-blue-600"
            >
              <option>New Connection Inquiry</option>
              <option>Billing & GST Invoice</option>
              <option>Technical Support</option>
              <option>Enterprise SLA Quote</option>
              <option>Hardware Order Support</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Subject *
            </label>
            <input
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of your request"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Message *
            </label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share address PIN code, order ID, or technical details..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-600"
            />
          </div>
          <button
            type="submit"
            disabled={sending}
            className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer disabled:opacity-60"
          >
            {sending ? 'Sending...' : user ? 'Create Support Ticket' : 'Sign In to Submit Ticket'}
          </button>
        </form>
      </div>
    </div>
  );
}
