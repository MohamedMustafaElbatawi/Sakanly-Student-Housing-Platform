import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar.jsx';
import { MobileBottomNav } from './components/layout/MobileBottomNav.jsx';
import { Footer } from './components/layout/Footer.jsx';

// Core Public Pages (eager loaded for instant first paint & SEO)
import { HomePage } from './pages/HomePage.jsx';
import { BrowsePage } from './pages/BrowsePage.jsx';
import { PropertyDetailsPage } from './pages/PropertyDetailsPage.jsx';
import { BedsPage } from './pages/BedsPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { ProtectedRoute } from './components/auth/ProtectedRoute.jsx';
import { FavoritesProvider } from './context/FavoritesContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { AdminAuthProvider } from './context/AdminAuthContext.jsx';

// Lazy-loaded routes for optimal Code Splitting & Performance
const ForgotPasswordPage = lazy(() =>
  import('./pages/ForgotPasswordPage.jsx').then((m) => ({ default: m.ForgotPasswordPage }))
);
const VerifyResetOtpPage = lazy(() =>
  import('./pages/VerifyResetOtpPage.jsx').then((m) => ({ default: m.VerifyResetOtpPage }))
);
const ResetPasswordPage = lazy(() =>
  import('./pages/ResetPasswordPage.jsx').then((m) => ({ default: m.ResetPasswordPage }))
);
const HowItWorksPage = lazy(() =>
  import('./pages/HowItWorksPage.jsx').then((m) => ({ default: m.HowItWorksPage }))
);
const MessagesPage = lazy(() =>
  import('./pages/MessagesPage.jsx').then((m) => ({ default: m.MessagesPage }))
);
const OwnerDashboardPage = lazy(() =>
  import('./pages/OwnerDashboardPage.jsx').then((m) => ({ default: m.OwnerDashboardPage }))
);
const AdminLoginPage = lazy(() =>
  import('./pages/AdminLoginPage.jsx').then((m) => ({ default: m.AdminLoginPage }))
);
const ControlCenterPage = lazy(() =>
  import('./pages/ControlCenterPage.jsx').then((m) => ({ default: m.ControlCenterPage }))
);
const OwnerVerificationReviewPage = lazy(() =>
  import('./pages/OwnerVerificationReviewPage.jsx').then((m) => ({ default: m.OwnerVerificationReviewPage }))
);
const ListingModerationReviewPage = lazy(() =>
  import('./pages/ListingModerationReviewPage.jsx').then((m) => ({ default: m.ListingModerationReviewPage }))
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage.jsx').then((m) => ({ default: m.NotFoundPage }))
);

const PageLoadingFallback = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-slate-500 gap-3" role="status" aria-label="جارٍ تحميل الصفحة">
    <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
    <span className="text-xs font-bold text-slate-600">جارٍ تحميل محتوى سكنلي...</span>
  </div>
);

