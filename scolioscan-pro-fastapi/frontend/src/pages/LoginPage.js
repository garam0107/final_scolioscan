import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ScolioscanLogo } from '../components/Logo';
import InputNormal from '../components/InputNormal';
import Button from '../components/Button';
import PasswordResetModal from '../components/PasswordResetModal';
import RegisterModal from '../components/RegisterModal';
import introImage1 from '../assets/icons/Onboarding/intro1.png';
import introImage2 from '../assets/icons/Onboarding/intro2.png';
import introImage3 from '../assets/icons/Onboarding/intro3.png';
import './OnboardingPage.css';

const ONBOARDING_STORAGE_KEY = 'scolioscan_has_logged_in';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    user_id: '',
    user_pw: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPasswordResetModalOpen, setIsPasswordResetModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useLanguage();

  // Refs for back button handler (to avoid re-registering on every state change)
  const stateRef = useRef({
    showOnboarding: false,
    currentSlide: 0,
    isPasswordResetModalOpen: false,
    isRegisterModalOpen: false
  });

  // Keep refs in sync with state
  useEffect(() => {
    stateRef.current = {
      showOnboarding,
      currentSlide,
      isPasswordResetModalOpen,
      isRegisterModalOpen
    };
  }, [showOnboarding, currentSlide, isPasswordResetModalOpen, isRegisterModalOpen]);

  // 온보딩 슬라이드 데이터
  const slides = [
    {
      title: t('onboarding.slide1Title'),
      content: t('onboarding.slide1Content'),
      image: introImage1
    },
    {
      title: t('onboarding.slide2Title'),
      content: t('onboarding.slide2Content'),
      image: introImage2
    },
    {
      title: t('onboarding.slide3Title'),
      content: t('onboarding.slide3Content'),
      image: introImage3
    }
  ];

  // 첫 방문 시 온보딩 표시 여부 확인
  useEffect(() => {
    const hasLoggedInBefore = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!hasLoggedInBefore) {
      setShowOnboarding(true);
    }
  }, []);

  // 페이지별 오버레이 핸들러 등록 (App.js의 글로벌 handleBackButton에서 호출됨)
  useEffect(() => {
    window._pageOverlayHandler = () => {
      const state = stateRef.current;

      // 온보딩이 표시 중인 경우
      if (state.showOnboarding) {
        if (state.currentSlide > 0) {
          setCurrentSlide(prev => prev - 1);
          return true;
        }
        return false;
      }

      // 비밀번호 찾기 모달이 열려있는 경우
      if (state.isPasswordResetModalOpen) {
        setIsPasswordResetModalOpen(false);
        return true;
      }

      // 회원가입 모달이 열려있는 경우
      if (state.isRegisterModalOpen) {
        setIsRegisterModalOpen(false);
        return true;
      }

      return false;
    };

    return () => {
      delete window._pageOverlayHandler;
    };
  }, []);

  // 스와이프 핸들러
  const handlers = useSwipeable({
    onSwipedLeft: () => handleNextSlide(),
    onSwipedRight: () => handlePrevSlide(),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });

  const handleNextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      // 마지막 슬라이드에서 넘기면 온보딩 종료
      setShowOnboarding(false);
    }
  };

  const handlePrevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleEmailChange = (value) => {
    setFormData({
      ...formData,
      user_id: value
    });
    setError('');
  };

  const handlePasswordChange = (value) => {
    setFormData({
      ...formData,
      user_pw: value
    });
    setError('');
  };

  const handleEmailClear = () => {
    setFormData({
      ...formData,
      user_id: ''
    });
  };

  const handlePasswordClear = () => {
    setFormData({
      ...formData,
      user_pw: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 빈칸 유효성 검사
    if (!formData.user_id.trim()) {
      setError(t('login.emailRequired'));
      return;
    }
    if (!formData.user_pw.trim()) {
      setError(t('login.passwordRequired'));
      return;
    }

    setLoading(true);

    try {
      await login(formData);
      // 로그인 성공 시 플래그 저장 (다음 방문 시 온보딩 스킵)
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      navigate('/home');
    } catch (error) {
      setError(error.response?.data?.detail || t('login.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = () => {
    setIsPasswordResetModalOpen(true);
  };

  const handleSignup = () => {
    setIsRegisterModalOpen(true);
  };

  const currentSlideData = slides[currentSlide];

  // 온보딩 화면 표시
  if (showOnboarding) {
    return (
      <div className="onboarding-page" {...handlers}>
        <div className="onboarding-container">
          <div className="onboarding-logo">
            <div className="logo-text">Scolioscan</div>
          </div>

          <div className="onboarding-card">
            <div className="slide-image">
              {currentSlideData.image && (
                <img
                  src={currentSlideData.image}
                  alt={currentSlideData.title}
                  className="intro-image"
                  onError={(e) => {
                    console.error('Image failed to load:', currentSlideData.image);
                    e.target.style.display = 'none';
                  }}
                />
              )}
            </div>

            <div className="slide-text-content">
              <h1 className="slide-title">{currentSlideData.title}</h1>
              {Array.isArray(currentSlideData.content) ? (
                <div className="slide-content-list">
                  {currentSlideData.content.map((line, index) => (
                    <p key={index} className="slide-content-line">{line}</p>
                  ))}
                </div>
              ) : (
                <p className="slide-content">{currentSlideData.content}</p>
              )}
            </div>
          </div>

          <div className="slide-indicators">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`indicator ${index === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>

          <div className="slide-navigation">
            {currentSlide > 0 && (
              <button className="nav-button nav-prev" onClick={handlePrevSlide}>
                {t('common.prev')}
              </button>
            )}
            <div className="nav-spacer" />
            <button className="nav-button nav-next" onClick={handleNextSlide}>
              {t('common.next')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
      <div className="flex flex-col items-center w-full max-w-[296px]">
        {/* Logo */}
        <div className="mb-4">
          <ScolioscanLogo width={60} height={60} />
        </div>

        {/* Brand Name */}
        <h1
          className="text-[32px] font-bold text-[#7AD7D4] mb-2"
          style={{ fontFamily: 'MuseoModerno, sans-serif' }}
        >
          Scolioscan
        </h1>

        {/* Tagline */}
        <p className="text-16r text-gray-500 mb-10 text-center">
          {t('login.subtitle')}
        </p>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          {/* Error Message */}
          {error && (
            <div className="w-full px-4 py-3 bg-red-50 border border-red-400 rounded-md">
              <p className="text-14r text-red-400">{error}</p>
            </div>
          )}

          {/* Email Input */}
          <InputNormal
            type="email"
            value={formData.user_id}
            placeholder={t('login.emailPlaceholder')}
            disabled={loading}
            onChange={handleEmailChange}
            onClear={handleEmailClear}
          />

          {/* Password Input */}
          <InputNormal
            type="password"
            value={formData.user_pw}
            placeholder={t('login.passwordPlaceholder')}
            disabled={loading}
            onChange={handlePasswordChange}
            onClear={handlePasswordClear}
          />

          {/* Login Button */}
          <Button
            type="submit"
            variant="filled"
            color="primary"
            size="big"
            disabled={loading}
            loading={loading}
            className="w-full mt-2"
          >
            {t('login.loginButton')}
          </Button>

          {/* Password Reset Button */}
          <Button
            type="button"
            variant="text"
            size="regular"
            onClick={handlePasswordReset}
            disabled={loading}
            className="w-full"
          >
            {t('login.forgotPassword')}
          </Button>

          {/* Signup Button */}
          <Button
            type="button"
            variant="filled"
            color="gray"
            size="big"
            onClick={handleSignup}
            disabled={loading}
            className="w-[216px] self-center mt-10"
          >
            {t('login.signup')}
          </Button>
        </form>
      </div>

      {/* Modals */}
      <PasswordResetModal
        isOpen={isPasswordResetModalOpen}
        onClose={() => setIsPasswordResetModalOpen(false)}
      />
      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
      />
    </div>
  );
};

export default LoginPage;
