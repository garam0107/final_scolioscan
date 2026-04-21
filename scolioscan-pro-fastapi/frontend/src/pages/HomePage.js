import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import BannerSlider from '../components/BannerSlider';
import BottomMenu from '../components/BottomMenu';
import SideMenu from '../components/SideMenu';
import AlarmPanel from '../components/AlarmPanel';
import { alarmAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import BannerImage1 from '../assets/images/BannerImage1.png';
import BannerImage2 from '../assets/images/BannerImage2.png';
import Hospital1 from '../assets/icons/Home/Hospital1.png';
import Hospital2 from '../assets/icons/Home/Hospital2.png';

// 온보딩 이미지 (척추측만증이란?, 스콜리오스캔 사용법)
import introImage1 from '../assets/icons/Onboarding/intro1.png';
import introImage2 from '../assets/icons/Onboarding/intro2.png';
import introImage3 from '../assets/icons/Onboarding/intro3.png';
import './OnboardingPage.css';

// Home 전용 아이콘 - 2D 이미지 측정
import Icon2D_Vector1 from '../assets/icons/Home/Icon2D_Vector1.svg';
import Icon2D_Vector2 from '../assets/icons/Home/Icon2D_Vector2.svg';
import Icon2D_Vector3 from '../assets/icons/Home/Icon2D_Vector3.svg';
import Icon2D_Vector4 from '../assets/icons/Home/Icon2D_Vector4.svg';
import Icon2D_Group from '../assets/icons/Home/Icon2D_Group.svg';
import Icon2D_Vector5 from '../assets/icons/Home/Icon2D_Vector5.svg';
import Icon2D_Vector6 from '../assets/icons/Home/Icon2D_Vector6.svg';
import Icon2D_Vector7 from '../assets/icons/Home/Icon2D_Vector7.svg';

// Home 전용 아이콘 - 3D 동영상 측정
import Icon3D_1 from '../assets/icons/Home/Icon3D_1.svg';
import Icon3D_2 from '../assets/icons/Home/Icon3D_2.svg';
import Icon3D_3 from '../assets/icons/Home/Icon3D_3.svg';
import Icon3D_4 from '../assets/icons/Home/Icon3D_4.svg';
import Icon3D_5 from '../assets/icons/Home/Icon3D_5.svg';
import Icon3D_6 from '../assets/icons/Home/Icon3D_6.svg';
import Icon3D_7 from '../assets/icons/Home/Icon3D_7.svg';
import Icon3D_8 from '../assets/icons/Home/Icon3D_8.svg';
import Icon3D_9 from '../assets/icons/Home/Icon3D_9.svg';
import Icon3D_10 from '../assets/icons/Home/Icon3D_10.svg';
import Icon3D_11 from '../assets/icons/Home/Icon3D_11.svg';
import Icon3D_12 from '../assets/icons/Home/Icon3D_12.svg';

// Home 전용 아이콘 - 척추측만계 측정
import IconScoliometer_1 from '../assets/icons/Home/IconScoliometer_1.svg';
import IconScoliometer_2 from '../assets/icons/Home/IconScoliometer_2.svg';

// 로컬 아이콘 에셋 매핑 (피그마 디자인 기반)
const imgVector12 = Icon2D_Vector1;
const imgVector13 = Icon2D_Vector2;
const imgVector14 = Icon2D_Vector3;
const imgVector15 = Icon2D_Vector4;
const imgGroup1 = Icon2D_Group;
const imgVector16 = Icon2D_Vector5;
const imgVector17 = Icon2D_Vector6;
const imgVector18 = Icon2D_Vector7;

const imgVector = Icon3D_1;
const imgVector1 = Icon3D_2;
const imgVector2 = Icon3D_3;
const imgVector3 = Icon3D_4;
const imgVector4 = Icon3D_5;
const imgVector5 = Icon3D_6;
const imgVector6 = Icon3D_7;
const imgVector7 = Icon3D_8;
const imgVector8 = Icon3D_9;
const imgVector9 = Icon3D_10;
const imgVector10 = Icon3D_11;
const imgVector11 = Icon3D_12;

const imgGroup = IconScoliometer_1;
const imgSubtract = IconScoliometer_2;

// 아이콘 컴포넌트들 (피그마 디자인 기반)
const IconHomemenu1 = ({ className = "", style = {} }) => {
  return (
    <div className={`overflow-clip relative shrink-0 size-[60px] ${className}`} style={style}>
      <div className="absolute inset-[25.19%_69.35%_67.6%_21.93%]">
        <img alt="" className="block max-w-none size-full" src={imgVector12} />
      </div>
      <div className="absolute inset-[22%_14.83%_22.23%_14.83%]">
        <img alt="" className="block max-w-none size-full" src={imgVector13} />
      </div>
      <div className="absolute inset-[35.38%_20.85%_57.58%_72.12%]">
        <div className="absolute inset-[-32.77%]">
          <img alt="" className="block max-w-none size-full" src={imgVector14} />
        </div>
      </div>
      <div className="absolute inset-[22%_53.03%_22.23%_14.83%] mix-blend-multiply">
        <img alt="" className="block max-w-none size-full" src={imgVector15} />
      </div>
      <div className="absolute inset-[39.01%_35.44%_25.36%_28.93%] mix-blend-multiply">
        <div className="absolute inset-[-2.16%_-2.16%_-2.15%_-2.16%]">
          <img alt="" className="block max-w-none size-full" src={imgGroup1} />
        </div>
      </div>
      <div className="absolute bottom-[27.69%] left-[32.08%] right-1/2 top-[36.46%]">
        <img alt="" className="block max-w-none size-full" src={imgVector16} />
      </div>
      <div className="absolute inset-[36.46%_32.08%_27.69%_32.08%]">
        <img alt="" className="block max-w-none size-full" src={imgVector17} />
      </div>
      <div className="absolute inset-[42.72%_38.35%_33.95%_38.32%]">
        <img alt="" className="block max-w-none size-full" src={imgVector18} />
      </div>
    </div>
  );
};

const IconHomemenu = ({ className = "", style = {} }) => {
  return (
    <div className={`overflow-clip relative shrink-0 size-[60px] ${className}`} style={style}>
      <div className="absolute inset-[39.35%_5%_15.9%_8.96%]">
        <img alt="" className="block max-w-none size-full" src={imgVector} />
      </div>
      <div className="absolute inset-[18.33%_52.07%_60.94%_27.2%]">
        <img alt="" className="block max-w-none size-full" src={imgVector1} />
      </div>
      <div className="absolute inset-[19.25%_55.36%_60.94%_27.2%] mix-blend-multiply">
        <img alt="" className="block max-w-none size-full" src={imgVector2} />
      </div>
      <div className="absolute inset-[12.57%_25.61%_60.94%_47.9%]">
        <img alt="" className="block max-w-none size-full" src={imgVector3} />
      </div>
      <div className="absolute inset-[13.74%_29.81%_15.9%_34.92%] mix-blend-multiply">
        <img alt="" className="block max-w-none size-full" src={imgVector4} />
      </div>
      <div className="absolute inset-[39.04%_27.11%_26.65%_21.38%]">
        <img alt="" className="block max-w-none size-full" src={imgVector5} />
      </div>
      <div className="absolute inset-[39.04%_27.11%_26.65%_21.38%] mix-blend-multiply">
        <img alt="" className="block max-w-none size-full" src={imgVector6} />
      </div>
      <div className="absolute inset-[24.47%_58.21%_67.08%_33.33%]">
        <img alt="" className="block max-w-none size-full" src={imgVector7} />
      </div>
      <div className="absolute inset-[19.67%_32.71%_68.04%_55%]">
        <img alt="" className="block max-w-none size-full" src={imgVector8} />
      </div>
      <div className="absolute inset-[46.26%_34.29%_38.82%_50.8%]">
        <img alt="" className="block max-w-none size-full" src={imgVector9} />
      </div>
      <div className="absolute inset-[46.26%_45.47%_38.82%_50.8%] mix-blend-multiply">
        <img alt="" className="block max-w-none size-full" src={imgVector10} />
      </div>
      <div className="absolute inset-[46.76%_5%_26.96%_72.89%] mix-blend-multiply">
        <img alt="" className="block max-w-none size-full" src={imgVector11} />
      </div>
    </div>
  );
};

const IconHomemenu2 = ({ className = "", style = {} }) => {
  const size = style.width || '60px';
  const sizeValue = typeof size === 'string' ? parseInt(size) : size;
  
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size, ...style }}>
      <div className="absolute flex inset-[3.45%_9.41%_5.74%_23.73%] items-center justify-center">
        <div 
          className="flex-none rotate-[180deg] scale-y-[-100%]"
          style={{
            height: `${(54.489 / 60) * sizeValue}px`,
            width: `${(40.115 / 60) * sizeValue}px`
          }}
        >
          <div className="relative size-full">
            <img alt="" className="block max-w-none size-full" src={imgGroup} />
          </div>
        </div>
      </div>
      <div 
        className="absolute flex items-center justify-center mix-blend-multiply"
        style={{
          height: `${(54.489 / 60) * sizeValue}px`,
          left: `${(30.7 / 60) * sizeValue}px`,
          top: `${(2.07 / 60) * sizeValue}px`,
          width: `${(10.672 / 60) * sizeValue}px`
        }}
      >
        <div className="flex-none rotate-[180deg] scale-y-[-100%]">
          <div 
            className="relative"
            style={{
              height: `${(54.489 / 60) * sizeValue}px`,
              width: `${(10.672 / 60) * sizeValue}px`
            }}
          >
            <img alt="" className="block max-w-none size-full" src={imgSubtract} />
          </div>
        </div>
      </div>
    </div>
  );
};

