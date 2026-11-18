import { useCallback, useEffect, useState } from 'react';
import {
  Bell,
  CalendarClock,
  CreditCard,
  FileText,
  Heart,
  HelpCircle,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  ShoppingBag,
  Trash2,
  User as UserIcon,
  Wrench,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import {
  Booking,
  InstallationRequest,
  InvoiceRecord,
  NotificationItem,
  Order,
  OrderItem,
  PaymentRecord,
  Product,
  SupportTicket,
  UserAddress,
} from '../types.ts';
import { formatINR } from '../utils/invoicePdf.ts';
import { InvoiceModal } from './InvoiceModal.tsx';
import { ResilientImage } from './ResilientImage.tsx';

type DashTab =
  | 'overview'
  | 'profile'
  | 'prebookings'
  | 'installations'
  | 'orders'
  | 'payments'
  | 'invoices'
  | 'wishlist'
  | 'addresses'
  | 'tickets'
  | 'notifications'
  | 'password';

export function CustomerDashboard() {
  const { user, apiFetch, logout, refreshUser, showToast, addToCart, navigate } = useApp();
  const [tab, setTab] = useState<DashTab>('overview');
  const [bookingsList, setBookingsList] = useState<Booking[]>([]);
  const [installsList, setInstallsList] = useState<InstallationRequest[]>([]);
  const [ordersList, setOrdersList] = useState<Order[]>([]);
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [addressesList, setAddressesList] = useState<UserAddress[]>([]);
  const [ticketsList, setTicketsList] = useState<SupportTicket[]>([]);
  const [notifList, setNotifList] = useState<NotificationItem[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [invoiceModalData, setInvoiceModalData] = useState<{
    order: Order;
    items: OrderItem[];
    payment: PaymentRecord | null;
    invoice: InvoiceRecord | null;
  } | null>(null);

  // Forms
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    mobile: user?.mobile || '',
    address: user?.address || '',
  });
  const [addrForm, setAddrForm] = useState({
    label: 'Home',
    line1: '',
    city: '',
    district: '',
    pinCode: '',
    phone: '',
    isDefault: false,
  });
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: 'Technical Support',
    description: '',
    priority: 'Medium',
  });
  const [passForm, setPassForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [b, i, o, w, a, t, n] = await Promise.all([
        apiFetch<{ bookings: Booking[] }>('/api/bookings/my'),
        apiFetch<{ requests: InstallationRequest[] }>('/api/installations/my'),
        apiFetch<{ orders: Order[] }>('/api/orders/my'),
        apiFetch<{ items: Product[] }>('/api/wishlist'),
        apiFetch<{ addresses: UserAddress[] }>('/api/addresses'),
        apiFetch<{ tickets: SupportTicket[] }>('/api/tickets/my'),
        apiFetch<{ notifications: NotificationItem[] }>('/api/notifications'),
      ]);
      setBookingsList(b.bookings || []);
      setInstallsList(i.requests || []);
      setOrdersList(o.orders || []);
      setWishlistItems(w.items || []);
      setAddressesList(a.addresses || []);
      setTicketsList(t.tickets || []);
      setNotifList(n.notifications || []);
    } catch (err) {
      console.error('Customer dashboard load error:', err);
    }
  }, [user, apiFetch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.fullName,
        mobile: user.mobile,
        address: user.address,
      });
    }
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="font-display text-2xl font-bold text-slate-950">
          Sign In to View Your Dashboard
        </h1>
        <button
          onClick={() => navigate('auth')}
          className="px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold cursor-pointer"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  const unreadNotifs = notifList.filter((n) => !n.isRead).length;

  const navButtons: { id: DashTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'profile', label: 'My Profile', icon: <UserIcon className="w-4 h-4" /> },
    { id: 'prebookings', label: 'My Prebookings', icon: <CalendarClock className="w-4 h-4" /> },
    { id: 'installations', label: 'Installation Requests', icon: <Wrench className="w-4 h-4" /> },
    { id: 'orders', label: 'My Orders', icon: <Package className="w-4 h-4" /> },
    { id: 'payments', label: 'Payment History', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'invoices', label: 'Download Invoices', icon: <FileText className="w-4 h-4" /> },
    { id: 'wishlist', label: 'Wishlist', icon: <Heart className="w-4 h-4" /> },
    { id: 'addresses', label: 'Address Management', icon: <MapPin className="w-4 h-4" /> },
    { id: 'tickets', label: 'Support Tickets', icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" />, badge: unreadNotifs },
    { id: 'password', label: 'Change Password', icon: <KeyRound className="w-4 h-4" /> },
  ];

  const openInvoice = async (orderId: number) => {
    try {
      const data = await apiFetch<{
        order: Order;
        items: OrderItem[];
        payment: PaymentRecord | null;
        invoice: InvoiceRecord | null;
      }>(`/api/orders/${orderId}/invoice`);
      setInvoiceModalData(data);
    } catch (err: any) {
      showToast(err.message || 'Could not load invoice.', 'error');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileForm),
      });
      await refreshUser();
      showToast('Profile updated.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile.', 'error');
    }
  };

  const handleRequestBookingCancel = async (id: number) => {
    try {
      await apiFetch(`/api/bookings/${id}/cancel-request`, { method: 'POST' });
      await loadData();
      showToast('Cancellation request sent to admin.', 'info');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleRequestOrderCancel = async (id: number) => {
    try {
      await apiFetch(`/api/orders/${id}/cancel-request`, { method: 'POST' });
      await loadData();
      showToast('Order cancellation request submitted.', 'info');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/addresses', {
        method: 'POST',
        body: JSON.stringify(addrForm),
      });
      setAddrForm({
        label: 'Home',
        line1: '',
        city: '',
        district: '',
        pinCode: '',
        phone: '',
        isDefault: false,
      });
      await loadData();
      showToast('Delivery address saved.', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteAddress = async (id: number) => {
    await apiFetch(`/api/addresses/${id}`, { method: 'DELETE' });
    await loadData();
    showToast('Address removed.', 'info');
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/tickets', {
        method: 'POST',
        body: JSON.stringify(ticketForm),
      });
      setTicketForm({ subject: '', category: 'Technical Support', description: '', priority: 'Medium' });
      await loadData();
      showToast('Support ticket raised.', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    try {
      await apiFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: passForm.currentPassword,
          newPassword: passForm.newPassword,
        }),
      });
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('Password updated cleanly.', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const markAllRead = async () => {
    await apiFetch('/api/notifications/read-all', { method: 'POST' });
    await loadData();
  };

  const activeBooking = bookingsList.find((b) =>
    ['Scheduled', 'Completed', 'Approved'].includes(b.status)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar */}
        <aside className="lg:col-span-3 space-y-2">
          <div className="bg-white border border-slate-200 rounded-xl p-4 mb-3">
            <div className="font-display text-base font-bold text-slate-950 truncate">
              {user.fullName}
            </div>
            <div className="text-xs text-slate-500 truncate">{user.email}</div>
            {user.referralCode && (
              <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-600 flex justify-between">
                <span>Referral Code</span>
                <span className="font-mono font-semibold text-blue-700">
                  {user.referralCode}
                </span>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-2 space-y-1">
            {navButtons.map((btn) => (
              <button
                key={btn.id}
                onClick={() => {
                  setTab(btn.id);
                  setSelectedOrder(null);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  tab === btn.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  {btn.icon}
                  <span className="truncate">{btn.label}</span>
                </span>
                {btn.badge ? (
                  <span
                    className={`text-[11px] font-mono tabular-nums ${
                      tab === btn.id ? 'text-blue-100' : 'text-blue-700'
                    }`}
                  >
                    {btn.badge}
                  </span>
                ) : null}
              </button>
            ))}
            <button
              onClick={logout}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-9 space-y-6">
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <div className="text-xs text-slate-500">Prebookings</div>
                  <div className="font-display text-2xl font-bold text-slate-950 mt-1 tabular-nums">
                    {bookingsList.length}
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <div className="text-xs text-slate-500">Install Requests</div>
                  <div className="font-display text-2xl font-bold text-slate-950 mt-1 tabular-nums">
                    {installsList.length}
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <div className="text-xs text-slate-500">Hardware Orders</div>
                  <div className="font-display text-2xl font-bold text-slate-950 mt-1 tabular-nums">
                    {ordersList.length}
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <div className="text-xs text-slate-500">Reward Points</div>
                  <div className="font-display text-2xl font-bold text-blue-700 mt-1 tabular-nums">
                    {user.rewardPoints}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                    Internet Subscription Status
                  </div>
                  <h2 className="font-display text-lg font-bold text-slate-950 mt-1">
                    {activeBooking ? activeBooking.planName : 'No Active Fiber Plan Yet'}
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    {activeBooking
                      ? `Booking ${activeBooking.bookingCode} · Status: ${activeBooking.status} · ${activeBooking.city}`
                      : 'Prebook a symmetrical fiber plan to activate broadband at your home or office.'}
                  </p>
                </div>
                <button
                  onClick={() => navigate('prebook')}
                  className="px-4 py-2 rounded-lg bg-slate-950 hover:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {activeBooking ? 'Upgrade / Book New Line' : 'Prebook Fiber Plan'}
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="font-display text-base font-bold text-slate-950 mb-4">
                  Recent Orders
                </h3>
                {ordersList.length === 0 ? (
                  <p className="text-xs text-slate-500">No hardware orders placed yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {ordersList.slice(0, 4).map((o) => (
                      <div
                        key={o.id}
                        className="py-3 flex flex-wrap items-center justify-between gap-3 text-sm"
                      >
                        <div>
                          <div className="font-mono font-semibold text-slate-950 tabular-nums">
                            {o.orderCode}
                          </div>
                          <div className="text-xs text-slate-500">
                            {o.orderStatus} · {o.paymentMethod} ({o.paymentStatus})
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold tabular-nums">
                            {formatINR(o.totalAmount)}
                          </span>
                          <button
                            onClick={() => openInvoice(o.id)}
                            className="text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
                          >
                            Invoice
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'profile' && (
            <form
              onSubmit={handleSaveProfile}
              className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
            >
              <h2 className="font-display text-xl font-bold text-slate-950">My Profile</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    required
                    value={profileForm.fullName}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, fullName: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Number
                  </label>
                  <input
                    value={profileForm.mobile}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, mobile: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm tabular-nums"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Default Service / Billing Address
                </label>
                <textarea
                  rows={2}
                  value={profileForm.address}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, address: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
              >
                Save Profile
              </button>
            </form>
          )}

          {tab === 'prebookings' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold text-slate-950">
                  My Connection Prebookings
                </h2>
                <button
                  onClick={() => navigate('prebook')}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                >
                  New Prebooking
                </button>
              </div>
              {bookingsList.length === 0 ? (
                <p className="text-sm text-slate-500">No connection prebookings yet.</p>
              ) : (
                <div className="divide-y divide-slate-200">
                  {bookingsList.map((b) => (
                    <div key={b.id} className="py-4 flex flex-col sm:flex-row justify-between gap-4">
                      <div>
                        <div className="font-mono text-sm font-bold text-slate-950 tabular-nums">
                          {b.bookingCode} · {b.planName}
                        </div>
                        <div className="text-xs text-slate-600 mt-1">
                          {b.connectionType} · {b.address}, {b.city} ({b.pinCode})
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Preferred Date: {b.preferredDate} · Status:{' '}
                          <span className="font-semibold text-blue-700">{b.status}</span>
                        </div>
                        {b.adminNotes && (
                          <div className="text-xs text-slate-700 mt-1">
                            NOC Note: {b.adminNotes}
                          </div>
                        )}
                      </div>
                      <div className="self-start">
                        {b.cancellationRequested ? (
                          <span className="text-xs text-amber-700 font-semibold">
                            Cancellation Requested
                          </span>
                        ) : (
                          !['Completed', 'Cancelled', 'Rejected'].includes(b.status) && (
                            <button
                              onClick={() => handleRequestBookingCancel(b.id)}
                              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                            >
                              Request Cancellation
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'installations' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold text-slate-950">
                  Installation & Service Requests
                </h2>
                <button
                  onClick={() => navigate('installation')}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                >
                  New Request
                </button>
              </div>
              {installsList.length === 0 ? (
                <p className="text-sm text-slate-500">No installation requests logged.</p>
              ) : (
                <div className="divide-y divide-slate-200">
                  {installsList.map((r) => (
                    <div key={r.id} className="py-4 space-y-1">
                      <div className="flex flex-wrap justify-between gap-2">
                        <span className="font-mono text-sm font-bold text-slate-950 tabular-nums">
                          {r.requestCode} · {r.requestType}
                        </span>
                        <span className="text-xs font-semibold text-blue-700">
                          {r.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600">
                        {r.serviceAddress} · {r.preferredDate} ({r.timeSlot})
                      </div>
                      {r.technicianName && (
                        <div className="text-xs text-slate-700">
                          Assigned Technician: <span className="font-semibold">{r.technicianName}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'orders' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h2 className="font-display text-xl font-bold text-slate-950">
                {selectedOrder ? `Order Details · ${selectedOrder.orderCode}` : 'My Orders'}
              </h2>

              {selectedOrder ? (
                <div className="space-y-4">
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
                  >
                    Back to All Orders
                  </button>
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <div className="text-slate-500">Status</div>
                      <div className="font-semibold text-blue-700 mt-0.5">
                        {selectedOrder.orderStatus}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Payment</div>
                      <div className="font-semibold mt-0.5">
                        {selectedOrder.paymentMethod} ({selectedOrder.paymentStatus})
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Tracking</div>
                      <div className="font-mono mt-0.5">
                        {selectedOrder.trackingNumber || 'Pending Dispatch'}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Total</div>
                      <div className="font-bold mt-0.5 tabular-nums">
                        {formatINR(selectedOrder.totalAmount)}
                      </div>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
                    {(selectedOrder.items || []).map((it) => (
                      <div key={it.id} className="p-3 flex justify-between text-sm">
                        <div>
                          <div className="font-medium text-slate-950">{it.productName}</div>
                          <div className="text-xs text-slate-500 tabular-nums">
                            Qty {it.quantity} × {formatINR(it.unitPrice)}
                          </div>
                        </div>
                        <div className="font-semibold tabular-nums">
                          {formatINR(it.lineTotal)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => openInvoice(selectedOrder.id)}
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                    >
                      Print / Download Invoice
                    </button>
                    {!selectedOrder.cancellationRequested &&
                      ['Pending', 'Confirmed', 'Processing'].includes(
                        selectedOrder.orderStatus
                      ) && (
                        <button
                          onClick={() => handleRequestOrderCancel(selectedOrder.id)}
                          className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 cursor-pointer"
                        >
                          Request Cancellation
                        </button>
                      )}
                  </div>
                </div>
              ) : ordersList.length === 0 ? (
                <p className="text-sm text-slate-500">No orders placed yet.</p>
              ) : (
                <div className="divide-y divide-slate-200">
                  {ordersList.map((o) => (
                    <div
                      key={o.id}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-mono text-sm font-bold text-slate-950 tabular-nums">
                          {o.orderCode}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {new Date(o.createdAt).toLocaleDateString('en-IN')} · {o.orderStatus} ·{' '}
                          {o.paymentStatus}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-sm tabular-nums">
                          {formatINR(o.totalAmount)}
                        </span>
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                          Order Details
                        </button>
                        <button
                          onClick={() => openInvoice(o.id)}
                          className="px-3 py-1.5 rounded-lg bg-slate-950 text-white text-xs font-semibold hover:bg-blue-700 cursor-pointer"
                        >
                          Invoice
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'payments' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h2 className="font-display text-xl font-bold text-slate-950">
                Payment History
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="py-2 pr-4">Order</th>
                      <th className="py-2 pr-4">Gateway Ref</th>
                      <th className="py-2 pr-4">Method</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ordersList.map((o) => (
                      <tr key={o.id}>
                        <td className="py-3 pr-4 font-mono font-semibold tabular-nums">
                          {o.orderCode}
                        </td>
                        <td className="py-3 pr-4 font-mono text-xs text-slate-600">
                          {o.payment?.gatewayPaymentId || o.payment?.gatewayOrderId || 'COD'}
                        </td>
                        <td className="py-3 pr-4">{o.paymentMethod}</td>
                        <td className="py-3 pr-4 font-semibold">{o.paymentStatus}</td>
                        <td className="py-3 text-right font-semibold tabular-nums">
                          {formatINR(o.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'invoices' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h2 className="font-display text-xl font-bold text-slate-950">
                Downloadable GST Invoices
              </h2>
              <div className="divide-y divide-slate-200">
                {ordersList.map((o) => (
                  <div
                    key={o.id}
                    className="py-3.5 flex items-center justify-between gap-4 text-sm"
                  >
                    <div>
                      <div className="font-mono font-semibold text-slate-950">
                        {o.invoice?.invoiceNumber || `INV-SF-${o.orderCode.replace('ORD-', '')}`}
                      </div>
                      <div className="text-xs text-slate-500 tabular-nums">
                        Order {o.orderCode} · {formatINR(o.totalAmount)}
                      </div>
                    </div>
                    <button
                      onClick={() => openInvoice(o.id)}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      Open / Print / PDF
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'wishlist' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h2 className="font-display text-xl font-bold text-slate-950">
                Saved Wishlist
              </h2>
              {wishlistItems.length === 0 ? (
                <p className="text-sm text-slate-500">Your wishlist is empty.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wishlistItems.map((p) => (
                    <div
                      key={p.id}
                      className="border border-slate-200 rounded-xl p-4 flex items-center gap-4"
                    >
                      <div className="w-20 h-16 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                        <ResilientImage
                          src={p.images[0]}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-slate-950 truncate">
                          {p.name}
                        </div>
                        <div className="text-xs text-slate-600 tabular-nums mt-0.5">
                          {formatINR(p.sellingPrice)}
                        </div>
                        <button
                          onClick={() => addToCart(p)}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" /> Move to Cart
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'addresses' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <h2 className="font-display text-xl font-bold text-slate-950">
                  Saved Addresses
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addressesList.map((a) => (
                    <div
                      key={a.id}
                      className="border border-slate-200 rounded-xl p-4 flex justify-between gap-3"
                    >
                      <div className="text-xs">
                        <div className="font-bold text-slate-950">{a.label}</div>
                        <div className="text-slate-600 mt-1">
                          {a.line1}, {a.city}, {a.district} {a.pinCode}
                        </div>
                        <div className="text-slate-500 mt-1 tabular-nums">{a.phone}</div>
                      </div>
                      <button
                        onClick={() => handleDeleteAddress(a.id)}
                        className="text-slate-400 hover:text-red-600 self-start cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <form
                onSubmit={handleAddAddress}
                className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
              >
                <h3 className="font-display text-base font-bold text-slate-950">
                  Add New Address
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <input
                    required
                    placeholder="Label (Home / Office)"
                    value={addrForm.label}
                    onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                  <input
                    required
                    placeholder="Phone"
                    value={addrForm.phone}
                    onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                  <input
                    required
                    placeholder="PIN Code"
                    value={addrForm.pinCode}
                    onChange={(e) => setAddrForm({ ...addrForm, pinCode: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <input
                  required
                  placeholder="Street / Flat / Building"
                  value={addrForm.line1}
                  onChange={(e) => setAddrForm({ ...addrForm, line1: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    required
                    placeholder="City"
                    value={addrForm.city}
                    onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                  <input
                    required
                    placeholder="District"
                    value={addrForm.district}
                    onChange={(e) => setAddrForm({ ...addrForm, district: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                >
                  Save Address
                </button>
              </form>
            </div>
          )}

          {tab === 'tickets' && (
            <div className="space-y-6">
              <form
                onSubmit={handleCreateTicket}
                className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
              >
                <h2 className="font-display text-xl font-bold text-slate-950">
                  Raise a Support Ticket
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    required
                    placeholder="Subject"
                    value={ticketForm.subject}
                    onChange={(e) =>
                      setTicketForm({ ...ticketForm, subject: e.target.value })
                    }
                    className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                  <select
                    value={ticketForm.category}
                    onChange={(e) =>
                      setTicketForm({ ...ticketForm, category: e.target.value })
                    }
                    className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                  >
                    <option>Technical Support</option>
                    <option>Billing & GST Invoice</option>
                    <option>Speed & Latency</option>
                    <option>Hardware Warranty</option>
                  </select>
                </div>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe your issue..."
                  value={ticketForm.description}
                  onChange={(e) =>
                    setTicketForm({ ...ticketForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                >
                  Submit Ticket
                </button>
              </form>

              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
                <h3 className="font-display text-base font-bold text-slate-950">
                  My Tickets
                </h3>
                {ticketsList.map((t) => (
                  <div key={t.id} className="border-t border-slate-100 pt-3 text-sm">
                    <div className="flex justify-between font-semibold">
                      <span>
                        <span className="font-mono">{t.ticketCode}</span> · {t.subject}
                      </span>
                      <span className="text-xs text-blue-700">{t.status}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{t.description}</p>
                    {t.adminReply && (
                      <div className="mt-2 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800">
                        <span className="font-semibold">Support Reply:</span> {t.adminReply}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold text-slate-950">
                  Notifications
                </h2>
                <button
                  onClick={markAllRead}
                  className="text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
                >
                  Mark All Read
                </button>
              </div>
              {notifList.length === 0 ? (
                <p className="text-sm text-slate-500">No notifications yet.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifList.map((n) => (
                    <div key={n.id} className="py-3">
                      <div className="flex justify-between text-sm font-semibold text-slate-950">
                        <span>{n.title}</span>
                        {!n.isRead && (
                          <span className="text-xs text-blue-600">Unread</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'password' && (
            <form
              onSubmit={handleChangePassword}
              className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 max-w-md"
            >
              <h2 className="font-display text-xl font-bold text-slate-950">
                Change Password
              </h2>
              <input
                type="password"
                required
                placeholder="Current Password"
                value={passForm.currentPassword}
                onChange={(e) =>
                  setPassForm({ ...passForm, currentPassword: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
              />
              <input
                type="password"
                required
                minLength={6}
                placeholder="New Password"
                value={passForm.newPassword}
                onChange={(e) =>
                  setPassForm({ ...passForm, newPassword: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
              />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Confirm New Password"
                value={passForm.confirmPassword}
                onChange={(e) =>
                  setPassForm({ ...passForm, confirmPassword: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-semibold cursor-pointer"
              >
                Update Password
              </button>
            </form>
          )}
        </main>
      </div>

      {invoiceModalData && (
        <InvoiceModal
          data={invoiceModalData}
          onClose={() => setInvoiceModalData(null)}
        />
      )}
    </div>
  );
}
