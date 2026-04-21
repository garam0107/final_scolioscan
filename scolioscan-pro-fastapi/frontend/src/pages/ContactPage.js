import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { contactAPI } from '../utils/api';
import IconArrowLeft from '../assets/icons/ProfileEdit/IconArrowLeft.svg';
import Icon16LineChevronDown from '../assets/icons/CustomerCenter/Icon16LineChevronDown.svg';

const ContactPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const inquiryTypes = t('contact.types');
  const [email, setEmail] = useState(user?.user_id || '');
  const [inquiryType, setInquiryType] = useState(inquiryTypes[0]);
  const [inquiryContent, setInquiryContent] = useState('');
  const [showInquiryTypeDropdown, setShowInquiryTypeDropdown] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setMessage(t('contact.emailRequired'));
      return;
    }

    if (!inquiryContent.trim()) {
      setMessage(t('contact.contentRequired'));
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await contactAPI.send({
        email: email.trim(),
        inquiry_type: inquiryType,
        inquiry_content: inquiryContent.trim(),
      });

      setMessage(t('contact.success'));
      setTimeout(() => {
        setEmail(user?.user_id || '');
        setInquiryType(inquiryTypes[0]);
        setInquiryContent('');
        setMessage('');
        navigate('/more');
      }, 1500);
    } catch (error) {
      console.error('문의 접수 실패:', error);
      let errorMessage = t('contact.failed');

      if (error.response?.status === 500) {
        errorMessage = t('contact.serverError');
      } else if (error.response?.status === 400) {
        errorMessage = t('contact.invalidInput');
      }

      setMessage(errorMessage);
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
          <p className="leading-[24px] whitespace-pre">{t('contact.title')}</p>
        </div>
        <div className="shrink-0 size-[24px]" />
      </div>

      {/* 메시지 표시 */}
      {message && (
        <div className={`mx-[20px] mt-[10px] p-[12px] rounded-[6px] text-center text-[14px] ${
          message.includes('실패') || message.includes('오류') || message.includes('Error') || message.includes('Failed')
            ? 'bg-red-50 text-red-600'
            : 'bg-mint-25 text-mint-600'
        }`}>
          {message}
        </div>
      )}

      {/* 폼 컨텐츠 */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col px-[20px] pt-[20px] pb-0">
        <div className="flex flex-col gap-[16px] w-full">
          {/* 답변 받으실 이메일 */}
          <div className="flex flex-col gap-[8px] items-start relative shrink-0 w-full">
            <p className="font-['Pretendard_Variable',sans-serif] font-medium leading-[20px] not-italic text-[#2b2f36] text-[15px]">
              {t('contact.replyEmail')}
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="abc@nextvinetech.com"
              disabled
              className="bg-[#f3f4f7] border border-[#d4d9e2] border-solid box-border h-[52px] px-[16px] py-0 rounded-[6px] w-full font-['Pretendard_Variable',sans-serif] font-medium text-[15px] text-[#7e89a0] cursor-not-allowed"
            />
          </div>

          {/* 문의 유형 */}
          <div className="flex flex-col gap-[8px] items-start relative shrink-0 w-full">
            <p className="font-['Pretendard_Variable',sans-serif] font-medium leading-[20px] not-italic text-[#2b2f36] text-[15px]">
              {t('contact.inquiryType')}
            </p>
            <div className="box-border flex flex-col gap-[8px] items-start pb-[20px] pt-0 px-0 relative shrink-0 w-full">
              <div className="relative w-full">
                <button
                  type="button"
                  onClick={() => setShowInquiryTypeDropdown(!showInquiryTypeDropdown)}
                  className="bg-[#f3f4f7] border border-[#d4d9e2] border-solid box-border flex h-[52px] items-center justify-between pl-[16px] pr-[12px] py-0 relative rounded-[6px] shrink-0 w-full"
                >
                  <p className="font-['Pretendard_Variable',sans-serif] font-medium leading-[20px] min-h-px min-w-px not-italic relative shrink-0 text-[#2b2f36] text-[15px] text-left text-nowrap">
                    {inquiryType}
                  </p>
                  <div className="content-stretch flex items-center justify-center relative shrink-0 size-[32px]">
                    <div className="relative shrink-0 size-[16px]">
                      <div className="absolute inset-[31.63%_12.88%_25.94%_12.88%]">
                        <img alt="" className="block max-w-none size-full" src={Icon16LineChevronDown} />
                      </div>
                    </div>
                  </div>
                </button>

                {/* 드롭다운 메뉴 */}
                {showInquiryTypeDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-[4px] bg-white border border-[#d4d9e2] border-solid rounded-[6px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.1)] z-10">
                    {inquiryTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setInquiryType(type);
                          setShowInquiryTypeDropdown(false);
                        }}
                        className={`w-full text-left px-[16px] py-[12px] text-[15px] leading-[20px] font-['Pretendard_Variable',sans-serif] font-medium ${
                          inquiryType === type
                            ? 'bg-[#f3f4f7] text-[#2b2f36]'
                            : 'text-[#2b2f36] hover:bg-[#f3f4f7]'
                        } first:rounded-t-[6px] last:rounded-b-[6px]`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 문의 내용 */}
          <div className="flex flex-col gap-[8px] items-start relative shrink-0 w-full">
            <p className="font-['Pretendard_Variable',sans-serif] font-medium leading-[20px] not-italic text-[#2b2f36] text-[15px]">
              {t('contact.inquiryContent')}
            </p>
            <div className="bg-[#f3f4f7] border border-[#d4d9e2] border-solid box-border flex h-[202px] items-start px-[16px] py-[14px] relative rounded-[6px] shrink-0 w-full">
              <textarea
                value={inquiryContent}
                onChange={(e) => setInquiryContent(e.target.value)}
                placeholder={t('contact.contentPlaceholder')}
                required
                className="font-['Pretendard_Variable',sans-serif] font-medium basis-0 grow leading-[20px] min-h-px min-w-px not-italic relative shrink-0 text-[15px] w-full h-full bg-transparent border-0 outline-0 resize-none placeholder:text-[#b6bece] text-[#2b2f36]"
              />
            </div>
          </div>
        </div>

        {/* 문의하기 버튼 */}
        <div className="mt-auto pt-[4px] pb-[16px] w-full">
          <button
            type="submit"
            disabled={loading}
            className="bg-[#2c9696] box-border flex gap-[6px] h-[48px] items-center justify-center px-[14px] py-0 relative rounded-[6px] shrink-0 w-full disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
          >
            <p className="font-['Pretendard_Variable',sans-serif] font-medium leading-[22px] not-italic relative shrink-0 text-[16px] text-nowrap text-white whitespace-pre">
              {loading ? t('contact.submitting') : t('contact.submit')}
            </p>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContactPage;