// 측정 카드 컴포넌트
const MeasurementCard = ({ title, subtitle, icon, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="bg-white flex items-center justify-between px-5 py-4 rounded-xl shadow-[0px_0px_16px_0px_rgba(0,0,0,0.04)] w-full hover:shadow-lg transition-shadow"
    >
      <div className="flex flex-col gap-1 items-start">
        <h3 className="text-18b text-gray-900 leading-6">{title}</h3>
        <div className="bg-mint-25 px-2 py-1 rounded-[5px]">
          <p className="text-13r text-mint-600 leading-[18px]">{subtitle}</p>
        </div>
      </div>
      {icon}
    </button>
  );
};

// 병원 카드 컴포넌트
const HospitalCard = ({ name, specialty, image }) => {
  return (
    <div className="flex flex-col gap-[10px] flex-1 min-w-[150px]">
      <div className="aspect-[160/132] opacity-90 rounded-xl overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex flex-col">
        <p className="text-14sb text-gray-900 leading-5">{name}</p>
        <p className="text-13m text-mint-600 leading-[18px]">{specialty}</p>
      </div>
    </div>
  );
};

// 정보 카드 컴포넌트 (척추측만증이란?, 스콜리오스캔 사용법)
const InfoCard = ({ title, subtitle, image, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-[10px] flex-1 min-w-[150px] text-left"
    >
      <div className="aspect-[160/132] rounded-xl overflow-hidden bg-gradient-to-b from-[#d7f9f9] to-[#f6fefe] flex items-center justify-center">
        <img
          src={image}
          alt={title}
          className="w-[80px] h-[80px] object-contain"
        />
      </div>
      <div className="flex flex-col">
        <p className="text-14sb text-gray-900 leading-5">{title}</p>
        <p className="text-13m text-mint-600 leading-[18px]">{subtitle}</p>
      </div>
    </button>
  );
};

