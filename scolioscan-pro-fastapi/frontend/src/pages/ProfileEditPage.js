import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { userAPI } from '../utils/api';
import IconArrowLeft from '../assets/icons/ProfileEdit/IconArrowLeft.svg';
import Icon16SolidTimes from '../assets/icons/ProfileEdit/Icon16SolidTimes.svg';

const ProfileEditPage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { t, language } = useLanguage();

  const [formData, setFormData] = useState({
    name: '',
    birthYear: '',
    birthMonth: '',
    birthDay: '',
    gender: '남성',
    email: ''
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 초기 값 설정
  useEffect(() => {
    if (user) {
      // 생년월일 파싱 (백엔드에서는 birthday 필드 사용)
      let year = '', month = '', day = '';
      if (user.birthday) {
        try {
          const date = new Date(user.birthday);
          if (!isNaN(date.getTime())) {
            year = date.getFullYear().toString();
            month = (date.getMonth() + 1).toString().padStart(2, '0');
            day = date.getDate().toString().padStart(2, '0');
          }
        } catch (e) {
          console.error('생년월일 파싱 실패:', e);
        }
      }

      // 성별 변환 (백엔드: sex (Boolean), 프론트: gender (String))
      // True = 남성, False = 여성
      const gender = user.sex === true ? '남성' : (user.sex === false ? '여성' : '남성');

      setFormData({
        name: user.name || '',
        birthYear: year,
        birthMonth: month,
        birthDay: day,
        gender: gender,
        email: user.user_id || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (message) setMessage('');
  };

  const handlePasswordDataChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
    if (message) setMessage('');
  };

  const handleNameClear = () => {
    setFormData({
      ...formData,
      name: ''
    });
  };

  const handleGenderSelect = (gender) => {
    setFormData({
      ...formData,
      gender
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // 생년월일이 모두 입력되었는지 확인
      if (formData.birthYear && formData.birthMonth && formData.birthDay) {
        // 타임존 문제를 피하기 위해 UTC로 직접 생성
        const year = parseInt(formData.birthYear);
        const month = parseInt(formData.birthMonth).toString().padStart(2, '0');
        const day = parseInt(formData.birthDay).toString().padStart(2, '0');
        const birthdayString = `${year}-${month}-${day}T00:00:00.000Z`;

        // 성별 변환 (String -> Boolean)
        const sex = formData.gender === '남성';

        const updateData = {
          name: formData.name,
          birthday: birthdayString,
          sex: sex
        };

        console.log('업데이트 데이터:', updateData);
        const response = await userAPI.updateProfile(updateData);
        updateUser(response.data);

        // 비밀번호 변경 (둘 다 입력되고 일치할 때만)
        if (passwordData.newPassword && passwordData.confirmPassword) {
          if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage(t('profile.passwordMismatch'));
            setLoading(false);
            return;
          }
          if (passwordData.newPassword.length < 6) {
            setMessage(t('profile.passwordTooShort'));
            setLoading(false);
            return;
          }
          await userAPI.changePassword({
            new_password: passwordData.newPassword,
            confirm_password: passwordData.confirmPassword
          });
          setPasswordData({ newPassword: '', confirmPassword: '' });
        }

        setMessage(t('profile.saved'));
        setTimeout(() => {
          navigate('/more');
        }, 1500);
      } else {
        setMessage(t('profile.birthdayRequired'));
      }
    } catch (error) {
      console.error('프로필 수정 실패:', error);
      console.error('에러 응답:', error.response?.data);
      const errorDetail = error.response?.data?.detail || t('profile.saveError');
      setMessage(typeof errorDetail === 'string' ? errorDetail : JSON.stringify(errorDetail));
    } finally {
      setLoading(false);
    }
  };

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
          <p className="leading-[24px] whitespace-pre">{t('profile.title')}</p>
        </div>
        <div className="shrink-0 size-[24px]" />
      </div>

      {/* 메시지 표시 */}
      {message && (
        <div className={`mx-[20px] mt-[10px] p-[12px] rounded-[6px] text-center text-[14px] ${
          message.includes('오류') || message.includes('실패') || message.includes('일치하지') || message.includes('이상') || message.includes('Error') || message.includes('match') || message.includes('least')
            ? 'bg-red-50 text-red-600'
            : 'bg-mint-25 text-mint-600'
        }`}>
          {message}
        </div>
      )}

      {/* 폼 컨텐츠 */}
      <div className="basis-0 flex flex-col gap-[30px] grow items-start min-h-px min-w-px pb-0 pt-[20px] px-[20px] relative shrink-0 w-full">
        {/* 이름 */}
        <div className="flex flex-col gap-[8px] items-start relative shrink-0 w-full">
            <p className="font-['Pretendard_Variable',sans-serif] font-medium leading-[20px] not-italic text-[#2b2f36] text-[15px] text-nowrap w-full">
              {t('profile.name')}
            </p>
            <div className="bg-[#f3f4f7] border border-[#d4d9e2] border-solid box-border flex h-[52px] items-center pl-[16px] pr-[12px] py-0 relative rounded-[6px] shrink-0 w-full">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="홍길동"
                className="basis-0 font-['Pretendard_Variable',sans-serif] font-medium grow leading-[20px] min-h-px min-w-px not-italic relative shrink-0 text-[15px] text-[#2b2f36] bg-transparent border-0 outline-0 placeholder:text-[#b6bece]"
              />
              {formData.name && (
                <div className="bg-[#f3f4f7] flex items-center justify-center relative shrink-0 size-[32px]">
                  <button
                    type="button"
                    onClick={handleNameClear}
                    className="relative shrink-0 size-[16px]"
                  >
                    <img alt="" className="block max-w-none size-full" src={Icon16SolidTimes} />
                  </button>
                </div>
              )}
            </div>
        </div>

        {/* 비밀번호 */}
        <div className="flex flex-col gap-[8px] items-start relative shrink-0 w-full">
            <p className="font-['Pretendard_Variable',sans-serif] font-medium leading-[20px] not-italic text-[#2b2f36] text-[15px] text-nowrap w-full">
              {t('profile.password')}
            </p>
            <div className="bg-[#f3f4f7] border border-[#d4d9e2] border-solid box-border flex h-[52px] items-center pl-[16px] pr-[12px] py-0 relative rounded-[6px] shrink-0 w-full">
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordDataChange}
                placeholder={t('profile.newPassword')}
                className="basis-0 font-['Pretendard_Variable',sans-serif] font-medium grow leading-[20px] min-h-px min-w-px not-italic relative shrink-0 text-[15px] text-[#2b2f36] bg-transparent border-0 outline-0 placeholder:text-[#b6bece]"
              />
            </div>
        </div>

        {/* 비밀번호 확인 */}
        <div className="flex flex-col gap-[8px] items-start relative shrink-0 w-full">
            <p className="font-['Pretendard_Variable',sans-serif] font-medium leading-[20px] not-italic text-[#2b2f36] text-[15px] text-nowrap w-full">
              {t('profile.confirmPassword')}
            </p>
            <div className="bg-[#f3f4f7] border border-[#d4d9e2] border-solid box-border flex h-[52px] items-center pl-[16px] pr-[12px] py-0 relative rounded-[6px] shrink-0 w-full">
              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordDataChange}
                placeholder={t('profile.confirmPassword')}
                className="basis-0 font-['Pretendard_Variable',sans-serif] font-medium grow leading-[20px] min-h-px min-w-px not-italic relative shrink-0 text-[15px] text-[#2b2f36] bg-transparent border-0 outline-0 placeholder:text-[#b6bece]"
              />
            </div>
        </div>

        {/* 생년월일 */}
        <div className="flex flex-col gap-[8px] items-start relative shrink-0 w-full">
            <p className="font-['Pretendard_Variable',sans-serif] font-medium leading-[20px] not-italic text-[#2b2f36] text-[15px] text-nowrap w-full">
              {t('profile.birthDate')}
            </p>
            <div className="flex gap-[8px] items-start relative shrink-0 w-full">
              {/* 년 */}
              <div className="basis-0 flex flex-col grow items-start min-h-px min-w-px relative shrink-0">
                <div className="bg-[#f3f4f7] border border-[#d4d9e2] border-solid box-border flex h-[52px] items-center pl-[16px] pr-[12px] py-0 relative rounded-[6px] shrink-0 w-full">
                  <input
                    type="text"
                    name="birthYear"
                    value={formData.birthYear}
                    onChange={handleChange}
                    placeholder="1995"
                    maxLength={4}
                    className="basis-0 font-['Pretendard_Variable',sans-serif] font-medium grow leading-[20px] min-h-px min-w-px not-italic relative shrink-0 text-[15px] text-[#2b2f36] bg-transparent border-0 outline-0 placeholder:text-[#b6bece]"
                  />
                </div>
              </div>
              {/* 월 */}
              <div className="flex flex-col items-start relative shrink-0 w-[100px]">
                <div className="bg-[#f3f4f7] border border-[#d4d9e2] border-solid box-border flex h-[52px] items-center pl-[16px] pr-[12px] py-0 relative rounded-[6px] shrink-0 w-full">
                  <input
                    type="text"
                    name="birthMonth"
                    value={formData.birthMonth}
                    onChange={handleChange}
                    placeholder="07"
                    maxLength={2}
                    className="basis-0 font-['Pretendard_Variable',sans-serif] font-medium grow leading-[20px] min-h-px min-w-px not-italic relative shrink-0 text-[15px] text-[#2b2f36] bg-transparent border-0 outline-0 placeholder:text-[#b6bece]"
                  />
                </div>
              </div>
              {/* 일 */}
              <div className="flex flex-col items-start relative shrink-0 w-[100px]">
                <div className="bg-[#f3f4f7] border border-[#d4d9e2] border-solid box-border flex h-[52px] items-center pl-[16px] pr-[12px] py-0 relative rounded-[6px] shrink-0 w-full">
                  <input
                    type="text"
                    name="birthDay"
                    value={formData.birthDay}
                    onChange={handleChange}
                    placeholder="08"
                    maxLength={2}
                    className="basis-0 font-['Pretendard_Variable',sans-serif] font-medium grow leading-[20px] min-h-px min-w-px not-italic relative shrink-0 text-[15px] text-[#2b2f36] bg-transparent border-0 outline-0 placeholder:text-[#b6bece]"
                  />
                </div>
              </div>
            </div>
        </div>

        {/* 성별 */}
        <div className="flex flex-col gap-[8px] items-start relative shrink-0 w-full">
            <p className="font-['Pretendard_Variable',sans-serif] font-medium leading-[20px] not-italic text-[#2b2f36] text-[15px] text-nowrap w-full">
              {t('profile.gender')}
            </p>
            <div className="flex gap-[8px] items-start relative shrink-0 w-full">
              {/* 남성 */}
              <button
                type="button"
                onClick={() => handleGenderSelect('남성')}
                className={`basis-0 flex grow h-[52px] items-center min-h-px min-w-px pl-[16px] pr-[12px] py-0 relative rounded-[6px] shrink-0 border border-solid ${
                  formData.gender === '남성'
                    ? 'bg-[#edfdfc] border-[#2c9696]'
                    : 'bg-[#f3f4f7] border-[rgba(0,0,0,0.04)]'
                }`}
              >
                <p className={`basis-0 font-['Pretendard_Variable',sans-serif] grow leading-[20px] min-h-px min-w-px not-italic relative shrink-0 text-[15px] text-center text-nowrap ${
                  formData.gender === '남성'
                    ? 'font-bold text-[#2c9696]'
                    : 'font-medium text-[#7e89a0]'
                }`}>
                  {t('profile.male')}
                </p>
              </button>
              {/* 여성 */}
              <button
                type="button"
                onClick={() => handleGenderSelect('여성')}
                className={`basis-0 flex grow h-[52px] items-center min-h-px min-w-px pl-[16px] pr-[12px] py-0 relative rounded-[6px] shrink-0 border border-solid ${
                  formData.gender === '여성'
                    ? 'bg-[#edfdfc] border-[#2c9696]'
                    : 'bg-[#f3f4f7] border-[rgba(0,0,0,0.04)]'
                }`}
              >
                <p className={`basis-0 font-['Pretendard_Variable',sans-serif] grow leading-[20px] min-h-px min-w-px not-italic relative shrink-0 text-[15px] text-center text-nowrap ${
                  formData.gender === '여성'
                    ? 'font-bold text-[#2c9696]'
                    : 'font-medium text-[#7e89a0]'
                }`}>
                  {t('profile.female')}
                </p>
              </button>
            </div>
        </div>

        {/* 이메일 */}
        <div className="flex flex-col gap-[8px] items-start relative shrink-0 w-full">
            <p className="font-['Pretendard_Variable',sans-serif] font-medium leading-[20px] not-italic text-[#2b2f36] text-[15px] text-nowrap w-full">
              {t('profile.email')}
            </p>
            <div className="bg-[#f3f4f7] border border-[#d4d9e2] border-solid box-border flex h-[52px] items-center pl-[16px] pr-[12px] py-0 relative rounded-[6px] shrink-0 w-full">
              <p className="basis-0 font-['Pretendard_Variable',sans-serif] font-medium grow leading-[20px] min-h-px min-w-px not-italic relative shrink-0 text-[15px] text-[#b6bece] text-nowrap">
                {formData.email || 'abc@next.com'}
              </p>
            </div>
        </div>
      </div>

      {/* 저장 버튼 */}
      <div className="flex flex-col items-start relative shrink-0 w-full">
        <div className="bg-white flex flex-col items-start pb-[16px] pt-[4px] px-[16px] relative shrink-0 w-full">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="bg-[#2c9696] box-border flex gap-[6px] h-[48px] items-center justify-center px-[14px] py-0 relative rounded-[6px] shrink-0 w-full disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
          >
            <p className="font-['Pretendard_Variable',sans-serif] font-medium leading-[22px] not-italic relative shrink-0 text-[16px] text-nowrap text-white whitespace-pre">
              {loading ? t('common.saving') : t('common.save')}
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditPage;
