import React, { useEffect, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SignupProvider } from './contexts/SignupContext';
import { LanguageProvider } from './contexts/LanguageContext';

// Pages
import OnboardingPage from './pages/OnboardingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PasswordResetPage from './pages/PasswordResetPage';
import HomePage from './pages/HomePage';
import ReportPage from './pages/ReportPage';
import AnalysisPage from './pages/AnalysisPage';
import MeasurementListPage from './pages/MeasurementListPage';
import MorePage from './pages/MorePage';
import ProfileEditPage from './pages/ProfileEditPage';
import SubscriptionPage from './pages/SubscriptionPage';
import SettingsPage from './pages/SettingsPage';
import ContactPage from './pages/ContactPage';
import HospitalPage from './pages/HospitalPage';
import ShoppingPage from './pages/ShoppingPage';
import ImpersonatePage from './pages/ImpersonatePage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminCustomersPage from './pages/admin/AdminCustomersPage';
import AdminAnalysisPage from './pages/admin/AdminAnalysisPage';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Public Route Component (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  return !isAuthenticated ? children : <Navigate to="/home" />;
};

// Admin Route Component (requires admin role)
const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // is_admin 체크 (백엔드에서 사용자 정보에 is_admin 필드 필요)
  if (!user?.is_admin) {
    return <Navigate to="/home" />;
  }

  return children;
};

// 메인 탭 경로 (이 경로에서는 뒤로가기 시 종료 토스트 표시)
const MAIN_TAB_PATHS = ['/home', '/analysis', '/report', '/more'];

// 글로벌 뒤로가기 버튼 핸들러
// 1. 페이지별 오버레이 핸들러(_pageOverlayHandler)가 있으면 먼저 호출
// 2. 오버레이가 없고 서브페이지면 이전 페이지로 이동
// 3. 메인 탭이면 false 반환 → 네이티브 앱에서 종료 토스트 표시
const BackButtonHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationRef = useRef(location.pathname);

  useEffect(() => {
    locationRef.current = location.pathname;
  }, [location.pathname]);

  const handleBack = useCallback(() => {
    // 1. 페이지별 오버레이 핸들러 확인 (모달, 사이드 메뉴, 알림 패널 등)
    if (window._pageOverlayHandler) {
      const handled = window._pageOverlayHandler();
      if (handled) return true;
    }

    // 2. 메인 탭 페이지인지 확인
    const currentPath = locationRef.current;
    const isMainTab = MAIN_TAB_PATHS.some(p => currentPath === p);

    if (isMainTab) {
      // 메인 탭에서는 네이티브 앱에서 종료 토스트 처리
      return false;
    }

    // 3. 서브페이지에서는 이전 페이지로 이동
    navigate(-1);
    return true;
  }, [navigate]);

  useEffect(() => {
    window.handleBackButton = handleBack;
    // 글로벌 핸들러는 cleanup하지 않음 - 항상 존재해야 함
  }, [handleBack]);

  return null;
};

function AppRoutes() {
  return (
    <>
      <BackButtonHandler />
      <Routes>
      {/* Public routes */}
      <Route path="/" element={<OnboardingPage />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route
        path="/password-reset"
        element={
          <PublicRoute>
            <PasswordResetPage />
          </PublicRoute>
        }
      />
      <Route path="/impersonate" element={<ImpersonatePage />} />

      {/* Protected routes */}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/report"
        element={
          <ProtectedRoute>
            <ReportPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analysis"
        element={
          <ProtectedRoute>
            <AnalysisPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analysis/list"
        element={
          <ProtectedRoute>
            <MeasurementListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hospital"
        element={
          <ProtectedRoute>
            <HospitalPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shopping"
        element={
          <ProtectedRoute>
            <ShoppingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/more"
        element={
          <ProtectedRoute>
            <MorePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/edit"
        element={
          <ProtectedRoute>
            <ProfileEditPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/subscription"
        element={
          <ProtectedRoute>
            <SubscriptionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/contact"
        element={
          <ProtectedRoute>
            <ContactPage />
          </ProtectedRoute>
        }
      />

      {/* Admin routes */}
      <Route
        path="/adm"
        element={
          <AdminRoute>
            <AdminDashboardPage />
          </AdminRoute>
        }
      />
      <Route
        path="/adm/customers"
        element={
          <AdminRoute>
            <AdminCustomersPage />
          </AdminRoute>
        }
      />
      <Route
        path="/adm/analysis"
        element={
          <AdminRoute>
            <AdminAnalysisPage />
          </AdminRoute>
        }
      />
    </Routes>
    </>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <SignupProvider>
          <Router>
            <AppRoutes />
          </Router>
        </SignupProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