// 정보 모달 컴포넌트 (척추측만증이란?, 스콜리오스캔 사용법)
const InfoModal = ({ isOpen, onClose, title, content, image, closeText }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Dim 배경 */}
      <div
        className="fixed inset-0 bg-[rgba(66,66,66,0.4)] backdrop-blur-[5px] z-50"
        onClick={onClose}
      />
      {/* 모달 카드 */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[300px]">
        <div
          className="rounded-[24px] px-[20px] py-[24px] flex flex-col gap-[20px] items-center"
          style={{
            background: 'linear-gradient(to bottom, #d7f9f9 18.075%, #ffffff 55.095%)'
          }}
        >
          {/* 이미지 */}
          <div className="w-[180px] h-[180px] flex items-center justify-center">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-contain"
            />
          </div>

          {/* 텍스트 */}
          <div className="flex flex-col gap-[8px] items-center w-full">
            <h2 className="text-20b text-[#20797e] text-center leading-[28px]">
              {title}
            </h2>
            <div className="flex flex-col items-center">
              {content.map((line, index) => (
                <p key={index} className="text-14m text-[#20797e] text-center leading-[20px]">
                  {line}
                </p>
              ))}
            </div>
          </div>

          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="bg-[#2c9696] flex gap-[6px] h-[40px] items-center justify-center px-[14px] rounded-[6px]"
          >
            <p className="text-14m text-white leading-[20px]">
              {closeText}
            </p>
          </button>
        </div>
      </div>
    </>
  );
};

