import { Download, Printer, X } from 'lucide-react';
import { InvoiceRecord, Order, OrderItem, PaymentRecord } from '../types.ts';
import { downloadInvoicePdf, formatINR } from '../utils/invoicePdf.ts';

interface InvoiceModalProps {
  data: {
    order: Order;
    items: OrderItem[];
    payment: PaymentRecord | null;
    invoice: InvoiceRecord | null;
  };
  onClose: () => void;
}

export function InvoiceModal({ data, onClose }: InvoiceModalProps) {
  const { order, items, payment, invoice } = data;
  const invoiceNum =
    invoice?.invoiceNumber || `INV-SF-${order.orderCode.replace('ORD-', '')}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden my-8">
        {/* Toolbar */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 no-print">
          <div>
            <h3 className="font-display text-base font-bold text-slate-950">
              Tax Invoice & Order Receipt
            </h3>
            <p className="text-xs text-slate-500 font-mono tabular-nums">
              {invoiceNum} · {order.orderCode}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Invoice / Receipt
            </button>
            <button
              onClick={() => downloadInvoicePdf(data)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </button>
            <button
              onClick={onClose}
              aria-label="Close invoice"
              className="p-2 text-slate-500 hover:text-slate-900 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Canvas */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-900">
          <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <div className="font-display text-xl font-extrabold text-slate-950">
                STAR FIBERNET
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Star Fibernet Broadband & Hardware Pvt. Ltd.
              </p>
              <p className="text-xs text-slate-600">
                MG Road, Bengaluru 560001 · support@starfibernet.com
              </p>
              <p className="text-xs font-mono text-slate-700 mt-1">
                GSTIN: {invoice?.gstNumber || '29AAACS8842K1Z5'}
              </p>
            </div>
            <div className="sm:text-right">
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                GST Tax Invoice
              </div>
              <div className="font-mono text-base font-bold text-slate-950 mt-1 tabular-nums">
                {invoiceNum}
              </div>
              <div className="text-xs text-slate-600 mt-1 tabular-nums">
                Order ID: {order.orderCode}
              </div>
              <div className="text-xs text-slate-600 tabular-nums">
                Issued: {new Date(invoice?.issuedAt || order.createdAt).toLocaleDateString('en-IN')}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <div>
              <div className="text-xs font-semibold text-slate-500 mb-1">
                Customer Details
              </div>
              <div className="font-semibold text-slate-950">{order.customerName}</div>
              <div className="text-slate-600 text-xs mt-0.5">{order.shippingAddress}</div>
              <div className="text-slate-600 text-xs mt-1 tabular-nums">
                Mobile: {order.customerPhone} · {order.customerEmail}
              </div>
            </div>
            <div className="sm:text-right">
              <div className="text-xs font-semibold text-slate-500 mb-1">
                Payment & Settlement
              </div>
              <div className="text-xs text-slate-700">
                Method: <span className="font-semibold">{order.paymentMethod}</span>
              </div>
              <div className="text-xs text-slate-700 mt-0.5">
                Status: <span className="font-semibold">{order.paymentStatus}</span>
              </div>
              <div className="text-xs font-mono text-slate-600 mt-0.5 tabular-nums">
                Txn Ref: {payment?.gatewayPaymentId || payment?.gatewayOrderId || 'COD'}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Product</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Qty</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Unit Price</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{item.productName}</div>
                      <div className="text-xs font-mono text-slate-500">{item.modelNumber}</div>
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums">{item.quantity}</td>
                    <td className="py-3 px-4 text-right tabular-nums">
                      {formatINR(item.unitPrice)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold tabular-nums">
                      {formatINR(item.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="w-full sm:w-72 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatINR(order.subtotal)}</span>
              </div>
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount ({order.couponCode || 'Promo'})</span>
                  <span className="tabular-nums">-{formatINR(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>GST (18%)</span>
                <span className="tabular-nums">{formatINR(order.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span className="tabular-nums">
                  {Number(order.shippingFee) === 0 ? 'Free' : formatINR(order.shippingFee)}
                </span>
              </div>
              <div className="flex justify-between font-display text-base font-bold text-slate-950 pt-2 border-t border-slate-200">
                <span>Total Amount</span>
                <span className="tabular-nums">{formatINR(order.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
