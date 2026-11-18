import { useState } from 'react';
import { Check } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { formatINR } from '../utils/invoicePdf.ts';

export function PlansPage() {
  const { plans, navigate } = useApp();
  const [filter, setFilter] = useState<'All' | 'Home' | 'Business'>('All');

  const filtered = plans.filter((p) =>
    filter === 'All' ? true : p.connectionType === filter
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 mb-1">
            Optical Broadband Tariffs
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-950">
            Fiber Internet Plans
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl">
            Symmetrical upload and download speeds, zero hidden throttling, and transparent 30-day billing across home and enterprise connections.
          </p>
        </div>

        <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg self-start">
          {(['All', 'Home', 'Business'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                filter === tab
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              {tab} Plans
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filtered.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-xl p-6 flex flex-col justify-between ${
              plan.isPopular
                ? 'border-2 border-blue-600 shadow-sm'
                : 'border border-slate-200'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span>{plan.connectionType}</span>
                {plan.isPopular && (
                  <span className="font-semibold text-blue-700">Recommended</span>
                )}
              </div>
              <h2 className="font-display text-xl font-bold text-slate-950">
                {plan.name}
              </h2>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-display text-3xl font-extrabold text-slate-950 tabular-nums">
                  {formatINR(plan.monthlyPrice)}
                </span>
                {Number(plan.originalPrice) > Number(plan.monthlyPrice) && (
                  <span className="text-xs text-slate-400 line-through tabular-nums">
                    {formatINR(plan.originalPrice)}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 mt-1 tabular-nums">
                Per {plan.validityDays} days · Excl. 18% GST
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Speed</span>
                  <span className="font-semibold text-slate-950 tabular-nums">
                    {plan.speedMbps} Mbps
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Allowance</span>
                  <span className="font-semibold text-slate-950">{plan.dataLimit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Validity</span>
                  <span className="font-semibold text-slate-950 tabular-nums">
                    {plan.validityDays} Days
                  </span>
                </div>
              </div>

              <ul className="mt-5 space-y-2.5 border-t border-slate-100 pt-4">
                {plan.features.map((f, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>{f}</span>
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
              Prebook {plan.name}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
