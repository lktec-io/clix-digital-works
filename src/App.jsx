import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import ErrorBoundary          from './components/ErrorBoundary';
import LoadingScreen          from './components/LoadingScreen';
import ScrollProgress         from './components/ScrollProgress';
import ScrollToTop            from './components/ScrollToTop';
import ScrollReset            from './components/ScrollReset';
import TechBackground         from './components/TechBackground';
import Navbar                 from './components/Navbar';
import Footer                 from './components/Footer';
import QuoteModal             from './components/QuoteModal';
import NewsletterBanner       from './components/NewsletterBanner';

import Home           from './pages/Home';
import ServicesPage   from './pages/ServicesPage';
import SolutionsPage  from './pages/SolutionsPage';
import PortfolioPage  from './pages/PortfolioPage';
import AboutPage      from './pages/AboutPage';
import BlogPage       from './pages/BlogPage';
import ContactPage    from './pages/ContactPage';
import PrivacyPage    from './pages/PrivacyPage';
import TermsPage      from './pages/TermsPage';
import SitemapPage    from './pages/SitemapPage';
import NotFoundPage   from './pages/NotFoundPage';

import AdminLogin      from './pages/admin/AdminLogin';
import AdminDashboard  from './pages/admin/AdminDashboard';
import AdminContacts   from './pages/admin/AdminContacts';
import AdminQuotes     from './pages/admin/AdminQuotes';
import AdminNewsletter from './pages/admin/AdminNewsletter';
import AdminClients            from './pages/admin/crm/AdminClients';
import AdminClientDetail       from './pages/admin/crm/AdminClientDetail';
import AdminProjects           from './pages/admin/crm/AdminProjects';
import AdminFollowUps          from './pages/admin/crm/AdminFollowUps';
import AdminPayments           from './pages/admin/crm/AdminPayments';
import AdminExpenses           from './pages/admin/crm/AdminExpenses';
import AdminCardHubEvents      from './pages/admin/crm/AdminCardHubEvents';
import AdminCardHubEventDetail from './pages/admin/crm/AdminCardHubEventDetail';

import { QuoteModalProvider } from './context/QuoteModalContext';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';

import { initAnalytics, trackPageView } from './utils/analytics';

// Fire a GA page_view on every SPA route change
function RouteAnalytics() {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);
  return null;
}

// Protect admin routes
function AdminGuard({ children }) {
  const { isAuthenticated } = useAdminAuth();
  return isAuthenticated ? children : <Navigate to="/admin/login" replace />;
}

function AppRoutes() {
  const location = useLocation();
  const isAdmin  = location.pathname.startsWith('/admin');

  return (
    <>
      <ScrollReset />
      <RouteAnalytics />

      {/* Admin routes — no site chrome */}
      {isAdmin ? (
        <Routes location={location} key="admin">
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
          <Route path="/admin/contacts" element={<AdminGuard><AdminContacts /></AdminGuard>} />
          <Route path="/admin/quotes" element={<AdminGuard><AdminQuotes /></AdminGuard>} />
          <Route path="/admin/newsletter" element={<AdminGuard><AdminNewsletter /></AdminGuard>} />
          <Route path="/admin/clients" element={<AdminGuard><AdminClients /></AdminGuard>} />
          <Route path="/admin/clients/:id" element={<AdminGuard><AdminClientDetail /></AdminGuard>} />
          <Route path="/admin/projects" element={<AdminGuard><AdminProjects /></AdminGuard>} />
          <Route path="/admin/follow-ups" element={<AdminGuard><AdminFollowUps /></AdminGuard>} />
          <Route path="/admin/payments" element={<AdminGuard><AdminPayments /></AdminGuard>} />
          <Route path="/admin/expenses" element={<AdminGuard><AdminExpenses /></AdminGuard>} />
          <Route path="/admin/cardhub/upcoming" element={<AdminGuard><AdminCardHubEvents key="upcoming" defaultView="upcoming" /></AdminGuard>} />
          <Route path="/admin/cardhub/events" element={<AdminGuard><AdminCardHubEvents key="all" defaultView="all" /></AdminGuard>} />
          <Route path="/admin/cardhub/events/:id" element={<AdminGuard><AdminCardHubEventDetail /></AdminGuard>} />
          <Route path="/admin/cardhub/customers" element={<AdminGuard><AdminClients mode="cardhub" /></AdminGuard>} />
        </Routes>
      ) : (
        <>
          {/* Public-site chrome only.
              These are fixed, full-viewport layers. `.tech-bg` in particular is
              opaque and positioned (z-index 0), so anything static painted in
              the same stacking context ends up underneath it. The admin's main
              content and login card are static by design — mounting these on
              /admin buried the CRM behind an opaque navy sheet while the fixed
              sidebar (z-index 10) and sticky topbar (z-index 5) stayed visible.
              They belong to the public branch and are mounted here only. */}
          <div className="noise-overlay" aria-hidden="true" />
          <TechBackground />
          <ScrollProgress />
          <a href="#main-content" className="skip-link">Skip to main content</a>
          <Navbar />
          <main id="main-content" tabIndex={-1}>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/"          element={<Home />} />
                <Route path="/services"  element={<ServicesPage />} />
                <Route path="/solutions" element={<SolutionsPage />} />
                <Route path="/portfolio" element={<PortfolioPage />} />
                <Route path="/about"     element={<AboutPage />} />
                <Route path="/blog"      element={<BlogPage />} />
                <Route path="/contact"   element={<ContactPage />} />
                <Route path="/privacy"   element={<PrivacyPage />} />
                <Route path="/terms"     element={<TermsPage />} />
                <Route path="/sitemap"   element={<SitemapPage />} />
                <Route path="*"          element={<NotFoundPage />} />
              </Routes>
            </AnimatePresence>
          </main>
          <NewsletterBanner />
          <Footer />
          <ScrollToTop />
          <QuoteModal />
        </>
      )}
    </>
  );
}

export default function App() {
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    document.body.classList.toggle('loading', booting);
  }, [booting]);

  /* The app mounts immediately and the boot screen sits over it, rather than
     the app being withheld until the screen finishes. That is what lets the
     boot sequence report real readiness — the router, fonts and page assets
     are genuinely loading underneath while it is on screen — and it means the
     site is painted and interactive the instant the overlay lifts. */
  return (
    <ErrorBoundary>
      <AdminAuthProvider>
        <QuoteModalProvider>
          <Router>
            <AppRoutes />
          </Router>
        </QuoteModalProvider>
      </AdminAuthProvider>

      {booting && <LoadingScreen onComplete={() => setBooting(false)} />}
    </ErrorBoundary>
  );
}
