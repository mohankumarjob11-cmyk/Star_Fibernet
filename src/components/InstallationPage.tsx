import { useEffect, useState } from 'react';
import { CheckCircle2, Upload } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { InstallationRequest } from '../types.ts';

const REQUEST_TYPES = [
  'New connection installation',
  'Router installation',
  'Fiber cable installation',
  'Router replacement',
  'Network troubleshooting',
  'Device configuration',
];

const TIME_SLOTS = [
  '09:00 AM - 12:00 PM',
  '12:00 PM - 03:00 PM',
  '03:00 PM - 06:00 PM',
];

export function InstallationPage() {
  const { user, apiFetch, showToast, navigate } = useApp();
  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    serviceAddress: '',
    requestType: REQUEST_TYPES[0],
    preferredDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    timeSlot: TIME_SLOTS[0],
    description: '',
    attachmentUrl: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<InstallationRequest | null>(null);

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        customerName: prev.customerName || user.fullName,
        customerEmail: prev.customerEmail || user.email,
        customerPhone: prev.customerPhone || user.mobile,
        serviceAddress: prev.serviceAddress || user.address,
      }));
    }
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image attachment must be under 2 MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setForm((prev) => ({ ...prev, attachmentUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiFetch<{ request: InstallationRequest }>('/api/installations', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setCreated(res.request);
      showToast(`Request ${res.request.requestCode} logged.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit installation request.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (created) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-14">
        <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-5">
          <CheckCircle2 className="w-10 h-10 text-blue-600" />
          <h1 className="font-display text-2xl font-bold text-slate-950">
            Installation Request Logged
          </h1>
          <p className="text-sm text-slate-600">
            Our dispatch team has received your service request and will assign an engineer for your preferred slot.
          </p>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-slate-500">Request ID</div>
              <div className="font-mono font-bold text-slate-950 tabular-nums">
                {created.requestCode}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Status</div>
              <div className="font-semibold text-blue-700">{created.status}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Service Type</div>
              <div className="font-medium text-slate-900">{created.requestType}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Preferred Slot</div>
              <div className="font-mono text-xs text-slate-900 tabular-nums">
                {created.preferredDate} · {created.timeSlot}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {user && (
              <button
                onClick={() => navigate('dashboard')}
                className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer"
              >
                Track in Dashboard
              </button>
            )}
            <button
              onClick={() => setCreated(null)}
              className="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 cursor-pointer"
            >
              New Request
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
          Field Engineering Dispatch
        </p>
        <h1 className="font-display text-3xl font-extrabold text-slate-950">
          Installation & Service Requests
        </h1>
        <p className="text-sm text-slate-600 mt-1.5">
          Schedule fiber drops, router setup, structured LAN cabling, or optical diagnostics with Star Fibernet technicians.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Full Name *
            </label>
            <input
              required
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
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
              value={form.customerEmail}
              onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Mobile Number *
            </label>
            <input
              required
              value={form.customerPhone}
              onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-600 tabular-nums"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Service Address *
          </label>
          <textarea
            required
            rows={2}
            value={form.serviceAddress}
            onChange={(e) => setForm({ ...form, serviceAddress: e.target.value })}
            placeholder="Complete installation or troubleshooting address"
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Request Type *
            </label>
            <select
              value={form.requestType}
              onChange={(e) => setForm({ ...form, requestType: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:border-blue-600"
            >
              {REQUEST_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Preferred Date *
            </label>
            <input
              required
              type="date"
              value={form.preferredDate}
              onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-600 tabular-nums"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Preferred Time Slot *
            </label>
            <select
              value={form.timeSlot}
              onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:border-blue-600"
            >
              {TIME_SLOTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Work Description *
          </label>
          <textarea
            required
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe cable route, router model, LED status, or configuration requirements..."
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-600"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Optional Photo Attachment (Router / Optical Port / Site)
          </label>
          <div className="flex flex-wrap items-center gap-4">
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
              <Upload className="w-4 h-4" />
              Upload Image
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            {form.attachmentUrl && (
              <div className="flex items-center gap-3">
                <img
                  src={form.attachmentUrl}
                  alt="Site preview"
                  className="w-16 h-12 object-cover rounded border border-slate-200"
                />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, attachmentUrl: '' })}
                  className="text-xs text-red-600 hover:underline cursor-pointer"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : 'Submit Installation Request'}
          </button>
        </div>
      </form>
    </div>
  );
}
