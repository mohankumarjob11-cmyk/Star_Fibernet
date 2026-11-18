import { useCallback, useEffect, useState } from 'react';
import {
  Bot,
  CalendarClock,
  Check,
  FileText,
  Layers,
  LayoutDashboard,
  LogOut,
  Package,
  Plus,
  Send,
  Settings,
  ShieldAlert,
  Trash2,
  Users,
  Wifi,
  Wrench,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import {
  Booking,
  InstallationRequest,
  InternetPlan,
  InvoiceRecord,
  Order,
  OrderItem,
  PaymentRecord,
  Product,
  ProductCategory,
  SupportTicket,
  Technician,
  User,
} from '../types.ts';
import { formatINR } from '../utils/invoicePdf.ts';
import { InvoiceModal } from './InvoiceModal.tsx';
import { ResilientImage } from './ResilientImage.tsx';

type AdminTab =
  | 'overview'
  | 'ai'
  | 'products'
  | 'plans'
  | 'orders'
  | 'bookings'
  | 'installations'
  | 'customers'
  | 'tickets'
  | 'settings';

interface OverviewData {
  kpis: {
    totalCustomers: number;
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    pendingPayments: number;
    pendingPrebookings: number;
    installationRequests: number;
    lowStockCount: number;
    openTickets: number;
  };
  charts: {
    monthlyRevenue: { month: string; revenue: number }[];
    ordersByStatus: { status: string; count: number }[];
    bookingStats: { status: string; count: number }[];
    topProductSales: { name: string; revenue: number; units: number }[];
  };
  lowStockProducts: Product[];
  recentOrders: Order[];
  recentCustomers: User[];
}

export function AdminDashboard() {
  const { user, apiFetch, logout, refreshUser, reloadCatalog, showToast, navigate } = useApp();
  const [tab, setTab] = useState<AdminTab>('overview');
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [allPlans, setAllPlans] = useState<InternetPlan[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [allInstalls, setAllInstalls] = useState<InstallationRequest[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Filters
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');
  const [custSearch, setCustSearch] = useState('');

  // Modals / Forms
  const [invoiceData, setInvoiceData] = useState<{
    order: Order;
    items: OrderItem[];
    payment: PaymentRecord | null;
    invoice: InvoiceRecord | null;
  } | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');

  // AI Assistant state
  const [aiMessages, setAiMessages] = useState<{ role: 'admin' | 'assistant'; text: string }[]>([
    {
      role: 'assistant',
      text: 'Star Fibernet Admin AI ready. Ask about live orders, low-stock inventory, monthly revenue, pending installations, or draft customer support replies.',
    },
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Product Form State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProdForm, setShowProdForm] = useState(false);
  const [prodForm, setProdForm] = useState({
    name: '',
    categoryName: 'Wi-Fi Routers',
    brand: '',
    modelNumber: '',
    description: '',
    sellingPrice: '',
    originalPrice: '',
    stockQuantity: '10',
    warranty: '2 Years Manufacturer Warranty',
    imagesText: '/src/assets/images/product_wifi_router_1795011448054.jpg',
    specsText: 'Standard: Wi-Fi 7\nPorts: 2.5G WAN/LAN',
    isFeatured: false,
    isActive: true,
  });

  // Plan Form State
  const [editingPlan, setEditingPlan] = useState<InternetPlan | null>(null);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [planForm, setPlanForm] = useState({
    name: '',
    tagline: '',
    speedMbps: '300',
    monthlyPrice: '799',
    originalPrice: '999',
    dataLimit: 'Unlimited',
    validityDays: '30',
    connectionType: 'Home',
    featuresText: 'Symmetrical speed\nFree ONT installation',
    isPopular: false,
    isActive: true,
  });

  // Technician Form
  const [techForm, setTechForm] = useState({ name: '', phone: '', specialty: '', zone: '' });

  const loadAll = useCallback(async () => {
    if (!user || user.role !== 'admin') return;
    try {
      const [ov, pr, ct, pl, or, bk, ins, cu, tk, st, au] = await Promise.all([
        apiFetch<OverviewData>('/api/admin/overview'),
        apiFetch<{ products: Product[] }>('/api/products?includeInactive=true'),
        apiFetch<{ categories: ProductCategory[] }>('/api/categories'),
        apiFetch<{ plans: InternetPlan[] }>('/api/plans?all=true'),
        apiFetch<{ orders: Order[] }>('/api/admin/orders'),
        apiFetch<{ bookings: Booking[] }>('/api/admin/bookings'),
        apiFetch<{ requests: InstallationRequest[]; technicians: Technician[] }>(
          '/api/admin/installations'
        ),
        apiFetch<{ customers: any[] }>('/api/admin/customers'),
        apiFetch<{ tickets: SupportTicket[] }>('/api/admin/tickets'),
        apiFetch<{ settings: Record<string, string> }>('/api/admin/settings'),
        apiFetch<{ logs: any[] }>('/api/admin/audit-logs'),
      ]);
      setOverview(ov);
      setAllProducts(pr.products || []);
      setCategories(ct.categories || []);
      setAllPlans(pl.plans || []);
      setAllOrders(or.orders || []);
      setAllBookings(bk.bookings || []);
      setAllInstalls(ins.requests || []);
      setTechnicians(ins.technicians || []);
      setCustomers(cu.customers || []);
      setTickets(tk.tickets || []);
      setSettings(st.settings || {});
      setAuditLogs(au.logs || []);
    } catch (err) {
      console.error('Admin dashboard load error:', err);
    }
  }, [user, apiFetch]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <ShieldAlert className="w-10 h-10 text-red-600 mx-auto" />
        <h1 className="font-display text-2xl font-bold text-slate-950">
          Administrator Access Required
        </h1>
        <p className="text-sm text-slate-600">
          Customers cannot access the administrative operations console or AI business assistant.
        </p>
        <button
          onClick={() => navigate(user ? 'dashboard' : 'auth')}
          className="px-6 py-2.5 rounded-lg bg-slate-950 text-white text-sm font-semibold cursor-pointer"
        >
          {user ? 'Go to Customer Dashboard' : 'Sign In as Administrator'}
        </button>
      </div>
    );
  }

  const handleForcePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      await refreshUser();
      setCurrentPassword('');
      setNewPassword('');
      showToast('Admin password updated securely.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Password update failed.', 'error');
    }
  };

  const askAi = async (promptText: string) => {
    if (!promptText.trim() || aiLoading) return;
    const prompt = promptText.trim();
    setAiMessages((prev) => [...prev, { role: 'admin', text: prompt }]);
    setAiInput('');
    setAiLoading(true);
    try {
      const res = await apiFetch<{ reply: string }>('/api/admin/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
      });
      setAiMessages((prev) => [...prev, { role: 'assistant', text: res.reply }]);
    } catch (err: any) {
      setAiMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Error: ${err.message || 'Unable to contact Gemini AI service.'}`,
        },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const openEditProduct = (p?: Product) => {
    if (p) {
      setEditingProduct(p);
      setProdForm({
        name: p.name,
        categoryName: p.categoryName,
        brand: p.brand,
        modelNumber: p.modelNumber,
        description: p.description,
        sellingPrice: String(p.sellingPrice),
        originalPrice: String(p.originalPrice),
        stockQuantity: String(p.stockQuantity),
        warranty: p.warranty,
        imagesText: (p.images || []).join('\n'),
        specsText: Object.entries(p.specs || {})
          .map(([k, v]) => `${k}: ${v}`)
          .join('\n'),
        isFeatured: p.isFeatured,
        isActive: p.isActive,
      });
    } else {
      setEditingProduct(null);
      setProdForm({
        name: '',
        categoryName: categories[0]?.name || 'Wi-Fi Routers',
        brand: '',
        modelNumber: '',
        description: '',
        sellingPrice: '',
        originalPrice: '',
        stockQuantity: '10',
        warranty: '2 Years Manufacturer Warranty',
        imagesText: '/src/assets/images/product_wifi_router_1795011448054.jpg',
        specsText: 'Speed: Gigabit\nWarranty: 2 Years',
        isFeatured: false,
        isActive: true,
      });
    }
    setShowProdForm(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const specs: Record<string, string> = {};
    for (const line of prodForm.specsText.split('\n')) {
      const idx = line.indexOf(':');
      if (idx > 0) {
        specs[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
      }
    }
    const images = prodForm.imagesText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      name: prodForm.name,
      categoryName: prodForm.categoryName,
      brand: prodForm.brand,
      modelNumber: prodForm.modelNumber,
      description: prodForm.description,
      sellingPrice: Number(prodForm.sellingPrice),
      originalPrice: Number(prodForm.originalPrice || prodForm.sellingPrice),
      stockQuantity: Number(prodForm.stockQuantity),
      warranty: prodForm.warranty,
      images,
      specs,
      isFeatured: prodForm.isFeatured,
      isActive: prodForm.isActive,
    };

    try {
      if (editingProduct) {
        await apiFetch(`/api/admin/products/${editingProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        showToast('Product updated.', 'success');
      } else {
        await apiFetch('/api/admin/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showToast('Product created.', 'success');
      }
      setShowProdForm(false);
      await loadAll();
      await reloadCatalog();
    } catch (err: any) {
      showToast(err.message || 'Failed saving product.', 'error');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    await apiFetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    await loadAll();
    await reloadCatalog();
    showToast('Product deleted.', 'info');
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProdForm((prev) => ({
          ...prev,
          imagesText: prev.imagesText
            ? `${prev.imagesText}\n${reader.result}`
            : String(reader.result),
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const openEditPlan = (p?: InternetPlan) => {
    if (p) {
      setEditingPlan(p);
      setPlanForm({
        name: p.name,
        tagline: p.tagline,
        speedMbps: String(p.speedMbps),
        monthlyPrice: String(p.monthlyPrice),
        originalPrice: String(p.originalPrice),
        dataLimit: p.dataLimit,
        validityDays: String(p.validityDays),
        connectionType: p.connectionType,
        featuresText: (p.features || []).join('\n'),
        isPopular: p.isPopular,
        isActive: p.isActive,
      });
    } else {
      setEditingPlan(null);
      setPlanForm({
        name: '',
        tagline: '',
        speedMbps: '500',
        monthlyPrice: '999',
        originalPrice: '1299',
        dataLimit: 'Unlimited',
        validityDays: '30',
        connectionType: 'Home',
        featuresText: 'Symmetrical fiber\n24x7 NOC support',
        isPopular: false,
        isActive: true,
      });
    }
    setShowPlanForm(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...planForm,
      speedMbps: Number(planForm.speedMbps),
      monthlyPrice: Number(planForm.monthlyPrice),
      originalPrice: Number(planForm.originalPrice),
      validityDays: Number(planForm.validityDays),
      features: planForm.featuresText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    };
    try {
      if (editingPlan) {
        await apiFetch(`/api/admin/plans/${editingPlan.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/api/admin/plans', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setShowPlanForm(false);
      await loadAll();
      await reloadCatalog();
      showToast('Internet plan saved.', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeletePlan = async (id: number) => {
    await apiFetch(`/api/admin/plans/${id}`, { method: 'DELETE' });
    await loadAll();
    await reloadCatalog();
    showToast('Plan deleted.', 'info');
  };

  const handleUpdateOrder = async (
    id: number,
    orderStatus: string,
    trackingNumber: string
  ) => {
    await apiFetch(`/api/admin/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ orderStatus, trackingNumber }),
    });
    await loadAll();
    showToast('Order updated.', 'success');
  };

  const openInvoice = async (orderId: number) => {
    const data = await apiFetch<{
      order: Order;
      items: OrderItem[];
      payment: PaymentRecord | null;
      invoice: InvoiceRecord | null;
    }>(`/api/orders/${orderId}/invoice`);
    setInvoiceData(data);
  };

  const handleUpdateBooking = async (id: number, status: string, adminNotes: string) => {
    await apiFetch(`/api/admin/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, adminNotes }),
    });
    await loadAll();
    showToast('Booking updated.', 'success');
  };

  const handleUpdateInstall = async (
    id: number,
    status: string,
    technicianId: string,
    internalNotes: string
  ) => {
    await apiFetch(`/api/admin/installations/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        status,
        technicianId: technicianId ? Number(technicianId) : null,
        internalNotes,
      }),
    });
    await loadAll();
    showToast('Installation request updated.', 'success');
  };

  const handleAddTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch('/api/admin/technicians', {
      method: 'POST',
      body: JSON.stringify(techForm),
    });
    setTechForm({ name: '', phone: '', specialty: '', zone: '' });
    await loadAll();
    showToast('Technician added.', 'success');
  };

  const handleToggleBlockCustomer = async (id: number, currentBlocked: boolean) => {
    await apiFetch(`/api/admin/customers/${id}/block`, {
      method: 'PUT',
      body: JSON.stringify({ isBlocked: !currentBlocked }),
    });
    await loadAll();
    showToast(currentBlocked ? 'Customer unblocked.' : 'Customer blocked.', 'info');
  };

  const handleReplyTicket = async (id: number, status: string, adminReply: string) => {
    await apiFetch(`/api/admin/tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, adminReply }),
    });
    await loadAll();
    showToast('Ticket updated.', 'success');
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
    showToast('Store settings saved.', 'success');
  };

  const sidebarItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview & Analytics', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'ai', label: 'AI Business Assistant', icon: <Bot className="w-4 h-4" /> },
    { id: 'products', label: 'Products & Stock', icon: <Layers className="w-4 h-4" /> },
    { id: 'plans', label: 'Internet Plans', icon: <Wifi className="w-4 h-4" /> },
    { id: 'orders', label: 'Orders & Invoices', icon: <Package className="w-4 h-4" /> },
    { id: 'bookings', label: 'Prebookings', icon: <CalendarClock className="w-4 h-4" /> },
    { id: 'installations', label: 'Installations & Techs', icon: <Wrench className="w-4 h-4" /> },
    { id: 'customers', label: 'Customers', icon: <Users className="w-4 h-4" /> },
    { id: 'tickets', label: 'Support Tickets', icon: <FileText className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings & Audit', icon: <Settings className="w-4 h-4" /> },
  ];

  const filteredOrders = allOrders.filter((o) => {
    if (orderStatusFilter !== 'All' && o.orderStatus !== orderStatusFilter) return false;
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase();
      return (
        o.orderCode.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredCustomers = customers.filter((c) => {
    if (!custSearch.trim()) return true;
    const q = custSearch.toLowerCase();
    return (
      c.fullName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.mobile.toLowerCase().includes(q)
    );
  });

  const maxRev = Math.max(
    1,
    ...(overview?.charts.monthlyRevenue.map((m) => m.revenue) || [1])
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Mandatory Initial Admin Password Rotation Banner */}
      {user.mustChangePassword && (
        <div className="mb-6 bg-amber-50 border border-amber-300 rounded-xl p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-base font-bold text-amber-950">
                Security Requirement: Change Initial Admin Password
              </h2>
              <p className="text-xs text-amber-800 mt-0.5">
                You signed in with the initial development password. Set a strong administrator password now before deployment.
              </p>
            </div>
            <form
              onSubmit={handleForcePasswordChange}
              className="flex flex-wrap items-center gap-2"
            >
              <input
                type="password"
                required
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-xs"
              />
              <input
                type="password"
                required
                minLength={6}
                placeholder="New strong password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-xs"
              />
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-slate-950 text-white text-xs font-semibold cursor-pointer"
              >
                Rotate Password
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar */}
        <aside className="lg:col-span-3 space-y-3">
          <div className="bg-slate-950 text-white rounded-xl p-4">
            <div className="text-xs text-blue-400 font-semibold uppercase tracking-wider">
              Operations Console
            </div>
            <div className="font-display text-base font-bold mt-1 truncate">
              {user.fullName}
            </div>
            <div className="text-xs text-slate-400 truncate">{user.email}</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-2 space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  tab === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.icon}
                <span className="truncate">{item.label}</span>
              </button>
            ))}
            <button
              onClick={logout}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold text-red-700 hover:bg-red-50 cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </aside>

        {/* Main Admin Workspace */}
        <main className="lg:col-span-9 space-y-6">
          {tab === 'overview' && overview && (
            <div className="space-y-6">
              {/* KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Total Revenue (Paid)', value: formatINR(overview.kpis.totalRevenue) },
                  { label: 'Pending Payments', value: formatINR(overview.kpis.pendingPayments) },
                  { label: 'Total Orders', value: overview.kpis.totalOrders },
                  { label: 'Registered Customers', value: overview.kpis.totalCustomers },
                  { label: 'Total Products', value: overview.kpis.totalProducts },
                  { label: 'Low-Stock Alerts', value: overview.kpis.lowStockCount },
                  { label: 'Pending Prebookings', value: overview.kpis.pendingPrebookings },
                  { label: 'Active Installations', value: overview.kpis.installationRequests },
                ].map((k) => (
                  <div
                    key={k.label}
                    className="bg-white border border-slate-200 rounded-xl p-4"
                  >
                    <div className="text-xs text-slate-500">{k.label}</div>
                    <div className="font-display text-xl font-bold text-slate-950 mt-1 tabular-nums">
                      {k.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Monthly Revenue Chart */}
                <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6">
                  <h3 className="font-display text-base font-bold text-slate-950 mb-4">
                    Monthly Revenue Trend (INR)
                  </h3>
                  <div className="h-52 flex items-end gap-4 pt-6">
                    {overview.charts.monthlyRevenue.map((m) => {
                      const pct = Math.max(8, Math.round((m.revenue / maxRev) * 100));
                      return (
                        <div
                          key={m.month}
                          className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
                        >
                          <span className="text-[11px] font-mono text-slate-600 tabular-nums">
                            ₹{Math.round(m.revenue / 1000)}k
                          </span>
                          <div
                            style={{ height: `${pct}%` }}
                            className="w-full max-w-[42px] bg-blue-600 rounded-t-md transition-all"
                            title={`${m.month}: ${formatINR(m.revenue)}`}
                          />
                          <span className="text-xs font-medium text-slate-600">
                            {m.month}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Orders & Booking Breakdown */}
                <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
                  <div>
                    <h3 className="font-display text-base font-bold text-slate-950 mb-3">
                      Orders by Status
                    </h3>
                    <div className="space-y-2">
                      {overview.charts.ordersByStatus.map((s) => (
                        <div key={s.status} className="flex items-center justify-between text-xs">
                          <span className="text-slate-700">{s.status}</span>
                          <span className="font-mono font-semibold text-slate-950 tabular-nums">
                            {s.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-4">
                    <h3 className="font-display text-base font-bold text-slate-950 mb-3">
                      Booking Statistics
                    </h3>
                    <div className="space-y-2">
                      {overview.charts.bookingStats.map((b) => (
                        <div key={b.status} className="flex items-center justify-between text-xs">
                          <span className="text-slate-700">{b.status}</span>
                          <span className="font-mono font-semibold text-blue-700 tabular-nums">
                            {b.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Sales + Low Stock */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <h3 className="font-display text-base font-bold text-slate-950 mb-4">
                    Top Product Sales
                  </h3>
                  <div className="space-y-3">
                    {overview.charts.topProductSales.map((ps) => (
                      <div key={ps.name} className="flex justify-between text-xs">
                        <span className="text-slate-800 truncate pr-4">{ps.name}</span>
                        <span className="font-mono font-semibold tabular-nums shrink-0">
                          {ps.units} units · {formatINR(ps.revenue)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <h3 className="font-display text-base font-bold text-slate-950 mb-4">
                    Low-Stock Inventory Alerts (&lt; 12 units)
                  </h3>
                  <div className="space-y-2.5">
                    {overview.lowStockProducts.map((lp) => (
                      <div key={lp.id} className="flex justify-between text-xs">
                        <span className="text-slate-800 truncate pr-4">{lp.name}</span>
                        <span className="font-mono font-bold text-red-700 tabular-nums shrink-0">
                          {lp.stockQuantity} left
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ADMIN-ONLY AI ASSISTANT */}
          {tab === 'ai' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col h-[640px]">
              <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-base font-bold">
                    Star Fibernet Admin AI Assistant
                  </h2>
                  <p className="text-xs text-slate-400">
                    Powered by Gemini · Live PostgreSQL Business Context · Admin Only
                  </p>
                </div>
                <Bot className="w-5 h-5 text-blue-400" />
              </div>

              {/* Quick Insights Prompts */}
              <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-2">
                {[
                  "Show me today's orders.",
                  'Which products are running low?',
                  "Generate this month's sales summary.",
                  'How many installation requests are pending?',
                  'Which product generated the highest revenue?',
                  'Draft polite replies for open support tickets.',
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => askAi(q)}
                    disabled={aiLoading}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-600 text-xs font-medium text-slate-700 cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {aiMessages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex ${m.role === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
                        m.role === 'admin'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-900 border border-slate-200'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
                {aiLoading && (
                  <div className="text-xs text-slate-500">
                    Analyzing live business metrics...
                  </div>
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  askAi(aiInput);
                }}
                className="p-4 border-t border-slate-200 flex gap-3"
              >
                <input
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Ask for sales insights, inventory restock suggestions, or support reply drafts..."
                  className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-600"
                />
                <button
                  type="submit"
                  disabled={aiLoading || !aiInput.trim()}
                  className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" /> Ask AI
                </button>
              </form>
            </div>
          )}

          {/* PRODUCT & INVENTORY MANAGEMENT */}
          {tab === 'products' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold text-slate-950">
                  Product & Inventory Management
                </h2>
                <button
                  onClick={() => openEditProduct()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Product
                </button>
              </div>

              {showProdForm && (
                <form
                  onSubmit={handleSaveProduct}
                  className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-display text-base font-bold text-slate-950">
                      {editingProduct ? 'Edit Product' : 'New Networking Product'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowProdForm(false)}
                      className="text-xs text-slate-500 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      required
                      placeholder="Product Name"
                      value={prodForm.name}
                      onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                      className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
                    />
                    <select
                      value={prodForm.categoryName}
                      onChange={(e) =>
                        setProdForm({ ...prodForm, categoryName: e.target.value })
                      }
                      className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <input
                      required
                      placeholder="Brand"
                      value={prodForm.brand}
                      onChange={(e) => setProdForm({ ...prodForm, brand: e.target.value })}
                      className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
                    />
                    <input
                      required
                      placeholder="Model Number"
                      value={prodForm.modelNumber}
                      onChange={(e) =>
                        setProdForm({ ...prodForm, modelNumber: e.target.value })
                      }
                      className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
                    />
                    <input
                      required
                      type="number"
                      step="0.01"
                      placeholder="Selling Price (INR)"
                      value={prodForm.sellingPrice}
                      onChange={(e) =>
                        setProdForm({ ...prodForm, sellingPrice: e.target.value })
                      }
                      className="px-3 py-2 rounded-lg border border-slate-300 text-sm tabular-nums"
                    />
                    <input
                      required
                      type="number"
                      step="0.01"
                      placeholder="Original MRP (INR)"
                      value={prodForm.originalPrice}
                      onChange={(e) =>
                        setProdForm({ ...prodForm, originalPrice: e.target.value })
                      }
                      className="px-3 py-2 rounded-lg border border-slate-300 text-sm tabular-nums"
                    />
                    <input
                      required
                      type="number"
                      placeholder="Stock Quantity"
                      value={prodForm.stockQuantity}
                      onChange={(e) =>
                        setProdForm({ ...prodForm, stockQuantity: e.target.value })
                      }
                      className="px-3 py-2 rounded-lg border border-slate-300 text-sm tabular-nums"
                    />
                    <input
                      placeholder="Warranty"
                      value={prodForm.warranty}
                      onChange={(e) =>
                        setProdForm({ ...prodForm, warranty: e.target.value })
                      }
                      className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
                    />
                  </div>

                  <textarea
                    rows={2}
                    placeholder="Product Description"
                    value={prodForm.description}
                    onChange={(e) =>
                      setProdForm({ ...prodForm, description: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Image URLs (one per line) or Upload
                      </label>
                      <textarea
                        rows={3}
                        value={prodForm.imagesText}
                        onChange={(e) =>
                          setProdForm({ ...prodForm, imagesText: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        className="mt-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Technical Specs (Key: Value per line)
                      </label>
                      <textarea
                        rows={3}
                        value={prodForm.specsText}
                        onChange={(e) =>
                          setProdForm({ ...prodForm, specsText: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-xs font-semibold text-slate-700">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prodForm.isFeatured}
                        onChange={(e) =>
                          setProdForm({ ...prodForm, isFeatured: e.target.checked })
                        }
                      />
                      Featured Product
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prodForm.isActive}
                        onChange={(e) =>
                          setProdForm({ ...prodForm, isActive: e.target.checked })
                        }
                      />
                      Active in Store
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                  >
                    Save Product
                  </button>
                </form>
              )}

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="py-3 px-4">Product</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4 text-right">Price</th>
                        <th className="py-3 px-4 text-right">Stock</th>
                        <th className="py-3 px-4">State</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allProducts.map((p) => (
                        <tr key={p.id}>
                          <td className="py-3 px-4 flex items-center gap-3">
                            <div className="w-10 h-8 rounded overflow-hidden bg-slate-100 shrink-0">
                              <ResilientImage
                                src={p.images[0]}
                                alt={p.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-950">{p.name}</div>
                              <div className="text-xs font-mono text-slate-500">
                                {p.modelNumber}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-600">
                            {p.categoryName}
                          </td>
                          <td className="py-3 px-4 text-right tabular-nums font-medium">
                            {formatINR(p.sellingPrice)}
                          </td>
                          <td
                            className={`py-3 px-4 text-right tabular-nums font-semibold ${
                              p.stockQuantity < 12 ? 'text-red-700' : 'text-slate-900'
                            }`}
                          >
                            {p.stockQuantity}
                          </td>
                          <td className="py-3 px-4 text-xs">
                            {p.isActive ? 'Active' : 'Inactive'}
                          </td>
                          <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => openEditProduct(p)}
                              className="text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="text-xs font-semibold text-red-600 hover:underline cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* INTERNET PLANS MANAGEMENT */}
          {tab === 'plans' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold text-slate-950">
                  Internet Plan Management
                </h2>
                <button
                  onClick={() => openEditPlan()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Plan
                </button>
              </div>

              {showPlanForm && (
                <form
                  onSubmit={handleSavePlan}
                  className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <input
                      required
                      placeholder="Plan Name"
                      value={planForm.name}
                      onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                      className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
                    />
                    <input
                      required
                      type="number"
                      placeholder="Speed (Mbps)"
                      value={planForm.speedMbps}
                      onChange={(e) =>
                        setPlanForm({ ...planForm, speedMbps: e.target.value })
                      }
                      className="px-3 py-2 rounded-lg border border-slate-300 text-sm tabular-nums"
                    />
                    <select
                      value={planForm.connectionType}
                      onChange={(e) =>
                        setPlanForm({ ...planForm, connectionType: e.target.value })
                      }
                      className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                    >
                      <option value="Home">Home</option>
                      <option value="Business">Business</option>
                    </select>
                    <input
                      required
                      type="number"
                      placeholder="Monthly Price (INR)"
                      value={planForm.monthlyPrice}
                      onChange={(e) =>
                        setPlanForm({ ...planForm, monthlyPrice: e.target.value })
                      }
                      className="px-3 py-2 rounded-lg border border-slate-300 text-sm tabular-nums"
                    />
                    <input
                      required
                      placeholder="Data Limit"
                      value={planForm.dataLimit}
                      onChange={(e) =>
                        setPlanForm({ ...planForm, dataLimit: e.target.value })
                      }
                      className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
                    />
                    <input
                      required
                      type="number"
                      placeholder="Validity (Days)"
                      value={planForm.validityDays}
                      onChange={(e) =>
                        setPlanForm({ ...planForm, validityDays: e.target.value })
                      }
                      className="px-3 py-2 rounded-lg border border-slate-300 text-sm tabular-nums"
                    />
                  </div>
                  <input
                    placeholder="Tagline"
                    value={planForm.tagline}
                    onChange={(e) => setPlanForm({ ...planForm, tagline: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                  <textarea
                    rows={3}
                    placeholder="Features (one per line)"
                    value={planForm.featuresText}
                    onChange={(e) =>
                      setPlanForm({ ...planForm, featuresText: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                  <div className="flex items-center gap-6 text-xs font-semibold">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={planForm.isPopular}
                        onChange={(e) =>
                          setPlanForm({ ...planForm, isPopular: e.target.checked })
                        }
                      />
                      Highlight as Popular
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={planForm.isActive}
                        onChange={(e) =>
                          setPlanForm({ ...planForm, isActive: e.target.checked })
                        }
                      />
                      Active
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                    >
                      Save Plan
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPlanForm(false)}
                      className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allPlans.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white border border-slate-200 rounded-xl p-5 flex justify-between gap-4"
                  >
                    <div>
                      <div className="text-xs text-slate-500">
                        {p.connectionType} · {p.isActive ? 'Active' : 'Disabled'}
                      </div>
                      <h3 className="font-display text-base font-bold text-slate-950 mt-0.5">
                        {p.name} ({p.speedMbps} Mbps)
                      </h3>
                      <div className="text-sm font-semibold text-blue-700 mt-1 tabular-nums">
                        {formatINR(p.monthlyPrice)} / {p.validityDays}d · {p.dataLimit}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 text-xs">
                      <button
                        onClick={() => openEditPlan(p)}
                        className="font-semibold text-blue-700 hover:underline cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePlan(p.id)}
                        className="font-semibold text-red-600 hover:underline cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ORDERS & INVOICES */}
          {tab === 'orders' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="font-display text-xl font-bold text-slate-950">
                  Order & Invoice Management
                </h2>
                <div className="flex gap-2">
                  <input
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search Order ID or customer..."
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                  />
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                  >
                    {[
                      'All',
                      'Pending',
                      'Confirmed',
                      'Processing',
                      'Shipped',
                      'Out for Delivery',
                      'Delivered',
                      'Cancelled',
                      'Refunded',
                    ].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {filteredOrders.map((o) => (
                  <OrderRowAdmin
                    key={o.id}
                    order={o}
                    onUpdate={handleUpdateOrder}
                    onOpenInvoice={() => openInvoice(o.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* PREBOOKINGS */}
          {tab === 'bookings' && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold text-slate-950">
                Fiber Prebookings
              </h2>
              <div className="space-y-3">
                {allBookings.map((b) => (
                  <BookingRowAdmin
                    key={b.id}
                    booking={b}
                    onUpdate={handleUpdateBooking}
                  />
                ))}
              </div>
            </div>
          )}

          {/* INSTALLATIONS & TECHNICIANS */}
          {tab === 'installations' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h2 className="font-display text-xl font-bold text-slate-950">
                  Installation & Service Requests
                </h2>
                {allInstalls.map((r) => (
                  <InstallRowAdmin
                    key={r.id}
                    req={r}
                    technicians={technicians}
                    onUpdate={handleUpdateInstall}
                  />
                ))}
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <h3 className="font-display text-base font-bold text-slate-950">
                  Field Technicians
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {technicians.map((t) => (
                    <div key={t.id} className="p-3 rounded-lg border border-slate-200">
                      <div className="font-bold text-slate-950">{t.name}</div>
                      <div className="text-slate-600 mt-0.5">
                        {t.specialty} · {t.zone}
                      </div>
                      <div className="text-slate-500 mt-0.5 tabular-nums">{t.phone}</div>
                    </div>
                  ))}
                </div>
                <form
                  onSubmit={handleAddTechnician}
                  className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-100"
                >
                  <input
                    required
                    placeholder="Name"
                    value={techForm.name}
                    onChange={(e) => setTechForm({ ...techForm, name: e.target.value })}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                  <input
                    required
                    placeholder="Phone"
                    value={techForm.phone}
                    onChange={(e) => setTechForm({ ...techForm, phone: e.target.value })}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                  <input
                    required
                    placeholder="Specialty"
                    value={techForm.specialty}
                    onChange={(e) =>
                      setTechForm({ ...techForm, specialty: e.target.value })
                    }
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                  <input
                    required
                    placeholder="Zone"
                    value={techForm.zone}
                    onChange={(e) => setTechForm({ ...techForm, zone: e.target.value })}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-slate-950 text-white text-xs font-semibold cursor-pointer"
                  >
                    Add Tech
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* CUSTOMERS */}
          {tab === 'customers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-display text-xl font-bold text-slate-950">
                  Customer Directory
                </h2>
                <input
                  value={custSearch}
                  onChange={(e) => setCustSearch(e.target.value)}
                  placeholder="Search name, email, phone..."
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                />
              </div>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Mobile</th>
                      <th className="py-3 px-4 text-right">Orders</th>
                      <th className="py-3 px-4 text-right">Bookings</th>
                      <th className="py-3 px-4 text-right">Account</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCustomers.map((c) => (
                      <tr key={c.id}>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-950">{c.fullName}</div>
                          <div className="text-xs text-slate-500">{c.email}</div>
                        </td>
                        <td className="py-3 px-4 tabular-nums text-xs">{c.mobile || '—'}</td>
                        <td className="py-3 px-4 text-right tabular-nums">{c.ordersCount}</td>
                        <td className="py-3 px-4 text-right tabular-nums">{c.bookingsCount}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleToggleBlockCustomer(c.id, c.isBlocked)}
                            className={`text-xs font-semibold cursor-pointer ${
                              c.isBlocked ? 'text-emerald-700' : 'text-red-600'
                            }`}
                          >
                            {c.isBlocked ? 'Unblock' : 'Block'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUPPORT TICKETS */}
          {tab === 'tickets' && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold text-slate-950">
                Customer Support Tickets
              </h2>
              {tickets.map((t) => (
                <TicketRowAdmin
                  key={t.id}
                  ticket={t}
                  onUpdate={handleReplyTicket}
                />
              ))}
            </div>
          )}

          {/* SETTINGS & AUDIT LOGS */}
          {tab === 'settings' && (
            <div className="space-y-6">
              <form
                onSubmit={handleSaveSettings}
                className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
              >
                <h2 className="font-display text-xl font-bold text-slate-950">
                  Store & Payment Settings
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Cash on Delivery (COD)
                    </label>
                    <select
                      value={settings.cod_enabled || 'true'}
                      onChange={(e) =>
                        setSettings({ ...settings, cod_enabled: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                    >
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Flat Shipping Fee (INR)
                    </label>
                    <input
                      type="number"
                      value={settings.shipping_flat || '99'}
                      onChange={(e) =>
                        setSettings({ ...settings, shipping_flat: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Free Shipping Threshold (INR)
                    </label>
                    <input
                      type="number"
                      value={settings.free_shipping_threshold || '2500'}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          free_shipping_threshold: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm tabular-nums"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                >
                  Save Settings
                </button>
              </form>

              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
                <h3 className="font-display text-base font-bold text-slate-950">
                  Security & Audit Logs
                </h3>
                <div className="divide-y divide-slate-100 text-xs">
                  {auditLogs.slice(0, 15).map((l) => (
                    <div key={l.id} className="py-2 flex justify-between gap-4">
                      <span>
                        <span className="font-mono font-semibold">{l.action}</span> ·{' '}
                        {l.actorEmail} ({l.targetType} #{l.targetId}) {l.details}
                      </span>
                      <span className="text-slate-400 tabular-nums shrink-0">
                        {new Date(l.createdAt).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {invoiceData && (
        <InvoiceModal data={invoiceData} onClose={() => setInvoiceData(null)} />
      )}
    </div>
  );
}

function OrderRowAdmin({
  order,
  onUpdate,
  onOpenInvoice,
}: {
  order: Order;
  onUpdate: (id: number, status: string, tracking: string) => Promise<void>;
  onOpenInvoice: () => void;
}) {
  const [status, setStatus] = useState(order.orderStatus);
  const [tracking, setTracking] = useState(order.trackingNumber || '');

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <div className="font-mono text-sm font-bold text-slate-950 tabular-nums">
            {order.orderCode} · {order.customerName}
          </div>
          <div className="text-xs text-slate-500">
            {order.customerEmail} · {order.customerPhone} · {order.paymentMethod} (
            {order.paymentStatus})
          </div>
          {order.cancellationRequested && (
            <div className="text-xs font-semibold text-red-700 mt-1">
              Customer requested cancellation
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="font-display text-base font-bold text-slate-950 tabular-nums">
            {formatINR(order.totalAmount)}
          </div>
          <button
            onClick={onOpenInvoice}
            className="text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
          >
            Print / PDF Invoice
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
        >
          {[
            'Pending',
            'Confirmed',
            'Processing',
            'Shipped',
            'Out for Delivery',
            'Delivered',
            'Cancelled',
            'Refunded',
          ].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          placeholder="Tracking Number"
          className="flex-1 min-w-[160px] px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
        />
        <button
          onClick={() => onUpdate(order.id, status, tracking)}
          className="px-4 py-1.5 rounded-lg bg-slate-950 text-white text-xs font-semibold hover:bg-blue-700 cursor-pointer"
        >
          Save Order
        </button>
      </div>
    </div>
  );
}

function BookingRowAdmin({
  booking,
  onUpdate,
}: {
  booking: Booking;
  onUpdate: (id: number, status: string, notes: string) => Promise<void>;
}) {
  const [status, setStatus] = useState(booking.status);
  const [notes, setNotes] = useState(booking.adminNotes || '');

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
      <div className="flex flex-wrap justify-between gap-2">
        <div>
          <div className="font-mono text-sm font-bold text-slate-950 tabular-nums">
            {booking.bookingCode} · {booking.fullName} ({booking.connectionType})
          </div>
          <div className="text-xs text-slate-600 mt-0.5">
            {booking.planName} · {booking.address}, {booking.city} ({booking.pinCode}) ·{' '}
            {booking.mobile}
          </div>
          {booking.cancellationRequested && (
            <div className="text-xs font-semibold text-red-700 mt-1">
              Cancellation requested by customer
            </div>
          )}
        </div>
        <div className="text-xs font-mono text-slate-500 tabular-nums">
          Pref: {booking.preferredDate}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
        >
          {[
            'Pending',
            'Under Review',
            'Approved',
            'Rejected',
            'Scheduled',
            'Completed',
            'Cancelled',
          ].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Admin NOC notes..."
          className="flex-1 min-w-[180px] px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
        />
        <button
          onClick={() => onUpdate(booking.id, status, notes)}
          className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold cursor-pointer"
        >
          Update
        </button>
      </div>
    </div>
  );
}

function InstallRowAdmin({
  req,
  technicians,
  onUpdate,
}: {
  req: InstallationRequest;
  technicians: Technician[];
  onUpdate: (
    id: number,
    status: string,
    technicianId: string,
    notes: string
  ) => Promise<void>;
}) {
  const [status, setStatus] = useState(req.status);
  const [techId, setTechId] = useState(req.technicianId ? String(req.technicianId) : '');
  const [notes, setNotes] = useState(req.internalNotes || '');

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
      <div>
        <div className="font-mono text-sm font-bold text-slate-950 tabular-nums">
          {req.requestCode} · {req.requestType}
        </div>
        <div className="text-xs text-slate-600 mt-0.5">
          {req.customerName} ({req.customerPhone}) · {req.serviceAddress}
        </div>
        <div className="text-xs text-slate-500 mt-0.5">
          {req.preferredDate} · {req.timeSlot} — {req.description}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
        >
          {['Pending', 'Assigned', 'Scheduled', 'In Progress', 'Completed', 'Cancelled'].map(
            (s) => (
              <option key={s} value={s}>
                {s}
              </option>
            )
          )}
        </select>
        <select
          value={techId}
          onChange={(e) => setTechId(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
        >
          <option value="">Assign Technician...</option>
          {technicians.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.zone})
            </option>
          ))}
        </select>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Internal dispatch notes"
          className="flex-1 min-w-[160px] px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
        />
        <button
          onClick={() => onUpdate(req.id, status, techId, notes)}
          className="px-4 py-1.5 rounded-lg bg-slate-950 text-white text-xs font-semibold cursor-pointer"
        >
          Save Dispatch
        </button>
      </div>
    </div>
  );
}

function TicketRowAdmin({
  ticket,
  onUpdate,
}: {
  ticket: SupportTicket;
  onUpdate: (id: number, status: string, reply: string) => Promise<void>;
}) {
  const [status, setStatus] = useState(ticket.status);
  const [reply, setReply] = useState(ticket.adminReply || '');

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
      <div className="flex justify-between">
        <div>
          <div className="font-mono text-sm font-bold text-slate-950">
            {ticket.ticketCode} · {ticket.subject}
          </div>
          <div className="text-xs text-slate-500">
            {ticket.customerName} ({ticket.customerEmail}) · {ticket.category}
          </div>
        </div>
        <span className="text-xs font-semibold text-blue-700">{ticket.priority}</span>
      </div>
      <p className="text-xs text-slate-700">{ticket.description}</p>
      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
        >
          {['Open', 'In Progress', 'Resolved', 'Closed'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Write official support reply..."
          className="flex-1 min-w-[200px] px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
        />
        <button
          onClick={() => onUpdate(ticket.id, status, reply)}
          className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold cursor-pointer"
        >
          <Check className="w-3.5 h-3.5 inline mr-1" /> Update Ticket
        </button>
      </div>
    </div>
  );
}