// 측정 준비중 모달 컴포넌트
const MeasurementModal = ({ isOpen, onClose, title, icon, preparingText, waitText, goHomeText }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Dim 배경 */}
      <div
        className="fixed inset-0 bg-[rgba(66,66,66,0.4)] backdrop-blur-[5px] z-50"
        onClick={onClose}
      />
      {/* 모달 카드 */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[264px]">
        <div
          className="rounded-[24px] px-[20px] py-[24px] flex flex-col gap-[32px] items-center"
          style={{
            background: 'linear-gradient(to bottom, #d6fffe 18.075%, #ffffff 55.095%)'
          }}
        >
          {/* 아이콘과 텍스트 섹션 */}
          <div className="flex flex-col gap-[16px] items-center w-full">
            {/* 아이콘 */}
            <div className="relative shrink-0 size-[120px] overflow-clip">
              {icon}
            </div>

            {/* 텍스트 */}
            <div className="flex flex-col gap-[8px] items-center w-full">
              <div className="text-18sb text-mint-500 text-center leading-[24px] whitespace-pre-line">
                {title}{preparingText}
              </div>
              <p className="text-15m text-gray-600 text-center leading-[20px]">
                {waitText}
              </p>
            </div>
          </div>

          {/* 버튼 */}
          <button
            onClick={onClose}
            className="bg-[#2c9696] box-border content-stretch flex gap-[6px] h-[40px] items-center justify-center px-[14px] py-0 relative rounded-[6px] shrink-0"
          >
            <p className="text-14m text-white leading-[20px] whitespace-pre">
              {goHomeText}
            </p>
          </button>
        </div>
      </div>
    </>
  );
};