const AppContent = () => {
  const location = useLocation();
  // Strictly identify all owner dashboard routes to suppress the public footer
  const isOwnerRoute =
    location.pathname.startsWith('/owner-dashboard') ||
    location.pathname.startsWith('/owner');

  // Strictly identify control center administration routes to suppress public layout
  const isControlCenterRoute = location.pathname.startsWith('/control-center');

  // Suppress public header, footer & mobile bottom nav on authentication pages
  const isAuthRoute =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/auth' ||
    location.pathname === '/forgot-password' ||
    location.pathname === '/verify-reset-otp' ||
    location.pathname === '/reset-password';

  return (
    <div className="min-h-screen flex flex-col bg-sakanly-bg text-sakanly-text font-cairo selection:bg-sakanly-primary selection:text-white">
      {/* Header - Hidden on authentication pages & control center */}
      {!isAuthRoute && !isControlCenterRoute && <Navbar />}

      {/* Main Router Content with Suspense Code Splitting */}
      <main className="flex-1">
        <Suspense fallback={<PageLoadingFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/browse" element={<BrowsePage />} />
            <Route path="/properties" element={<BrowsePage />} />
            <Route path="/favorites" element={<BrowsePage />} />
            <Route path="/property/:id" element={<PropertyDetailsPage />} />
            <Route path="/beds" element={<BedsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/verify-reset-otp" element={<VerifyResetOtpPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route
              path="/messages"
              element={
                <ProtectedRoute message="سجّل دخولك للاطلاع على محادثاتك ورسائلك.">
                  <MessagesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages/:conversationId"
              element={
                <ProtectedRoute message="سجّل دخولك للاطلاع على محادثاتك ورسائلك.">
                  <MessagesPage />
                </ProtectedRoute>
              }
            />

            {/* Super Admin Control Center Routes */}
            <Route path="/control-center/login" element={<AdminLoginPage />} />
            <Route path="/control-center/owner-verification/:ownerId" element={<OwnerVerificationReviewPage />} />
            <Route path="/control-center/listings/review/:listingId" element={<ListingModerationReviewPage />} />
            <Route path="/control-center" element={<ControlCenterPage />} />
            <Route path="/control-center/*" element={<ControlCenterPage />} />

            <Route 
              path="/owner-dashboard" 
              element={
                <ProtectedRoute message="سجّل دخولك بحساب مالك عقار للاستفادة من لوحة التحكم.">
                  <OwnerDashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/owner/properties" 
              element={
                <ProtectedRoute message="سجّل دخولك بحساب مالك عقار للاطلاع على عقاراتك وإدارتها.">
                  <OwnerDashboardPage initialTab="properties" />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/owner/properties/" 
              element={
                <ProtectedRoute message="سجّل دخولك بحساب مالك عقار للاطلاع على عقاراتك وإدارتها.">
                  <OwnerDashboardPage initialTab="properties" />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/owner/add-property" 
              element={
                <ProtectedRoute message="سجّل دخولك بحساب مالك عقار لإضافة وإدارة العقارات.">
                  <OwnerDashboardPage initialTab="add-property" />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/owner/properties/new" 
              element={
                <ProtectedRoute message="سجّل دخولك بحساب مالك عقار لإضافة عقار جديد.">
                  <OwnerDashboardPage initialTab="add-property" />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/owner/verification" 
              element={
                <ProtectedRoute message="سجّل دخولك بحساب مالك لتوثيق الهوية والملكية.">
                  <OwnerDashboardPage initialTab="verification" />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/owner/messages" 
              element={
                <ProtectedRoute message="سجّل دخولك بحساب مالك للاطلاع على الرسائل والمحادثات.">
                  <OwnerDashboardPage initialTab="messages" />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/owner/messages/" 
              element={
                <ProtectedRoute message="سجّل دخولك بحساب مالك للاطلاع على الرسائل والمحادثات.">
                  <OwnerDashboardPage initialTab="messages" />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/owner-dashboard/notifications" 
              element={
                <ProtectedRoute message="سجّل دخولك بحساب مالك للاطلاع على الإشعارات والتنبيهات.">
                  <OwnerDashboardPage initialTab="notifications" />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/owner/notifications" 
              element={
                <ProtectedRoute message="سجّل دخولك بحساب مالك للاطلاع على الإشعارات والتنبيهات.">
                  <OwnerDashboardPage initialTab="notifications" />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/owner/notifications/" 
              element={
                <ProtectedRoute message="سجّل دخولك بحساب مالك للاطلاع على الإشعارات والتنبيهات.">
                  <OwnerDashboardPage initialTab="notifications" />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>

      {/* Footer - Hidden on owner dashboard, control center, and authentication pages */}
      {!isOwnerRoute && !isAuthRoute && !isControlCenterRoute && <Footer />}

      {/* Mobile Bottom Navigation Bar - Only displayed on public student routes */}
      {!isOwnerRoute && !isAuthRoute && !isControlCenterRoute && <MobileBottomNav />}
    </div>
  );
};

export const App = () => {
  return (
    <AdminAuthProvider>
      <AuthProvider>
        <FavoritesProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </FavoritesProvider>
      </AuthProvider>
    </AdminAuthProvider>
  );
};

export default App;
