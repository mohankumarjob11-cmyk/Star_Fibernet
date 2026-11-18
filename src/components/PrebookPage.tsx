import { useEffect, useState } from 'react';
import { CheckCircle2, MapPin } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { Booking } from '../types.ts';
import { formatINR } from '../utils/invoicePdf.ts';

export function PrebookPage() {
  const { plans, selectedPlanId, user, apiFetch, showToast, navigate } = useApp();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    mobile: '',
    altMobile: '',
    address: '',
    city: '',
    district: '',
    pinCode: '',
    connectionType: 'Home',
    planId: selectedPlanId ? String(selectedPlanId) : '',
    preferredDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<Booking | null>(null);
  const [pinStatus, setPinStatus] = useState<string>('');

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        fullName: prev.fullName || user.fullName,
        email: prev.email || user.email,
        mobile: prev.mobile || user.mobile,
        address: prev.address || user.address,
      }));
    }
  }, [user]);

  useEffect(() => {
    if (selectedPlanId) {
      setForm((prev) => ({ ...prev, planId: String(selectedPlanId) }));
    } else if (!form.planId && plans.length > 0) {
      const popular = plans.find((p) => p.isPopular) || plans[0];
      setForm((prev) => ({ ...prev, planId: String(popular.id) }));
    }
  }, [selectedPlanId, plans, form.planId]);

  const checkPin = async () => {
    if (!form.pinCode.trim()) return;
    try {
      const res = await fetch(
        `/api/service-areas/check?pin=${encodeURIComponent(form.pinCode.trim())}`
      );
      const data = await res.json();
      setPinStatus(data.message || 'Checked.');
      if (data.area) {
        setForm((prev) => ({
          ...prev,
          city: prev.city || data.area.city,
          district: prev.district || data.area.district,
        }));
      }
    } catch {
      setPinStatus('Could not verify PIN code.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = await apiFetch<{ booking: Booking }>('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setConfirmed(data.booking);
      showToast(`Connection prebooking ${data.booking.bookingCode} submitted.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit prebooking.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmed) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-14">
        <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-5">
          <CheckCircle2 className="w-10 h-10 text-blue-600" />
          <h1 className="font-display text-2xl font-bold text-slate-950">
            Connection Prebooking Confirmed
          </h1>
          <p className="text-sm text-slate-600">
            Your Star Fibernet prebooking has been logged with our local engineering desk. Track approval and installation scheduling from your customer dashboard.
          </p>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-slate-500">Booking ID</div>
              <div className="font-mono font-bold text-slate-950 tabular-nums">
                {confirmed.bookingCode}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Status</div>
              <div className="font-semibold text-blue-700">{confirmed.status}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Selected Plan</div>
              <div className="font-medium text-slate-900">{confirmed.planName}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Preferred Date</div>
              <div className="font-mono text-slate-900 tabular-nums">
                {confirmed.preferredDate}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            {user && (
              <button
                onClick={() => navigate('dashboard')}
                className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer"
              >
                Track in Dashboard
              </button>
            )}
            <button
              onClick={() => setConfirmed(null)}
              className="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Submit Another Booking
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 mb-1">
          FTTH New Connection
        </p>
        <h1 className="font-display text-3xl font-extrabold text-slate-950">
          Prebook Your Fiber Connection
        </h1>
        <p className="text-sm text-slate-600 mt-1.5">
          Reserve optical splitter capacity at your address and schedule a certified fiber installation.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Full Name *
            </label>
            <input
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="Priya Sharma"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email Address *
            </label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="name@example.com"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Mobile Number *
            </label>
            <input
              required
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              placeholder="+91 98450 00000"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-600 tabular-nums"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Alternative Contact Number
            </label>
            <input
              value={form.altMobile}
              onChange={(e) => setForm({ ...form, altMobile: e.target.value })}
              placeholder="Optional secondary number"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-600 tabular-nums"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              PIN Code *
            </label>
            <div className="flex gap-2">
              <input
                required
                value={form.pinCode}
                onChange={(e) => setForm({ ...form, pinCode: e.target.value })}
                placeholder="560038"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-600 tabular-nums"
              />
              <button
                type="button"
                onClick={checkPin}
                className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 inline mr-1" />
                Verify
              </button>
            </div>
            {pinStatus && <p className="text-xs text-blue-700 mt-1">{pinStatus}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              City *
            </label>
            <input
              required
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="Bengaluru"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              District *
            </label>
            <input
              required
              value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
              placeholder="Bengaluru Urban"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Installation Address *
          </label>
          <textarea
            required
            rows={2}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Apartment / House No, Street, Landmark"
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Connection Type *
            </label>
            <select
              value={form.connectionType}
              onChange={(e) => setForm({ ...form, connectionType: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:border-blue-600"
            >
              <option value="Home">Home</option>
              <option value="Business">Business</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Selected Internet Plan *
            </label>
            <select
              required
              value={form.planId}
              onChange={(e) => setForm({ ...form, planId: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:border-blue-600"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.speedMbps} Mbps · {formatINR(p.monthlyPrice)}/mo)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Preferred Installation Date *
            </label>
            <input
              required
              type="date"
              value={form.preferredDate}
              onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-600 tabular-nums"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Additional Requirements
          </label>
          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Static IP requirement, concealed conduit routing, mesh placement notes..."
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
          >
            {submitting ? 'Submitting Prebooking...' : 'Confirm Connection Prebooking'}
          </button>
        </div>
      </form>
    </div>
  );
}
