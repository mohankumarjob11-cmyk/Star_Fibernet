import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  CreditCard,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { Order, UserAddress } from '../types.ts';
import { formatINR } from '../utils/invoicePdf.ts';
import { ResilientImage } from './ResilientImage.tsx';

export function CartCheckoutPage({ mode }: { mode: 'cart' | 'checkout' }) {
  const {
    cart,
    updateCartQty,
    removeFromCart,
    clearCart,
    cartSubtotal,
    navigate,
    user,
    apiFetch,
    showToast,
    reloadCatalog,
  } = useApp();

  const [codEnabled, setCodEnabled] = useState(true);
  const [shippingFlat, setShippingFlat] = useState(99);
  const [freeThreshold, setFreeThreshold] = useState(2500);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    description: string;
  } | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<
    'UPI' | 'Credit Card' | 'Debit Card' | 'Net Banking' | 'Wallet' | 'COD'
  >('UPI');

  const [placing, setPlacing] = useState(false);
  const [paymentModal, setPaymentModal] = useState<{
    order: Order;
    gatewayOrderId: string;
    amountPaise: number;
    mode: string;
    error?: string;
  } | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetch('/api/settings/public')
      .then((r) => r.json())
      .then((d) => {
        setCodEnabled(d.codEnabled !== false);
        if (d.shippingFlat !== undefined) setShippingFlat(Number(d.shippingFlat));
        if (d.freeShippingThreshold !== undefined)
          setFreeThreshold(Number(d.freeShippingThreshold));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      setCustomerName((v) => v || user.fullName);
      setCustomerPhone((v) => v || user.mobile);
      setShippingAddress((v) => v || user.address);
      apiFetch<{ addresses: UserAddress[] }>('/api/addresses')
        .then((d) => setAddresses(d.addresses || []))
        .catch(() => {});
    }
  }, [user, apiFetch]);

  const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const taxable = Math.max(0, cartSubtotal - discount);
  const shippingFee = taxable === 0 || taxable >= freeThreshold ? 0 : shippingFlat;
  const gst = Math.round(taxable * 0.18 * 100) / 100;
  const finalPayable = Math.round((taxable + shippingFee + gst) * 100) / 100;

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    try {
      const res = await apiFetch<{
        valid: boolean;
        code: string;
        discountAmount: number;
        description: string;
      }>('/api/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({ code: couponInput.trim(), subtotal: cartSubtotal }),
      });
      setAppliedCoupon({
        code: res.code,
        discountAmount: res.discountAmount,
        description: res.description,
      });
      showToast(res.description, 'success');
    } catch (err: any) {
      setAppliedCoupon(null);
      showToast(err.message || 'Invalid coupon code.', 'error');
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Please sign in to complete your order.', 'info');
      navigate('auth');
      return;
    }
    setPlacing(true);
    try {
      const res = await apiFetch<{
        order: Order;
        requiresOnlinePayment: boolean;
        paymentSession?: {
          gatewayOrderId: string;
          amountPaise: number;
          mode: string;
        };
      }>('/api/checkout/create-order', {
        method: 'POST',
        body: JSON.stringify({
          items: cart.map((c) => ({
            productId: c.product.id,
            quantity: c.quantity,
          })),
          customerName,
          customerPhone,
          shippingAddress,
          paymentMethod,
          couponCode: appliedCoupon?.code || '',
        }),
      });

      if (!res.requiresOnlinePayment) {
        clearCart();
        await reloadCatalog();
        setCompletedOrder(res.order);
        showToast(`Order ${res.order.orderCode} confirmed!`, 'success');
      } else if (res.paymentSession) {
        setPaymentModal({
          order: res.order,
          gatewayOrderId: res.paymentSession.gatewayOrderId,
          amountPaise: res.paymentSession.amountPaise,
          mode: res.paymentSession.mode,
        });
      }
    } catch (err: any) {
      showToast(err.message || 'Checkout failed.', 'error');
    } finally {
      setPlacing(false);
    }
  };

  const handleAuthorizePayment = async () => {
    if (!paymentModal) return;
    setPlacing(true);
    try {
      // 1. Obtain cryptographic HMAC signature from payment gateway step
      const authRes = await apiFetch<{
        gatewayOrderId: string;
        gatewayPaymentId: string;
        signature: string;
      }>('/api/checkout/authorize-sandbox', {
        method: 'POST',
        body: JSON.stringify({ gatewayOrderId: paymentModal.gatewayOrderId }),
      });

      // 2. Verify signature strictly on backend before marking order Paid
      const verifyRes = await apiFetch<{ order: Order; verified: boolean }>(
        '/api/checkout/verify-payment',
        {
          method: 'POST',
          body: JSON.stringify({
            orderId: paymentModal.order.id,
            gatewayOrderId: authRes.gatewayOrderId,
            gatewayPaymentId: authRes.gatewayPaymentId,
            signature: authRes.signature,
          }),
        }
      );

      clearCart();
      await reloadCatalog();
      setPaymentModal(null);
      setCompletedOrder(verifyRes.order);
      showToast(`Payment verified for ${verifyRes.order.orderCode}!`, 'success');
    } catch (err: any) {
      setPaymentModal((prev) =>
        prev ? { ...prev, error: err.message || 'Payment verification failed.' } : null
      );
    } finally {
      setPlacing(false);
    }
  };

  const handleSimulateFailure = async () => {
    if (!paymentModal) return;
    await apiFetch('/api/checkout/payment-failed', {
      method: 'POST',
      body: JSON.stringify({
        orderId: paymentModal.order.id,
        gatewayOrderId: paymentModal.gatewayOrderId,
      }),
    }).catch(() => {});
    setPaymentModal((prev) =>
      prev
        ? {
            ...prev,
            error:
              'Payment declined by issuing bank. You can retry with the same order or switch payment methods.',
          }
        : null
    );
  };

  if (completedOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-14">
        <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-5">
          <CheckCircle2 className="w-10 h-10 text-blue-600" />
          <h1 className="font-display text-2xl font-bold text-slate-950">
            Order Confirmed
          </h1>
          <p className="text-sm text-slate-600">
            Thank you for ordering from Star Fibernet. Your GST invoice is ready in your Customer Dashboard.
          </p>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-slate-500">Order Code</div>
              <div className="font-mono font-bold text-slate-950 tabular-nums">
                {completedOrder.orderCode}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Total Paid / Payable</div>
              <div className="font-bold text-slate-950 tabular-nums">
                {formatINR(completedOrder.totalAmount)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Payment Method</div>
              <div className="font-medium text-slate-900">
                {completedOrder.paymentMethod} ({completedOrder.paymentStatus})
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Order Status</div>
              <div className="font-semibold text-blue-700">
                {completedOrder.orderStatus}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('dashboard')}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer"
            >
              View Order & Download Invoice
            </button>
            <button
              onClick={() => navigate('shop')}
              className="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
        <h1 className="font-display text-2xl font-bold text-slate-950">
          Your Shopping Cart is Empty
        </h1>
        <p className="text-sm text-slate-600">
          Explore Wi-Fi 7 routers, optical ONTs, network switches, and fiber patch cords in our store.
        </p>
        <button
          onClick={() => navigate('shop')}
          className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer"
        >
          Browse Networking Hardware
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 mb-1">
            Star Fibernet Store
          </p>
          <h1 className="font-display text-3xl font-extrabold text-slate-950">
            {mode === 'cart' ? 'Shopping Cart' : 'Secure Checkout'}
          </h1>
        </div>
        {mode === 'checkout' && (
          <button
            onClick={() => navigate('cart')}
            className="text-sm font-semibold text-blue-700 hover:underline cursor-pointer"
          >
            Back to Cart
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Section: Cart Items OR Shipping & Payment Form */}
        <div className="lg:col-span-8 space-y-6">
          {mode === 'cart' ? (
            <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
              {cart.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                      <ResilientImage
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-display text-sm font-bold text-slate-950">
                        {product.name}
                      </h3>
                      <div className="text-xs text-slate-500 mt-0.5 tabular-nums">
                        {product.modelNumber} · {formatINR(product.sellingPrice)} each
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5">
                    <div className="inline-flex items-center border border-slate-300 rounded-lg">
                      <button
                        onClick={() => updateCartQty(product.id, quantity - 1)}
                        className="p-2 text-slate-600 hover:bg-slate-50 cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-sm font-semibold tabular-nums">
                        {quantity}
                      </span>
                      <button
                        onClick={() => updateCartQty(product.id, quantity + 1)}
                        className="p-2 text-slate-600 hover:bg-slate-50 cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="font-display text-sm font-bold text-slate-950 w-24 text-right tabular-nums">
                      {formatINR(Number(product.sellingPrice) * quantity)}
                    </div>

                    <button
                      onClick={() => removeFromCart(product.id)}
                      aria-label="Remove item"
                      className="p-2 text-slate-400 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <form
              id="checkout-form"
              onSubmit={handlePlaceOrder}
              className="bg-white border border-slate-200 rounded-xl p-6 space-y-6"
            >
              {!user && (
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-between gap-4">
                  <span className="text-xs sm:text-sm text-blue-900">
                    Sign in to place your order and download GST invoices.
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate('auth')}
                    className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Sign In
                  </button>
                </div>
              )}

              {addresses.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Use Saved Delivery Address
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {addresses.map((addr) => (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => {
                          setShippingAddress(
                            `${addr.line1}, ${addr.city}, ${addr.district} ${addr.pinCode}`
                          );
                          setCustomerPhone(addr.phone);
                        }}
                        className="p-3 rounded-lg border border-slate-200 hover:border-blue-600 text-left text-xs cursor-pointer"
                      >
                        <div className="font-semibold text-slate-950">{addr.label}</div>
                        <div className="text-slate-600 mt-0.5 line-clamp-2">
                          {addr.line1}, {addr.city} {addr.pinCode}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Recipient Full Name *
                  </label>
                  <input
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Contact Mobile Number *
                  </label>
                  <input
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-600 tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Delivery Address *
                </label>
                <textarea
                  required
                  rows={2}
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="House/Flat No, Street, City, PIN Code"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Select Payment Method *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(
                    [
                      'UPI',
                      'Credit Card',
                      'Debit Card',
                      'Net Banking',
                      'Wallet',
                      ...(codEnabled ? ['COD'] : []),
                    ] as const
                  ).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method as any)}
                      className={`px-3.5 py-2.5 rounded-lg border text-xs font-semibold text-left transition-colors cursor-pointer ${
                        paymentMethod === method
                          ? 'border-blue-600 bg-blue-50 text-blue-800'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {method === 'COD' ? 'Cash on Delivery' : method}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Online payments are verified via Razorpay HMAC-SHA256 signatures on the server. Card numbers and UPI PINs are never stored.
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Right Section: Order Summary */}
        <div className="lg:col-span-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 sticky top-24">
            <h2 className="font-display text-lg font-bold text-slate-950">
              Order Summary
            </h2>

            <div className="flex gap-2">
              <input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="Promo code (e.g. STARFIBER10)"
                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs uppercase focus:outline-none focus:border-blue-600"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                className="px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer"
              >
                Apply
              </button>
            </div>
            {appliedCoupon && (
              <div className="text-xs text-emerald-700 font-medium">
                {appliedCoupon.code}: {appliedCoupon.description}
              </div>
            )}

            <div className="space-y-2.5 text-sm border-t border-slate-100 pt-4">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatINR(cartSubtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount</span>
                  <span className="tabular-nums">-{formatINR(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Shipping (Free over {formatINR(freeThreshold)})</span>
                <span className="tabular-nums">
                  {shippingFee === 0 ? 'Free' : formatINR(shippingFee)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimated GST (18%)</span>
                <span className="tabular-nums">{formatINR(gst)}</span>
              </div>
              <div className="flex justify-between font-display text-base font-bold text-slate-950 pt-3 border-t border-slate-200">
                <span>Final Payable</span>
                <span className="tabular-nums">{formatINR(finalPayable)}</span>
              </div>
            </div>

            {mode === 'cart' ? (
              <button
                onClick={() => navigate('checkout')}
                className="w-full py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                Proceed to Checkout
              </button>
            ) : (
              <button
                type="submit"
                form="checkout-form"
                disabled={placing}
                className="w-full py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
              >
                {placing
                  ? 'Creating Secure Order...'
                  : paymentMethod === 'COD'
                  ? `Place COD Order (${formatINR(finalPayable)})`
                  : `Pay ${formatINR(finalPayable)} Securely`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Secure Razorpay Payment Verification Modal */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <div className="font-display text-base font-bold">
                  Star Fibernet Secure Checkout
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Razorpay Gateway ({paymentModal.mode})
                </div>
              </div>
              <CreditCard className="w-5 h-5 text-blue-400" />
            </div>

            <div className="p-6 space-y-5">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center">
                <div>
                  <div className="text-xs text-slate-500">Order {paymentModal.order.orderCode}</div>
                  <div className="text-xs font-medium text-slate-700 mt-0.5">
                    Method: {paymentModal.order.paymentMethod}
                  </div>
                </div>
                <div className="font-display text-xl font-extrabold text-slate-950 tabular-nums">
                  {formatINR(paymentModal.order.totalAmount)}
                </div>
              </div>

              {paymentModal.error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                  {paymentModal.error}
                </div>
              )}

              <p className="text-xs text-slate-600 leading-relaxed">
                Complete authorization below. The backend will verify the cryptographic payment signature before deducting stock and issuing your GST invoice.
              </p>

              <div className="space-y-2.5">
                <button
                  onClick={handleAuthorizePayment}
                  disabled={placing}
                  className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer disabled:opacity-60"
                >
                  {placing ? 'Verifying Signature...' : 'Authorize & Verify Payment'}
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSimulateFailure}
                    className="flex-1 py-2 px-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Test Bank Decline
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentModal(null)}
                    className="flex-1 py-2 px-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
