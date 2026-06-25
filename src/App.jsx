import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import ErrorBoundary          from './components/ErrorBoundary';
import LoadingScreen          from './components/LoadingScreen';
import CustomCursor           from './components/CustomCursor';
import ScrollProgress         from './components/ScrollProgress';
import ScrollToTop            from './components/ScrollToTop';
import ParticleBackground     from './components/ParticleBackground';
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

import { QuoteModalProvider } from './context/QuoteModalContext';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';

import { initAnalytics } from './utils/analytics';

// Scroll to top on route change
function ScrollReset() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);
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

      {/* Admin routes — no site chrome */}
      {isAdmin ? (
        <Routes location={location} key="admin">
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
          <Route path="/admin/contacts" element={<AdminGuard><AdminContacts /></AdminGuard>} />
          <Route path="/admin/quotes" element={<AdminGuard><AdminQuotes /></AdminGuard>} />
          <Route path="/admin/newsletter" element={<AdminGuard><AdminNewsletter /></AdminGuard>} />
        </Routes>
      ) : (
        <>
          <Navbar />
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    document.body.classList.toggle('loading', loading);
  }, [loading]);

  if (loading) {
    return <LoadingScreen onComplete={() => setLoading(false)} />;
  }

  return (
    <ErrorBoundary>
      <AdminAuthProvider>
        <QuoteModalProvider>
          <Router>
            <div className="noise-overlay" aria-hidden="true" />
            <ParticleBackground />
            <CustomCursor />
            <ScrollProgress />
            <AppRoutes />
          </Router>
        </QuoteModalProvider>
      </AdminAuthProvider>
    </ErrorBoundary>
  );
}
