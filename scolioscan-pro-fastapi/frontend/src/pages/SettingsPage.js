import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { userAPI } from '../utils/api';
import IconArrowLeft from '../assets/icons/ProfileEdit/IconArrowLeft.svg';
import IconToggle from '../assets/icons/Settings/IconToggle.svg';
import Icon16LineChevronDown from '../assets/icons/CustomerCenter/Icon16LineChevronDown.svg';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [dataBackup, setDataBackup] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const languages = [
    { code: 'ko', label: '한국어' },
    { code: 'en', label: 'English' }
  ];

  const getLanguageLabel = (code) => {
    const lang = languages.find(l => l.code === code);
    return lang ? lang.label : '한국어';
  };

  useEffect(() => {
    // 사용자 설정 로드
    if (user?.settings) {
      setPushNotifications(user.settings.push_notifications !== false);
      setEmailNotifications(user.settings.email_notifications !== false);
      setDataBackup(user.settings.data_backup !== false);
    }
  }, [user]);

  useEffect(() => {
    setSelectedLanguage(language);
  }, [language]);

  // Ref for back button handler
  const stateRef = useRef({ showLanguageDropdown: false });
  useEffect(() => {
    stateRef.current = { showLanguageDropdown };
  }, [showLanguageDropdown]);

  // 페이지별 오버레이 핸들러 등록
  useEffect(() => {
    window._pageOverlayHandler = () => {
      if (stateRef.current.showLanguageDropdown) {
        setShowLanguageDropdown(false);
        return true;
      }
      return false;
    };
    return () => {
      delete window._pageOverlayHandler;
    };
  }, []);

  const handleLanguageChange = (langCode) => {
    setSelectedLanguage(langCode);
    setLanguage(langCode);
    setShowLanguageDropdown(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settings = {
        push_notifications: pushNotifications,
        email_notifications: emailNotifications,
        data_backup: dataBackup,
        language: selectedLanguage
      };

      await userAPI.updateSettings(settings);
      setMessage(t('settings.saved'));
      setTimeout(() => {
        setMessage('');
        navigate(-1);
      }, 1500);
    } catch (error) {
      console.error('설정 저장 실패:', error);
      setMessage(t('settings.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const ToggleButton = ({ value, onChange }) => (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`box-border flex gap-[10px] items-center py-[2px] relative rounded-[14px] shrink-0 transition-colors ${
        value
          ? 'bg-[#22BCB7] pl-[16px] pr-[2px]'
          : 'bg-[#d4d9e2] pl-[2px] pr-[16px]'
      }`}
    >
      <div className="relative shrink-0 size-[20px]">
        <img alt="" className="block max-w-none size-full" src={IconToggle} />
      </div>
    </button>
  );

  return (
    <div className="bg-white min-h-screen flex flex-col">
      {/* 헤더 */}
      <div className="box-border flex h-[68px] items-center justify-between p-[20px] relative shrink-0 w-full">
        <button
          onClick={() => navigate(-1)}
          className="flex gap-[10px] items-center relative shrink-0"
        >
          <div className="relative shrink-0 size-[24px]">
            <div className="absolute flex inset-[17.71%_32.29%] items-center justify-center">
              <div className="flex-none h-[8.5px] rotate-[90deg] w-[15.5px]">
                <img alt="" className="block max-w-none size-full" src={IconArrowLeft} />
              </div>
            </div>
          </div>
        </button>
        <div className="flex flex-col font-['Pretendard_Variable',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#2b2f36] text-[18px] text-nowrap">
          <p className="leading-[24px] whitespace-pre">{t('settings.title')}</p>
        </div>
        <div className="shrink-0 size-[24px]" />
      </div>

      {/* 메시지 표시 */}
      {message && (
        <div className={`mx-[20px] mt-[10px] p-[12px] rounded-[6px] text-center text-[14px] ${
          message.includes('오류') || message.includes('실패') || message.includes('Error') || message.includes('error')
            ? 'bg-red-50 text-red-600'
            : 'bg-mint-25 text-mint-600'
        }`}>
          {message}
        </div>
      )}

      {/* 설정 리스트 */}
      <div className="bg-white box-border flex flex-col items-center px-0 py-[20px] relative flex-1 w-full">
        {/* 알림 설정 섹션 */}
        <div className="bg-[#f3f4f7] box-border flex gap-[54px] h-[40px] items-center px-[24px] py-0 relative shrink-0 w-full">
          <div className="flex flex-col font-['Pretendard_Variable',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#657085] text-[14px] text-nowrap">
            <p className="leading-[20px] whitespace-pre">{t('settings.notificationSettings')}</p>
          </div>
        </div>

        {/* 푸시 알림 받기 */}
        <div className="bg-white box-border flex h-[64px] items-center justify-between px-[24px] py-0 relative shrink-0 w-full">
          <div className="flex flex-col items-start justify-center leading-[0] not-italic relative shrink-0 text-nowrap">
            <div className="flex flex-col font-['Pretendard_Variable',sans-serif] font-medium justify-center relative shrink-0 text-[14px] text-black">
              <p className="leading-[20px] text-nowrap whitespace-pre">{t('settings.pushNotifications')}</p>
            </div>
            <div className="flex flex-col font-['Pretendard_Variable',sans-serif] font-normal justify-center relative shrink-0 text-[#515968] text-[12px]">
              <p className="leading-[16px] text-nowrap whitespace-pre">{t('settings.pushNotificationsDesc')}</p>
            </div>
          </div>
          <ToggleButton value={pushNotifications} onChange={setPushNotifications} />
        </div>

        {/* 구분선 */}
        <div className="bg-[#edeff3] h-px shrink-0 w-full" />

        {/* 이메일 알림 받기 */}
        <div className="bg-white box-border flex h-[64px] items-center justify-between px-[24px] py-0 relative shrink-0 w-full">
          <div className="flex flex-col items-start justify-center leading-[0] not-italic relative shrink-0 text-nowrap">
            <div className="flex flex-col font-['Pretendard_Variable',sans-serif] font-medium justify-center relative shrink-0 text-[14px] text-black">
              <p className="leading-[20px] text-nowrap whitespace-pre">{t('settings.emailNotifications')}</p>
            </div>
            <div className="flex flex-col font-['Pretendard_Variable',sans-serif] font-normal justify-center relative shrink-0 text-[#515968] text-[12px]">
              <p className="leading-[16px] text-nowrap whitespace-pre">{t('settings.emailNotificationsDesc')}</p>
            </div>
          </div>
          <ToggleButton value={emailNotifications} onChange={setEmailNotifications} />
        </div>

        {/* 구분선 */}
        <div className="bg-[#edeff3] h-px shrink-0 w-full" />

        {/* 데이터 자동 백업 */}
        <div className="bg-white box-border flex h-[64px] items-center justify-between px-[24px] py-0 relative shrink-0 w-full">
          <div className="flex flex-col items-start justify-center leading-[0] not-italic relative shrink-0 text-nowrap">
            <div className="flex flex-col font-['Pretendard_Variable',sans-serif] font-medium justify-center relative shrink-0 text-[14px] text-black">
              <p className="leading-[20px] text-nowrap whitespace-pre">{t('settings.dataBackup')}</p>
            </div>
            <div className="flex flex-col font-['Pretendard_Variable',sans-serif] font-normal justify-center relative shrink-0 text-[#515968] text-[12px]">
              <p className="leading-[16px] text-nowrap whitespace-pre">{t('settings.dataBackupDesc')}</p>
            </div>
          </div>
          <ToggleButton value={dataBackup} onChange={setDataBackup} />
        </div>

        {/* 언어 설정 섹션 */}
        <div className="bg-[#f3f4f7] box-border flex gap-[54px] h-[40px] items-center px-[24px] py-0 relative shrink-0 w-full mt-[20px]">
          <div className="flex flex-col font-['Pretendard_Variable',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#657085] text-[14px] text-nowrap">
            <p className="leading-[20px] whitespace-pre">{t('settings.languageSettings')}</p>
          </div>
        </div>

        {/* 언어 선택 */}
        <div className="bg-white box-border flex h-[64px] items-center justify-between px-[24px] py-0 relative shrink-0 w-full">
          <div className="flex flex-col items-start justify-center leading-[0] not-italic relative shrink-0 text-nowrap">
            <div className="flex flex-col font-['Pretendard_Variable',sans-serif] font-medium justify-center relative shrink-0 text-[14px] text-black">
              <p className="leading-[20px] text-nowrap whitespace-pre">{t('settings.language')}</p>
            </div>
            <div className="flex flex-col font-['Pretendard_Variable',sans-serif] font-normal justify-center relative shrink-0 text-[#515968] text-[12px]">
              <p className="leading-[16px] text-nowrap whitespace-pre">{t('settings.languageDesc')}</p>
            </div>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className="bg-[#f3f4f7] border border-[#d4d9e2] border-solid box-border flex h-[36px] items-center justify-between pl-[12px] pr-[8px] py-0 relative rounded-[6px] shrink-0 min-w-[100px]"
            >
              <p className="font-['Pretendard_Variable',sans-serif] font-medium leading-[20px] not-italic relative shrink-0 text-[#2b2f36] text-[14px] text-left text-nowrap">
                {getLanguageLabel(selectedLanguage)}
              </p>
              <div className="content-stretch flex items-center justify-center relative shrink-0 size-[24px]">
                <div className="relative shrink-0 size-[16px]">
                  <div className="absolute inset-[31.63%_12.88%_25.94%_12.88%]">
                    <img alt="" className="block max-w-none size-full" src={Icon16LineChevronDown} />
                  </div>
                </div>
              </div>
            </button>

            {/* 드롭다운 메뉴 */}
            {showLanguageDropdown && (
              <div className="absolute top-full right-0 mt-[4px] bg-white border border-[#d4d9e2] border-solid rounded-[6px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.1)] z-10 min-w-[100px]">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`w-full text-left px-[12px] py-[10px] text-[14px] leading-[20px] font-['Pretendard_Variable',sans-serif] font-medium ${
                      selectedLanguage === lang.code
                        ? 'bg-[#f3f4f7] text-[#22BCB7]'
                        : 'text-[#2b2f36] hover:bg-[#f3f4f7]'
                    } first:rounded-t-[6px] last:rounded-b-[6px]`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 저장 버튼 */}
      <div className="flex flex-col items-start relative shrink-0 w-full mt-auto">
        <div className="bg-white box-border flex flex-col items-start pb-[16px] pt-[4px] px-[16px] relative shrink-0 w-full">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-[#22BCB7] box-border flex gap-[6px] h-[48px] items-center justify-center px-[14px] py-0 relative rounded-[6px] shrink-0 w-full hover:bg-[#1fa89f] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <p className="font-['Pretendard_Variable',sans-serif] font-medium leading-[22px] not-italic relative shrink-0 text-[16px] text-nowrap text-white whitespace-pre">
              {saving ? t('common.saving') : t('common.save')}
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