const HomePage = () => {
  const [alarmPanelOpen, setAlarmPanelOpen] = useState(false);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [alarmCount, setAlarmCount] = useState(0);
  const [bannerImage, setBannerImage] = useState(BannerImage1);
  const [measurementModalOpen, setMeasurementModalOpen] = useState(false);
  const [selectedMeasurement, setSelectedMeasurement] = useState(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState(null);
  const [show2DOnboarding, setShow2DOnboarding] = useState(false);
  const [onboardingSlide, setOnboardingSlide] = useState(0);
  const [showScolioOnboarding, setShowScolioOnboarding] = useState(false);
  const [scolioOnboardingSlide, setScolioOnboardingSlide] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  // Refs for back button handler (to avoid re-registering on every state change)
  const stateRef = useRef({
    show2DOnboarding: false,
    onboardingSlide: 0,
    showScolioOnboarding: false,
    scolioOnboardingSlide: 0,
    measurementModalOpen: false,
    infoModalOpen: false,
    alarmPanelOpen: false,
    sideMenuOpen: false
  });

  // Keep refs in sync with state
  useEffect(() => {
    stateRef.current = {
      show2DOnboarding,
      onboardingSlide,
      showScolioOnboarding,
      scolioOnboardingSlide,
      measurementModalOpen,
      infoModalOpen,
      alarmPanelOpen,
      sideMenuOpen
    };
  }, [show2DOnboarding, onboardingSlide, showScolioOnboarding, scolioOnboardingSlide, measurementModalOpen, infoModalOpen, alarmPanelOpen, sideMenuOpen]);

  // 2D 측정 온보딩 슬라이드 데이터
  const measurement2DSlides = [
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

  // 척추측만계 온보딩 슬라이드 데이터
  const scoliometerSlides = [
    {
      title: t('scoliometer.slide1Title'),
      content: t('scoliometer.slide1Content'),
      image: introImage1
    },
    {
      title: t('scoliometer.slide2Title'),
      content: t('scoliometer.slide2Content'),
      image: introImage2
    },
    {
      title: t('scoliometer.slide3Title'),
      content: t('scoliometer.slide3Content'),
      image: introImage3
    }
  ];

  // 정보 데이터 (척추측만증이란?, 스콜리오스캔 사용법)
  const infoData = {
    scoliosis: {
      title: t('home.whatIsScoliosis'),
      subtitle: t('home.learnScoliosis'),
      content: t('onboarding.slide1Content'),
      image: introImage1
    },
    usage: {
      title: t('home.howToUse'),
      subtitle: t('home.learnHowToUse'),
      content: t('onboarding.slide3Content'),
      image: introImage3
    }
  };

  const handleInfoClick = (type) => {
    const info = infoData[type];
    if (info) {
      setSelectedInfo(info);
      setInfoModalOpen(true);
    }
  };

  useEffect(() => {
    loadAlarmCount();
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 페이지별 오버레이 핸들러 등록 (App.js의 글로벌 handleBackButton에서 호출됨)
  useEffect(() => {
    window._pageOverlayHandler = () => {
      const state = stateRef.current;

      // 2D 온보딩이 열려있는 경우
      if (state.show2DOnboarding) {
        if (state.onboardingSlide > 0) {
          setOnboardingSlide(prev => prev - 1);
        } else {
          setShow2DOnboarding(false);
          setOnboardingSlide(0);
        }
        return true;
      }

      // 척추측만계 온보딩이 열려있는 경우
      if (state.showScolioOnboarding) {
        if (state.scolioOnboardingSlide > 0) {
          setScolioOnboardingSlide(prev => prev - 1);
        } else {
          setShowScolioOnboarding(false);
          setScolioOnboardingSlide(0);
        }
        return true;
      }

      // 측정 모달이 열려있는 경우
      if (state.measurementModalOpen) {
        setMeasurementModalOpen(false);
        setSelectedMeasurement(null);
        return true;
      }

      // 정보 모달이 열려있는 경우
      if (state.infoModalOpen) {
        setInfoModalOpen(false);
        setSelectedInfo(null);
        return true;
      }

      // 알람 패널이 열려있는 경우
      if (state.alarmPanelOpen) {
        setAlarmPanelOpen(false);
        return true;
      }

      // 사이드 메뉴가 열려있는 경우
      if (state.sideMenuOpen) {
        setSideMenuOpen(false);
        return true;
      }

      return false;
    };

    return () => {
      delete window._pageOverlayHandler;
    };
  }, []);

  const handleResize = () => {
    if (window.innerWidth >= 410) {
      setBannerImage(BannerImage2);
    } else {
      setBannerImage(BannerImage1);
    }
  };

  const loadAlarmCount = async () => {
    try {
      const response = await alarmAPI.getUnreadCount();
      setAlarmCount(response.data.count);
    } catch (error) {
      console.error('Failed to load alarm count:', error);
    }
  };

  // JWT 토큰 가져오기 (sessionStorage 먼저 확인 - 관리자 모니터링용)
  const getJwtToken = useCallback(() => {
    return sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
  }, []);

  // Android/iOS 앱 체크
  const isNativeApp = useCallback(() => {
    return !!(window.Android || window.webkit?.messageHandlers?.iOS);
  }, []);

  // 2D 카메라 열기 (Android/iOS 앱에서 호출)
  const open2DCamera = useCallback(() => {
    const token = getJwtToken();

    if (window.Android?.open2DCamera) {
      window.Android.open2DCamera(token || '');
      return true;
    } else if (window.webkit?.messageHandlers?.iOS?.postMessage) {
      const message = {
        action: 'open2DCamera',
        token: token || ''
      };
      try {
        window.webkit.messageHandlers.iOS.postMessage(message);
        return true;
      } catch (e) {
        return false;
      }
    } else {
      return false;
    }
  }, [getJwtToken]);

  // 2D 온보딩 다음 슬라이드
  const handleOnboardingNext = useCallback(() => {
    const currentSlide = stateRef.current.onboardingSlide;

    if (currentSlide < measurement2DSlides.length - 1) {
      setOnboardingSlide(currentSlide + 1);
    } else {
      // 마지막 슬라이드에서 다음 누르면 온보딩 종료 후 카메라 열기
      setShow2DOnboarding(false);
      setOnboardingSlide(0);

      // JavaScript Interface 호출 - 상태 업데이트 후 약간의 지연을 두고 실행
      setTimeout(() => {
        if (isNativeApp()) {
          const success = open2DCamera();
          if (!success) {
            setSelectedMeasurement({
              title: '2D 이미지 측정',
              icon: <IconHomemenu1 className="overflow-clip relative shrink-0" style={{ width: '120px', height: '120px' }} />
            });
            setMeasurementModalOpen(true);
          }
        } else {
          setSelectedMeasurement({
            title: '2D 이미지 측정',
            icon: <IconHomemenu1 className="overflow-clip relative shrink-0" style={{ width: '120px', height: '120px' }} />
          });
          setMeasurementModalOpen(true);
        }
      }, 50);
    }
  }, [isNativeApp, open2DCamera, measurement2DSlides.length]);

  // 2D 온보딩 이전 슬라이드
  const handleOnboardingPrev = useCallback(() => {
    const currentSlide = stateRef.current.onboardingSlide;
    if (currentSlide > 0) {
      setOnboardingSlide(currentSlide - 1);
    } else {
      // 첫 번째 슬라이드에서 이전 누르면 홈 화면으로 돌아가기
      setShow2DOnboarding(false);
      setOnboardingSlide(0);
    }
  }, []);

  // 2D 온보딩 스와이프 핸들러
  const onboardingSwipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (stateRef.current.show2DOnboarding) {
        handleOnboardingNext();
      }
    },
    onSwipedRight: () => {
      if (stateRef.current.show2DOnboarding) {
        handleOnboardingPrev();
      }
    },
    preventScrollOnSwipe: true,
    trackMouse: true
  });

  // 척추측만계 열기 (Android/iOS 앱에서 호출)
  const openScoliometer = useCallback(() => {
    const token = getJwtToken();

    if (window.Android?.openScoliometer) {
      window.Android.openScoliometer(token || '');
      return true;
    } else if (window.webkit?.messageHandlers?.iOS?.postMessage) {
      const message = {
        action: 'openScoliometer',
        token: token || ''
      };
      try {
        window.webkit.messageHandlers.iOS.postMessage(message);
        return true;
      } catch (e) {
        return false;
      }
    } else {
      return false;
    }
  }, [getJwtToken]);

  // 척추측만계 온보딩 다음 슬라이드
  const handleScolioOnboardingNext = useCallback(() => {
    const currentSlide = stateRef.current.scolioOnboardingSlide;

    if (currentSlide < scoliometerSlides.length - 1) {
      setScolioOnboardingSlide(currentSlide + 1);
    } else {
      // 마지막 슬라이드에서 다음 누르면 온보딩 종료 후 측정 시작
      setShowScolioOnboarding(false);
      setScolioOnboardingSlide(0);

      // JavaScript Interface 호출 - 상태 업데이트 후 약간의 지연을 두고 실행
      setTimeout(() => {
        if (isNativeApp()) {
          const success = openScoliometer();
          if (!success) {
            setSelectedMeasurement({
              title: '척추측만계 측정',
              icon: <IconHomemenu2 className="overflow-clip relative shrink-0" style={{ width: '120px', height: '120px' }} />
            });
            setMeasurementModalOpen(true);
          }
        } else {
          setSelectedMeasurement({
            title: '척추측만계 측정',
            icon: <IconHomemenu2 className="overflow-clip relative shrink-0" style={{ width: '120px', height: '120px' }} />
          });
          setMeasurementModalOpen(true);
        }
      }, 50);
    }
  }, [isNativeApp, openScoliometer, scoliometerSlides.length]);

  // 척추측만계 온보딩 이전 슬라이드
  const handleScolioOnboardingPrev = useCallback(() => {
    const currentSlide = stateRef.current.scolioOnboardingSlide;
    if (currentSlide > 0) {
      setScolioOnboardingSlide(currentSlide - 1);
    } else {
      // 첫 번째 슬라이드에서 이전 누르면 홈 화면으로 돌아가기
      setShowScolioOnboarding(false);
      setScolioOnboardingSlide(0);
    }
  }, []);

  // 척추측만계 온보딩 스와이프 핸들러
  const scolioOnboardingSwipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (stateRef.current.showScolioOnboarding) {
        handleScolioOnboardingNext();
      }
    },
    onSwipedRight: () => {
      if (stateRef.current.showScolioOnboarding) {
        handleScolioOnboardingPrev();
      }
    },
    preventScrollOnSwipe: true,
    trackMouse: true
  });

  const handleMeasurementClick = (type) => {
    const measurements = {
      '2d': {
        title: '2D 이미지 측정',
        icon: <IconHomemenu1 className="overflow-clip relative shrink-0" style={{ width: '120px', height: '120px' }} />
      },
      '3d': {
        title: '3D 동영상 측정',
        icon: <IconHomemenu className="overflow-clip relative shrink-0" style={{ width: '120px', height: '120px' }} />
      },
      'device': {
        title: '척추측만계 측정',
        icon: <IconHomemenu2 className="overflow-clip relative shrink-0" style={{ width: '120px', height: '120px' }} />
      }
    };

    // 2D 측정인 경우 온보딩 슬라이드 표시
    if (type === '2d') {
      // 다른 온보딩 상태 먼저 초기화
      setShowScolioOnboarding(false);
      setScolioOnboardingSlide(0);
      // 2D 온보딩 시작
      setOnboardingSlide(0);
      setShow2DOnboarding(true);
      return;
    }

    // 척추측만계 측정인 경우 온보딩 슬라이드 표시
    if (type === 'device') {
      // 다른 온보딩 상태 먼저 초기화
      setShow2DOnboarding(false);
      setOnboardingSlide(0);
      // 척추측만계 온보딩 시작
      setScolioOnboardingSlide(0);
      setShowScolioOnboarding(true);
      return;
    }

    // 3D 측정인 경우 모달 표시
    const measurement = measurements[type];
    if (measurement) {
      setSelectedMeasurement(measurement);
      setMeasurementModalOpen(true);
    }
  };

  const bannerItems = [
    {
      id: '1',
      content: (
        <div className="h-full w-full relative">
          <img
            src={bannerImage}
            alt="Banner 1"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      ),
    },
    {
      id: '2',
      content: (
        <div className="h-full w-full relative">
          <img
            src={bannerImage}
            alt="Banner 2"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      ),
    },
    {
      id: '3',
      content: (
        <div className="h-full w-full relative">
          <img
            src={bannerImage}
            alt="Banner 3"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      ),
    },
  ];

  // 2D 측정 온보딩 표시
  if (show2DOnboarding) {
    const currentSlideData = measurement2DSlides[onboardingSlide];
    return (
      <div className="onboarding-page" {...onboardingSwipeHandlers}>
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
            {measurement2DSlides.map((_, index) => (
              <div
                key={index}
                className={`indicator ${index === onboardingSlide ? 'active' : ''}`}
                onClick={() => setOnboardingSlide(index)}
              />
            ))}
          </div>

          <div className="slide-navigation">
            <button className="nav-button nav-prev" onClick={handleOnboardingPrev}>
              {t('common.prev')}
            </button>
            <div className="nav-spacer" />
            <button className="nav-button nav-next" onClick={handleOnboardingNext}>
              {t('common.next')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 척추측만계 온보딩 표시
  if (showScolioOnboarding) {
    const currentSlideData = scoliometerSlides[scolioOnboardingSlide];
    return (
      <div className="onboarding-page" {...scolioOnboardingSwipeHandlers}>
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
            {scoliometerSlides.map((_, index) => (
              <div
                key={index}
                className={`indicator ${index === scolioOnboardingSlide ? 'active' : ''}`}
                onClick={() => setScolioOnboardingSlide(index)}
              />
            ))}
          </div>

          <div className="slide-navigation">
            <button className="nav-button nav-prev" onClick={handleScolioOnboardingPrev}>
              {t('common.prev')}
            </button>
            <div className="nav-spacer" />
            <button className="nav-button nav-next" onClick={handleScolioOnboardingNext}>
              {t('common.next')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col pb-20 pt-[70px]">
      {/* 헤더 */}
      <div className="fixed top-0 left-0 right-0 bg-gray-50 flex items-center justify-between p-5 z-40">
        <div className="h-6 w-[120px]">
          <h1
            className="text-[27px] font-bold text-mint-400 leading-normal tracking-[-0.27px]"
            style={{ fontFamily: 'MuseoModerno, sans-serif', marginTop: '-7px' }}
          >
            Scolioscan
          </h1>
        </div>
        <div className="flex gap-[14px] items-center">
          <button
            onClick={() => setAlarmPanelOpen(true)}
            className="relative w-7 h-7"
          >
            {/* Bell Icon */}
            <svg
              className="w-full h-full text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {/* Alarm Badge */}
            {alarmCount > 0 && (
              <div className="absolute right-0 top-0 bg-red-400 rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                <span className="text-white text-[10px] font-bold leading-none">
                  {alarmCount > 9 ? '9+' : alarmCount}
                </span>
              </div>
            )}
          </button>
          <button
            onClick={() => setSideMenuOpen(true)}
            className="w-7 h-7 text-gray-600"
          >
            {/* Hamburger Icon */}
            <svg
              className="w-full h-full"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex flex-col gap-4 px-5 w-full">
        {/* 척추검진 섹션 */}
        <div className="flex flex-col gap-3">
          <h2 className="text-16sb text-gray-800 leading-[22px]">
            {t('home.spineCheckup')}
          </h2>
          <div className="flex flex-col gap-[10px]">
            <MeasurementCard
              title={t('home.measurement2D')}
              subtitle={t('home.measurement2DDesc')}
              icon={<IconHomemenu1 />}
              onClick={() => handleMeasurementClick('2d')}
            />
            {/* <MeasurementCard
              title={t('home.measurement3D')}
              subtitle={t('home.measurement3DDesc')}
              icon={<IconHomemenu />}
              onClick={() => handleMeasurementClick('3d')}
            /> */}
            <MeasurementCard
              title={t('home.measurementDevice')}
              subtitle={t('home.measurementDeviceDesc')}
              icon={<IconHomemenu2 />}
              onClick={() => handleMeasurementClick('device')}
            />
          </div>
        </div>

        {/* 척추측만증이란? 섹션 */}
        <div className="flex flex-col gap-3">
          <h2 className="text-16sb text-gray-800 leading-[22px]">
            {t('home.whatIsScoliosis')}
          </h2>
          <div className="flex gap-2">
            <InfoCard
              title={t('home.whatIsScoliosis')}
              subtitle={t('home.learnScoliosis')}
              image={introImage1}
              onClick={() => handleInfoClick('scoliosis')}
            />
            <InfoCard
              title={t('home.howToUse')}
              subtitle={t('home.learnHowToUse')}
              image={introImage3}
              onClick={() => handleInfoClick('usage')}
            />
          </div>
        </div>

        {/* 병원 찾기 섹션 */}
        {/* <div className="flex flex-col gap-3">
          <h2 className="text-16sb text-gray-800 leading-[22px]">
            가까운 병원 찾기
          </h2>
          <div className="flex gap-2 overflow-x-auto">
            <HospitalCard
              name="판교퍼스트정형외과"
              specialty="평일 매일 20시 야간진료"
              image={Hospital1}
            />
            <HospitalCard
              name="더케어통증의학과"
              specialty="스포츠 손상 통증 전문"
              image={Hospital2}
            />
          </div>
        </div> */}

        {/* 배너 */}
        <div className="flex flex-col gap-3">
          <BannerSlider items={bannerItems} height="112px" />
        </div>
      </div>

      {/* AlarmPanel */}
      <AlarmPanel
        isOpen={alarmPanelOpen}
        onClose={() => setAlarmPanelOpen(false)}
      />

      {/* SideMenu */}
      <SideMenu
        isOpen={sideMenuOpen}
        onClose={() => setSideMenuOpen(false)}
      />

      {/* 측정 준비중 모달 */}
      {selectedMeasurement && (
        <MeasurementModal
          isOpen={measurementModalOpen}
          onClose={() => {
            setMeasurementModalOpen(false);
            setSelectedMeasurement(null);
          }}
          title={selectedMeasurement.title}
          icon={selectedMeasurement.icon}
          preparingText={t('home.preparingMeasurement')}
          waitText={t('home.waitPlease')}
          goHomeText={t('home.goHome')}
        />
      )}

      {/* 정보 모달 (척추측만증이란?, 스콜리오스캔 사용법) */}
      {selectedInfo && (
        <InfoModal
          isOpen={infoModalOpen}
          onClose={() => {
            setInfoModalOpen(false);
            setSelectedInfo(null);
          }}
          title={selectedInfo.title}
          content={selectedInfo.content}
          image={selectedInfo.image}
          closeText={t('common.close')}
        />
      )}

      {/* 하단 네비게이션 */}
      <BottomMenu />
    </div>
  );
};

export default HomePage;

