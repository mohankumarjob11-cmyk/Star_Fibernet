import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import {
  CartItem,
  InternetPlan,
  PageRoute,
  Product,
  User,
} from '../types.ts';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextValue {
  route: PageRoute;
  navigate: (r: PageRoute, opts?: { planId?: number; productSlug?: string; category?: string }) => void;
  selectedPlanId: number | null;
  selectedProductSlug: string | null;
  shopCategoryFilter: string;
  setShopCategoryFilter: (cat: string) => void;
  user: User | null;
  authLoading: boolean;
  token: string | null;
  apiFetch: <T = any>(url: string, init?: RequestInit) => Promise<T>;
  loginWithEmail: (email: string, password: string) => Promise<User>;
  registerWithEmail: (payload: {
    fullName: string;
    email: string;
    mobile: string;
    password: string;
    address: string;
    referralCode?: string;
  }) => Promise<User>;
  loginWithGoogle: () => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  plans: InternetPlan[];
  products: Product[];
  reloadCatalog: () => Promise<void>;
  cart: CartItem[];
  addToCart: (product: Product, qty?: number) => void;
  updateCartQty: (productId: number, qty: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  wishlistIds: number[];
  toggleWishlist: (productId: number) => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const CART_STORAGE_KEY = 'star_fibernet_cart_v1';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [route, setRoute] = useState<PageRoute>('home');
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [selectedProductSlug, setSelectedProductSlug] = useState<string | null>(null);
  const [shopCategoryFilter, setShopCategoryFilter] = useState<string>('All');

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [plans, setPlans] = useState<InternetPlan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore storage errors
    }
  }, [cart]);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const apiFetch = useCallback(
    async <T = any>(url: string, init?: RequestInit): Promise<T> => {
      const headers = new Headers(init?.headers || {});
      if (!headers.has('Content-Type') && !(init?.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
      }
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      const res = await fetch(url, {
        ...init,
        headers,
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      return data as T;
    },
    [token]
  );

  const reloadCatalog = useCallback(async () => {
    try {
      const [plansRes, prodsRes] = await Promise.all([
        fetch('/api/plans').then((r) => r.json()),
        fetch('/api/products').then((r) => r.json()),
      ]);
      if (plansRes.plans) setPlans(plansRes.plans);
      if (prodsRes.products) setProducts(prodsRes.products);
    } catch (err) {
      console.error('Failed loading catalog:', err);
    }
  }, []);

  const loadWishlist = useCallback(async (authToken?: string | null) => {
    try {
      const headers: Record<string, string> = {};
      if (authToken) headers.Authorization = `Bearer ${authToken}`;
      const res = await fetch('/api/wishlist', { headers, credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setWishlistIds((data.items || []).map((p: Product) => p.id));
      }
    } catch {
      // ignore
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch('/api/auth/me', { headers, credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        await loadWishlist(token);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, [token, loadWishlist]);

  useEffect(() => {
    reloadCatalog();
    refreshUser();
  }, [reloadCatalog, refreshUser]);

  const navigate = useCallback(
    (
      r: PageRoute,
      opts?: { planId?: number; productSlug?: string; category?: string }
    ) => {
      if (opts?.planId !== undefined) setSelectedPlanId(opts.planId);
      if (opts?.productSlug !== undefined) setSelectedProductSlug(opts.productSlug);
      if (opts?.category !== undefined) setShopCategoryFilter(opts.category);
      setRoute(r);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    []
  );

  const loginWithEmail = async (email: string, password: string): Promise<User> => {
    const data = await apiFetch<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    setUser(data.user);
    await loadWishlist(data.token);
    return data.user;
  };

  const registerWithEmail = async (payload: {
    fullName: string;
    email: string;
    mobile: string;
    password: string;
    address: string;
    referralCode?: string;
  }): Promise<User> => {
    const data = await apiFetch<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setToken(data.token);
    setUser(data.user);
    await loadWishlist(data.token);
    return data.user;
  };

  const loginWithGoogle = async (): Promise<User> => {
    const cred = await signInWithPopup(auth, googleAuthProvider);
    const idToken = await cred.user.getIdToken();
    const data = await apiFetch<{ token: string; user: User }>('/api/auth/firebase', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
    setToken(data.token);
    setUser(data.user);
    await loadWishlist(data.token);
    return data.user;
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    await signOut(auth).catch(() => {});
    setToken(null);
    setUser(null);
    setWishlistIds([]);
    setRoute('home');
    showToast('Signed out cleanly.', 'info');
  };

  const addToCart = (product: Product, qty = 1) => {
    if (product.stockQuantity <= 0 || !product.isActive) {
      showToast('This item is currently out of stock.', 'error');
      return;
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        const nextQty = Math.min(product.stockQuantity, existing.quantity + qty);
        if (nextQty === existing.quantity) {
          showToast(`Maximum available stock (${product.stockQuantity}) reached.`, 'info');
          return prev;
        }
        showToast(`Updated ${product.name} quantity in cart.`, 'success');
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, product, quantity: nextQty } : i
        );
      }
      showToast(`Added ${product.name} to cart.`, 'success');
      return [...prev, { product, quantity: Math.min(qty, product.stockQuantity) }];
    });
  };

  const updateCartQty = (productId: number, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: Math.min(qty, item.product.stockQuantity) }
          : item
      )
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  const toggleWishlist = async (productId: number) => {
    if (!user) {
      showToast('Sign in to save items to your wishlist.', 'info');
      navigate('auth');
      return;
    }
    try {
      const res = await apiFetch<{ wishlisted: boolean }>('/api/wishlist/toggle', {
        method: 'POST',
        body: JSON.stringify({ productId }),
      });
      setWishlistIds((prev) =>
        res.wishlisted ? [...prev, productId] : prev.filter((id) => id !== productId)
      );
      showToast(
        res.wishlisted ? 'Saved to wishlist.' : 'Removed from wishlist.',
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to update wishlist.', 'error');
    }
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce(
    (sum, item) => sum + Number(item.product.sellingPrice) * item.quantity,
    0
  );

  return (
    <AppContext.Provider
      value={{
        route,
        navigate,
        selectedPlanId,
        selectedProductSlug,
        shopCategoryFilter,
        setShopCategoryFilter,
        user,
        authLoading,
        token,
        apiFetch,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
        refreshUser,
        plans,
        products,
        reloadCatalog,
        cart,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        cartCount,
        cartSubtotal,
        wishlistIds,
        toggleWishlist,
        showToast,
      }}
    >
      {children}

      {/* Global Toast Stack */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm no-print"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-lg shadow-lg border text-sm font-medium transition-all ${
              t.type === 'error'
                ? 'bg-red-950 text-red-50 border-red-800'
                : t.type === 'success'
                ? 'bg-slate-950 text-white border-blue-500'
                : 'bg-slate-900 text-slate-100 border-slate-700'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
