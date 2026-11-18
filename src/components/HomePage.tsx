import { useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Wrench,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { formatINR } from '../utils/invoicePdf.ts';
import { ResilientImage } from './ResilientImage.tsx';

export function HomePage() {
  const { plans, products, navigate, addToCart } = useApp();
  const [pinInput, setPinInput] = useState('');
  const [pinChecking, setPinChecking] = useState(false);
  const [pinResult, setPinResult] = useState<{
    available: boolean;
    message: string;
  } | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const featuredProducts = products.filter((p) => p.isFeatured).slice(0, 4);

  const handlePinCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;
    setPinChecking(true);
    try {
      const res = await fetch(
        `/api/service-areas/check?pin=${encodeURIComponent(pinInput.trim())}`
      );
      const data = await res.json();
      if (!res.ok) {
        setPinResult({ available: false, message: data.error || 'Invalid PIN code.' });
      } else {
        setPinResult({ available: Boolean(data.available), message: data.message });
      }
    } catch {
      setPinResult({ available: false, message: 'Unable to check PIN availability right now.' });
    } finally {
      setPinChecking(false);
    }
  };

  const faqs = [
    {
      q: 'How quickly is a new Star Fibernet connection installed after prebooking?',
      a: 'Once feasibility is confirmed for your PIN code, our certified FTTH field team completes optical splicing, ONT setup, and speed certification within 12 to 24 hours.',
    },
    {
      q: 'Do you provide both home and enterprise leased fiber connections?',
      a: 'Yes. Residential plans range from 100 Mbps to 600 Mbps symmetrical fiber, while our 1 Gbps Business Plan includes a 99.95% uptime SLA, static IPv4 allocation, and dedicated NOC support.',
    },
    {
      q: 'Are routers and ONT devices sold in the store pre-tested for Star Fibernet?',
      a: 'Every router, XGS-PON/GPON ONT, SFP+ transceiver, and armored patch cord in our store is lab-verified for full compatibility with our optical distribution network.',
    },
    {
      q: 'Can I request a technician just for router configuration or internal LAN cabling?',
      a: 'Yes. Use our Installation & Service Request portal to book router replacements, Cat 6A cabling, mesh calibration, or optical troubleshooting even for existing setups.',
    },
  ];

  return (
    <div className="bg-slate-50">
      {/* 1. Hero Section */}
      <section className="bg-slate-950 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
            <p className="text-xs font-semibold tracking-wider uppercase text-blue-400">
              Symmetrical Optical Fiber · Home & Enterprise
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.1] [text-wrap:balance]">
              Experience the Power of Unlimited Connectivity.
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed">
              High-speed fiber internet for your home and business — backed by certified 24-hour installation and enterprise networking hardware.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => navigate('prebook')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                Book a Connection
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('plans')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-slate-700 hover:border-slate-500 text-slate-100 text-sm font-semibold transition-colors cursor-pointer"
              >
                Explore Plans
              </button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="h-full min-h-[280px] lg:min-h-[380px] rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
              <ResilientImage
                src="/src/assets/images/hero_fiber_network_1795011448000.jpg"
                alt="Star Fibernet optical fiber network operations hub"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Full-Width Availability Checker & Core Metric Strip */}
        <div className="border-t border-slate-800 bg-slate-900/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <form
              onSubmit={handlePinCheck}
              className="lg:col-span-7 flex flex-col sm:flex-row gap-3"
            >
              <div className="relative flex-1">
                <MapPin className="w-4 h-4 text-blue-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Enter 6-digit PIN code (e.g. 560038, 500081, 400001)"
                  maxLength={10}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 tabular-nums"
                />
              </div>
              <button
                type="submit"
                disabled={pinChecking}
                className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer disabled:opacity-60"
              >
                {pinChecking ? 'Checking...' : 'Check Fiber Availability'}
              </button>
            </form>

            <div className="lg:col-span-5 grid grid-cols-3 gap-4 text-left sm:text-right">
              <div>
                <div className="font-display text-lg font-bold text-white tabular-nums">1 Gbps</div>
                <div className="text-xs text-slate-400">Symmetrical Speed</div>
              </div>
              <div>
                <div className="font-display text-lg font-bold text-white tabular-nums">99.95%</div>
                <div className="text-xs text-slate-400">Uptime SLA</div>
              </div>
              <div>
                <div className="font-display text-lg font-bold text-white tabular-nums">24h</div>
                <div className="text-xs text-slate-400">FTTH Turn-up</div>
              </div>
            </div>
          </div>

          {pinResult && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-5">
              <div
                className={`px-4 py-3 rounded-lg border text-sm flex flex-wrap items-center justify-between gap-3 ${
                  pinResult.available
                    ? 'bg-blue-950/60 border-blue-700 text-blue-100'
                    : 'bg-slate-950 border-slate-700 text-slate-300'
                }`}
              >
                <span>{pinResult.message}</span>
                <button
                  onClick={() => navigate('prebook')}
                  className="text-xs font-semibold text-blue-300 hover:text-white underline cursor-pointer"
                >
                  Proceed to Prebooking
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 2. Internet Plans Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 mb-1">
              Transparent Fiber Tariffs
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-950">
              High-Speed Internet Plans
            </h2>
          </div>
          <button
            onClick={() => navigate('plans')}
            className="text-sm font-semibold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1 cursor-pointer"
          >
            Compare All Plans <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-xl p-6 flex flex-col justify-between transition-shadow hover:shadow-md ${
                plan.isPopular
                  ? 'border-2 border-blue-600'
                  : 'border border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-2">
                  <span>{plan.connectionType} Fiber</span>
                  {plan.isPopular && (
                    <span className="font-semibold text-blue-700">Most Popular</span>
                  )}
                </div>
                <h3 className="font-display text-lg font-bold text-slate-950">
                  {plan.name}
                </h3>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-display text-3xl font-extrabold text-slate-950 tabular-nums">
                    {formatINR(plan.monthlyPrice)}
                  </span>
                  <span className="text-xs text-slate-500">/ {plan.validityDays} days</span>
                </div>
                <div className="mt-2 text-sm font-semibold text-blue-700 tabular-nums">
                  {plan.speedMbps} Mbps · {plan.dataLimit}
                </div>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  {plan.tagline}
                </p>

                <ul className="mt-5 space-y-2.5 border-t border-slate-100 pt-4">
                  {plan.features.map((feat, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-xs text-slate-700"
                    >
                      <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => navigate('prebook', { planId: plan.id })}
                className={`mt-6 w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                  plan.isPopular
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-slate-950 hover:bg-blue-700 text-white'
                }`}
              >
                Prebook Plan
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Why Choose Star Fibernet + How Installation Works */}
      <section className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-6 space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 mb-1">
                Built for Reliability
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-950">
                Why Choose Star Fibernet
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50">
                <Zap className="w-5 h-5 text-blue-600 mb-3" />
                <h3 className="font-display font-bold text-slate-950 text-base">
                  Symmetrical Fiber Speeds
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Equal upload and download throughput up to 1 Gbps over end-to-end single-mode glass fiber.
                </p>
              </div>
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50">
                <ShieldCheck className="w-5 h-5 text-blue-600 mb-3" />
                <h3 className="font-display font-bold text-slate-950 text-base">
                  Redundant Ring Backbone
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Dual-homed upstream peering keeps latency under 4ms even during peak evening load.
                </p>
              </div>
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50">
                <Wrench className="w-5 h-5 text-blue-600 mb-3" />
                <h3 className="font-display font-bold text-slate-950 text-base">
                  Certified Field Engineers
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Clean concealed routing, wall rosette termination, and Wi-Fi signal heat-mapping on every visit.
                </p>
              </div>
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50">
                <ShoppingBag className="w-5 h-5 text-blue-600 mb-3" />
                <h3 className="font-display font-bold text-slate-950 text-base">
                  Direct Hardware Store
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Buy ISP-tested Wi-Fi 7 routers, ONTs, PoE switches, and armored patch cords with GST invoices.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 mb-1">
                From Prebooking to Live Signal
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-950">
                How Installation Works
              </h2>
            </div>

            <div className="space-y-4">
              {[
                {
                  step: '01. Verify Coverage & Prebook',
                  desc: 'Select your home or business plan, choose a preferred installation date, and receive an instant booking reference ID.',
                },
                {
                  step: '02. Optical Feasibility & Technician Dispatch',
                  desc: 'Our NOC team reserves your optical splitter port and assigns a certified fiber engineer to your zone.',
                },
                {
                  step: '03. Precision Splicing & Speed Certification',
                  desc: 'We terminate the SC/APC wall rosette, configure your ONT/Wi-Fi router, and verify full-rate throughput before sign-off.',
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="p-5 rounded-xl border border-slate-200 bg-white"
                >
                  <h3 className="font-display text-base font-bold text-slate-950">
                    {item.step}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Featured Networking Devices */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 mb-1">
              ISP-Verified Hardware
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-950">
              Featured Networking Devices
            </h2>
          </div>
          <button
            onClick={() => navigate('shop')}
            className="text-sm font-semibold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1 cursor-pointer"
          >
            Browse All 14 Categories <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div>
                <div
                  onClick={() => navigate('shop', { productSlug: product.slug })}
                  className="aspect-[4/3] bg-slate-100 overflow-hidden cursor-pointer"
                >
                  <ResilientImage
                    src={product.images[0]}
                    alt={product.name}
                    fallbackLabel={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5">
                  <div className="text-xs text-slate-500 mb-1">
                    {product.categoryName} · {product.brand}
                  </div>
                  <h3
                    onClick={() => navigate('shop', { productSlug: product.slug })}
                    className="font-display text-sm font-bold text-slate-950 line-clamp-2 cursor-pointer hover:text-blue-700"
                  >
                    {product.name}
                  </h3>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-display text-base font-bold text-slate-950 tabular-nums">
                      {formatINR(product.sellingPrice)}
                    </span>
                    {Number(product.originalPrice) > Number(product.sellingPrice) && (
                      <span className="text-xs text-slate-400 line-through tabular-nums">
                        {formatINR(product.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="px-5 pb-5">
                <button
                  onClick={() => addToCart(product)}
                  disabled={product.stockQuantity <= 0}
                  className="w-full py-2 px-4 rounded-lg bg-slate-950 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {product.stockQuantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Customer Testimonials & FAQ */}
      <section className="bg-white border-t border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-6 space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 mb-1">
                Verified Deployments
              </p>
              <h2 className="font-display text-2xl font-bold text-slate-950">
                Customer Testimonials
              </h2>
            </div>
            <div className="space-y-4">
              {[
                {
                  quote:
                    'Switched our 24-seat architectural studio to Star Fibernet 1 Gbps Business DIA. Cloud BIM syncs dropped from 42 minutes to under 6 minutes with zero packet loss across six months.',
                  name: 'Raghavendra Rao',
                  role: 'Principal Architect, Studio Axis Bengaluru',
                },
                {
                  quote:
                    'Prebooked the 300 Mbps Standard Plan on Thursday evening and Arun completed our optical splicing plus StarWave Wi-Fi 7 mesh setup by Friday noon.',
                  name: 'Sneha Kulkarni',
                  role: 'Staff Software Engineer, Indiranagar',
                },
              ].map((t) => (
                <div
                  key={t.name}
                  className="p-6 rounded-xl border border-slate-200 bg-slate-50/50"
                >
                  <p className="text-sm text-slate-700 leading-relaxed">
                    "{t.quote}"
                  </p>
                  <div className="mt-4 text-xs text-slate-500">
                    <span className="font-semibold text-slate-900">{t.name}</span> · {t.role}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 mb-1">
                Common Questions
              </p>
              <h2 className="font-display text-2xl font-bold text-slate-950">
                Frequently Asked Questions
              </h2>
            </div>
            <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl bg-white">
              {faqs.map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={idx} className="p-4">
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between gap-4 text-left text-sm font-semibold text-slate-950 cursor-pointer"
                    >
                      <span>{item.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
                        {item.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
