import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { userAPI } from '../utils/api';
import BannerSlider from '../components/BannerSlider';
import BottomMenu from '../components/BottomMenu';
import BannerImage1 from '../assets/images/BannerImage1.png';
import BannerImage2 from '../assets/images/BannerImage2.png';
import UserEdit from '../assets/icons/My/UserEdit.svg';
import Crown from '../assets/icons/My/Crown.svg';
import Setting from '../assets/icons/My/Setting.svg';
import MessageQuestion from '../assets/icons/My/MessageQuestion.svg';
import ChevronRight from '../assets/icons/My/ChevronRight.svg';
import AppIcon1 from '../assets/icons/My/AppIcon1.png';
import AppIcon2 from '../assets/icons/My/AppIcon2.png';
import AppIcon3 from '../assets/icons/My/AppIcon3.png';
import AppIcon4 from '../assets/icons/My/AppIcon4.png';

const MorePage = () => {
  const [profileImage, setProfileImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [bannerImage, setBannerImage] = useState(BannerImage1);
  const { user, logout, updateUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // 사용자 프로필 이미지 로드
  useEffect(() => {
    if (user?.profile_image) {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const imageUrl = `${API_BASE_URL.replace('/api', '')}${user.profile_image}`;
      setProfileImage(imageUrl);
    }
  }, [user]);

  // 배너 이미지 사이즈 조정
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 410) {
        setBannerImage(BannerImage2);
      } else {
        setBannerImage(BannerImage1);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfileImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // 이미지 파일인지 확인
      if (!file.type.startsWith('image/')) {
        alert(t('morePage.imageOnly'));
        return;
      }

      // 파일 크기 제한 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(t('morePage.imageSizeLimit'));
        return;
      }

      // 이미지 미리보기 생성
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);

      // 서버에 이미지 업로드
      setUploading(true);
      try {
        const response = await userAPI.uploadProfileImage(file);

        // AuthContext 업데이트
        if (updateUser) {
          updateUser(response.data);
        }

        // 서버에서 받은 이미지 URL로 변경
        const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
        const imageUrl = `${API_BASE_URL.replace('/api', '')}${response.data.profile_image}`;
        setProfileImage(imageUrl);

        alert(t('morePage.profileImageChanged'));
      } catch (error) {
        console.error('Failed to upload profile image:', error);
        alert(t('morePage.uploadFailed'));
        // 실패 시 이전 이미지로 복원
        if (user?.profile_image) {
          const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
          const imageUrl = `${API_BASE_URL.replace('/api', '')}${user.profile_image}`;
          setProfileImage(imageUrl);
        } else {
          setProfileImage(null);
        }
      } finally {
        setUploading(false);
      }
    }
  };

  const handleMenuClick = (action) => {
    switch (action) {
      case 'profile':
        navigate('/profile/edit');
        break;
      case 'subscription':
        navigate('/subscription');
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'support':
        navigate('/contact');
        break;
      default:
        break;
    }
  };

  const bannerItems = [
    {
      id: '1',
      content: (
        <div className="h-full w-full">
          <img alt="" className="h-full w-full object-cover" src={bannerImage} />
        </div>
      ),
    },
    {
      id: '2',
      content: (
        <div className="h-full w-full">
          <img alt="" className="h-full w-full object-cover" src={bannerImage} />
        </div>
      ),
    },
    {
      id: '3',
      content: (
        <div className="h-full w-full">
          <img alt="" className="h-full w-full object-cover" src={bannerImage} />
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white min-h-screen flex flex-col pb-20">
      {/* 메인 컨텐츠 */}
      <div className="flex flex-col w-full">
        {/* 프로필 섹션 */}
        <div className="flex flex-col gap-3 px-6 pt-6 pb-[18px] w-full">
          <div className="flex gap-4 items-center w-full">
            {/* 프로필 이미지 */}
            <div className="relative">
              <div className="bg-gray-50 flex items-center justify-center rounded-2xl w-20 h-20 overflow-hidden">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={() => setProfileImage(null)}
                  />
                ) : (
                  <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              {/* 프로필 수정 버튼 */}
              <button
                onClick={handleProfileImageClick}
                disabled={uploading}
                className="absolute bottom-0 right-0 bg-white rounded-full w-6 h-6 flex items-center justify-center shadow-md border border-gray-200 hover:bg-gray-50"
              >
                <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageChange}
              />
            </div>
            {/* 사용자 정보 */}
            <div className="flex flex-col justify-center flex-1">
              <p className="text-18sb text-black leading-6">
                {user?.name || t('morePage.user')}
              </p>
              <p className="text-14r text-gray-400 leading-5">
                {user?.user_id || ''}
              </p>
            </div>
          </div>
          {/* 배너 슬라이더 */}
          <BannerSlider items={bannerItems} height="100px" />
        </div>

        {/* 메뉴 리스트 */}
        <div className="bg-white box-border content-stretch flex flex-col items-center px-0 py-[20px] relative shrink-0 w-full">
          {/* 프로필 수정 */}
          <button
            onClick={() => handleMenuClick('profile')}
            className="bg-white box-border content-stretch flex h-[52px] items-center justify-between px-6 py-0 relative shrink-0 w-full hover:bg-gray-50"
          >
            <div className="content-stretch flex gap-[14px] items-center relative shrink-0">
              <div className="bg-gray-50 box-border content-stretch flex gap-[10px] items-center justify-center p-1 relative rounded-lg shrink-0 size-[32px]">
                <div className="relative shrink-0 size-[16.2px]">
                  <img alt="" className="block max-w-none size-full" src={UserEdit} />
                </div>
              </div>
              <p className="flex flex-col font-['Pretendard_Variable:Medium',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-14m text-black text-nowrap">
                <span className="leading-[20px] whitespace-pre">{t('more.profileEdit')}</span>
              </p>
            </div>
            <div className="relative shrink-0 size-[16px]">
              <div className="absolute inset-[11.55%_23.29%_11.55%_30.31%]">
                <img alt="" className="block max-w-none size-full" src={ChevronRight} style={{ fill: '#B6BECE' }} />
              </div>
            </div>
          </button>

          {/* 구독설정 */}
          <button
            onClick={() => handleMenuClick('subscription')}
            className="bg-white box-border content-stretch flex h-[52px] items-center justify-between px-6 py-0 relative shrink-0 w-full hover:bg-gray-50"
          >
            <div className="content-stretch flex gap-[14px] items-center relative shrink-0">
              <div className="bg-gray-50 box-border content-stretch flex gap-[10px] items-center justify-center p-1 relative rounded-lg shrink-0 size-[32px]">
                <div className="relative shrink-0 size-[13.5px]">
                  <img alt="" className="block max-w-none size-full" src={Crown} />
                </div>
              </div>
              <p className="flex flex-col font-['Pretendard_Variable:Medium',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-14m text-black text-nowrap">
                <span className="leading-[20px] whitespace-pre">{t('more.subscription')}</span>
              </p>
            </div>
            <div className="relative shrink-0 size-[16px]">
              <div className="absolute inset-[11.55%_23.29%_11.55%_30.31%]">
                <img alt="" className="block max-w-none size-full" src={ChevronRight} style={{ fill: '#B6BECE' }} />
              </div>
            </div>
          </button>

          {/* 환경설정 */}
          <button
            onClick={() => handleMenuClick('settings')}
            className="bg-white box-border content-stretch flex h-[52px] items-center justify-between px-6 py-0 relative shrink-0 w-full hover:bg-gray-50"
          >
            <div className="content-stretch flex gap-[14px] items-center relative shrink-0">
              <div className="bg-gray-50 box-border content-stretch flex gap-[10px] items-center justify-center p-1 relative rounded-lg shrink-0 size-[32px]">
                <div className="relative shrink-0 size-[13.5px]">
                  <img alt="" className="block max-w-none size-full" src={Setting} />
                </div>
              </div>
              <p className="flex flex-col font-['Pretendard_Variable:Medium',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-14m text-black text-nowrap">
                <span className="leading-[20px] whitespace-pre">{t('more.settings')}</span>
              </p>
            </div>
            <div className="relative shrink-0 size-[16px]">
              <div className="absolute inset-[11.55%_23.29%_11.55%_30.31%]">
                <img alt="" className="block max-w-none size-full" src={ChevronRight} style={{ fill: '#B6BECE' }} />
              </div>
            </div>
          </button>

          {/* 고객센터 */}
          <button
            onClick={() => handleMenuClick('support')}
            className="bg-white box-border content-stretch flex h-[52px] items-center justify-between px-6 py-0 relative shrink-0 w-full hover:bg-gray-50"
          >
            <div className="content-stretch flex gap-[14px] items-center relative shrink-0">
              <div className="bg-gray-50 box-border content-stretch flex gap-[10px] items-center justify-center p-1 relative rounded-lg shrink-0 size-[32px]">
                <div className="relative shrink-0 size-[13.5px]">
                  <img alt="" className="block max-w-none size-full" src={MessageQuestion} />
                </div>
              </div>
              <p className="flex flex-col font-['Pretendard_Variable:Medium',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-14m text-black text-nowrap">
                <span className="leading-[20px] whitespace-pre">{t('more.customerCenter')}</span>
              </p>
            </div>
            <div className="relative shrink-0 size-[16px]">
              <div className="absolute inset-[11.55%_23.29%_11.55%_30.31%]">
                <img alt="" className="block max-w-none size-full" src={ChevronRight} style={{ fill: '#B6BECE' }} />
              </div>
            </div>
          </button>
        </div>

        {/* 관련 앱 둘러보세요 섹션 */}
        <div className="bg-gray-50 box-border content-stretch flex flex-col gap-[20px] items-start pb-[40px] pt-[24px] px-[20px] relative shrink-0 w-full">
          <div className="flex flex-col font-['Pretendard_Variable:SemiBold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-gray-800 text-16sb text-nowrap">
            <p className="leading-[22px] whitespace-pre">{t('morePage.browseApps')}</p>
          </div>
          <div className="content-stretch flex gap-[20px] items-start justify-center relative shrink-0 w-full">
            {/* 짐워크 */}
            <div className="content-stretch flex flex-col gap-[10px] items-center relative shrink-0">
              <div className="bg-gray-50 overflow-clip relative rounded-[12px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.12)] shrink-0 size-[64px]">
                <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={AppIcon1} />
              </div>
              <div className="flex flex-col font-['Pretendard_Variable:Medium',sans-serif] justify-center leading-[0] min-w-full not-italic relative shrink-0 text-gray-600 text-13m text-center w-[min-content]">
                <p className="leading-[14px]">{t('morePage.gymWork')}</p>
              </div>
            </div>
            {/* 척추건강 */}
            <div className="content-stretch flex flex-col gap-[10px] items-center relative shrink-0">
              <div className="bg-gray-50 overflow-clip relative rounded-[12px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.12)] shrink-0 size-[64px]">
                <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={AppIcon2} />
              </div>
              <div className="flex flex-col font-['Pretendard_Variable:Medium',sans-serif] justify-center leading-[0] min-w-full not-italic relative shrink-0 text-gray-600 text-13m text-center w-[min-content]">
                <p className="leading-[14px]">{t('morePage.spineHealth')}</p>
              </div>
            </div>
            {/* 스마트슈즈 */}
            <div className="content-stretch flex flex-col gap-[10px] items-center relative shrink-0">
              <div className="bg-gray-50 overflow-clip relative rounded-[12px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.12)] shrink-0 size-[64px]">
                <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={AppIcon3} />
              </div>
              <div className="flex flex-col font-['Pretendard_Variable:Medium',sans-serif] justify-center leading-[0] min-w-full not-italic relative shrink-0 text-gray-600 text-13m text-center w-[min-content]">
                <p className="leading-[14px]">{t('morePage.smartShoes')}</p>
              </div>
            </div>
            {/* 손목닥터 */}
            <div className="content-stretch flex flex-col gap-[10px] items-center relative shrink-0">
              <div className="bg-gray-50 overflow-clip relative rounded-[12px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.12)] shrink-0 size-[64px]">
                <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={AppIcon4} />
              </div>
              <div className="flex flex-col font-['Pretendard_Variable:Medium',sans-serif] justify-center leading-[0] min-w-full not-italic relative shrink-0 text-gray-600 text-13m text-center w-[min-content]">
                <p className="leading-[14px]">{t('morePage.wristDoctor')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 로그아웃 */}
        <div className="flex flex-col gap-5 items-center pt-8 pb-[60px] px-5 w-full">
          <button
            onClick={handleLogout}
            className="text-[#52a8ff] text-14m tracking-[0.28px] hover:opacity-80 transition-opacity"
          >
            {t('more.logout')}
          </button>
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <BottomMenu />
    </div>
  );
};

export default MorePage;
