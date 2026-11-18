import { AppProvider, useApp } from './context/AppContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { HomePage } from './components/HomePage.tsx';
import { PlansPage } from './components/PlansPage.tsx';
import { PrebookPage } from './components/PrebookPage.tsx';
import { InstallationPage } from './components/InstallationPage.tsx';
import { ShopPage } from './components/ShopPage.tsx';
import { CartCheckoutPage } from './components/CartCheckoutPage.tsx';
import { AuthPage } from './components/AuthPage.tsx';
import { CustomerDashboard } from './components/CustomerDashboard.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { AboutPage, ContactPage } from './components/AboutContactPages.tsx';

function MainRouter() {
  const { route } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <main className="flex-1">
        {route === 'home' && <HomePage />}
        {route === 'plans' && <PlansPage />}
        {route === 'prebook' && <PrebookPage />}
        {route === 'installation' && <InstallationPage />}
        {route === 'shop' && <ShopPage />}
        {route === 'cart' && <CartCheckoutPage mode="cart" />}
        {route === 'checkout' && <CartCheckoutPage mode="checkout" />}
        {route === 'auth' && <AuthPage />}
        {route === 'dashboard' && <CustomerDashboard />}
        {route === 'admin' && <AdminDashboard />}
        {route === 'about' && <AboutPage />}
        {route === 'contact' && <ContactPage />}
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainRouter />
    </AppProvider>
  );
}
