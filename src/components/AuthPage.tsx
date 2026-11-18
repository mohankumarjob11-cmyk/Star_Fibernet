import { useState } from 'react';
import { Lock, Mail, UserPlus } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

export function AuthPage() {
  const {
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    navigate,
    showToast,
  } = useApp();

  const [tab, setTab] = useState<'login' | 'register' | 'forgot' | 'admin'>('login');
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [referralCode, setReferralCode] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await loginWithEmail(email, password);
      showToast(`Welcome back, ${user.fullName}.`, 'success');
      navigate(user.role === 'admin' ? 'admin' : 'dashboard');
    } catch (err: any) {
      showToast(err.message || 'Sign in failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    setLoading(true);
    try {
      const user = await registerWithEmail({
        fullName,
        email,
        mobile,
        password,
        address,
        referralCode,
      });
      showToast(`Account created for ${user.fullName}.`, 'success');
      navigate('dashboard');
    } catch (err: any) {
      showToast(err.message || 'Registration failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      showToast(data.message || 'Reset request sent.', 'info');
      setTab('login');
    } catch {
      showToast('Could not send reset request.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const user = await loginWithGoogle();
      showToast(`Signed in with Google as ${user.fullName}.`, 'success');
      navigate(user.role === 'admin' ? 'admin' : 'dashboard');
    } catch (err: any) {
      showToast(err.message || 'Google sign-in failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-14">
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setTab('login')}
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              tab === 'login' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600'
            }`}
          >
            Customer Login
          </button>
          <button
            onClick={() => setTab('register')}
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              tab === 'register' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600'
            }`}
          >
            Register
          </button>
          <button
            onClick={() => setTab('admin')}
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              tab === 'admin' ? 'bg-slate-950 text-white shadow-xs' : 'text-slate-600'
            }`}
          >
            Admin Portal
          </button>
        </div>

        {(tab === 'login' || tab === 'admin') && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <h1 className="font-display text-xl font-bold text-slate-950">
                {tab === 'admin' ? 'Administrator Sign In' : 'Customer Sign In'}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                {tab === 'admin'
                  ? 'Authorized Star Fibernet operations staff only.'
                  : 'Access your fiber prebookings, installations, orders, and GST invoices.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={tab === 'admin' ? 'admin@company.com' : 'you@example.com'}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-700">Password</label>
                {tab === 'login' && (
                  <button
                    type="button"
                    onClick={() => setTab('forgot')}
                    className="text-xs text-blue-700 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Lock className="w-4 h-4" />
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            {tab === 'login' && (
              <>
                <div className="relative py-2 flex items-center">
                  <div className="flex-grow border-t border-slate-200" />
                  <span className="px-3 text-xs text-slate-400">or</span>
                  <div className="flex-grow border-t border-slate-200" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-800 text-sm font-semibold cursor-pointer disabled:opacity-60"
                >
                  Continue with Google
                </button>
              </>
            )}
          </form>
        )}

        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <h1 className="font-display text-xl font-bold text-slate-950">
                Create Customer Account
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Manage connections, hardware orders, and referral rewards.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number *
                </label>
                <input
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-600 tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address *
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password *
                </label>
                <input
                  required
                  type="password"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  required
                  type="password"
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Address *
              </label>
              <input
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Referral Code (Optional)
              </label>
              <input
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder="e.g. STAR-PRIYA26"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm uppercase focus:outline-none focus:border-blue-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <UserPlus className="w-4 h-4" />
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}

        {tab === 'forgot' && (
          <form onSubmit={handleForgot} className="space-y-4">
            <h1 className="font-display text-xl font-bold text-slate-950">
              Reset Password
            </h1>
            <p className="text-xs text-slate-500">
              Enter your registered email address to request a password reset.
            </p>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-600"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Mail className="w-4 h-4" /> Send Reset Request
              </button>
              <button
                type="button"
                onClick={() => setTab('login')}
                className="px-4 py-2.5 rounded-lg border border-slate-300 text-xs font-semibold cursor-pointer"
              >
                Back
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
