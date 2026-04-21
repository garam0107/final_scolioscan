import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscribeAPI } from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import IconArrowLeft from '../assets/icons/ProfileEdit/IconArrowLeft.svg';
import IconCrown from '../assets/icons/Subscription/IconCrown.svg';
import Icon16LineCheck from '../assets/icons/Subscription/Icon16LineCheck.svg';
import ChevronRight from '../assets/icons/My/ChevronRight.svg';

const SubscriptionPage = () => {
  const navigate = useNavigate();
  const { t, isEnglish } = useLanguage();
  const [loading, setLoading] = useState(true);

  // Translate plan name from backend
  const translatePlanName = (name) => {
    const planNames = t('subscription.planNames');
    return planNames?.[name] || name;
  };
  const [subscribeTypes, setSubscribeTypes] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPrepareModal, setShowPrepareModal] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);

      // 구독 타입 목록 조회
      const typesResponse = await subscribeAPI.getTypes();
      setSubscribeTypes(typesResponse.data || []);

      // 현재 구독 정보 조회
      const currentResponse = await subscribeAPI.getCurrent();
      setCurrentSubscription(currentResponse.data || null);
    } catch (error) {
      console.error('구독 정보 조회 실패:', error);
      if (error.response?.status === 404) {
        setCurrentSubscription(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      const now = new Date();
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const subscriptionData = {
        subscribe_type: subscribeTypes[0]?.id,
        started_at: now.toISOString(),
        ended_at: nextMonth.toISOString(),
      };

      await subscribeAPI.create(subscriptionData);
      setMessage(t('subscription.subscribeSuccess'));
      setTimeout(() => {
        loadSubscriptionData();
        setMessage('');
      }, 1500);
    } catch (error) {
      console.error('구독 실패:', error);
      setMessage(t('subscription.subscribeFailed'));
    }
  };

  const handleCancelSubscription = async () => {
    try {
      await subscribeAPI.cancel();
      setMessage(t('subscription.cancelSuccess'));
      setShowCancelModal(false);
      setTimeout(() => {
        loadSubscriptionData();
        setMessage('');
      }, 1500);
    } catch (error) {
      console.error('구독 취소 실패:', error);
      setMessage(t('subscription.cancelFailed'));
    }
  };

  const isSubscribed = currentSubscription !== null && !currentSubscription.terminated_at;
  const displayPlan = subscribeTypes.length > 0 ? subscribeTypes[0] : {
    name: t('subscription.premiumSubscription'),
    price: 14900,
  };

  const getNextBillingDate = () => {
    if (!currentSubscription?.ended_at) return '';
    const date = new Date(currentSubscription.ended_at);
    if (isEnglish) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    }
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  if (loading) {
    return null;
  }

  return (
    <div className="bg-[#f3f4f7] min-h-screen flex flex-col">
      {/* 헤더 */}
      <div className="bg-white box-border flex h-[68px] items-center justify-between p-[20px] relative shrink-0 w-full">
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
          <p className="leading-[24px] whitespace-pre">{t('subscription.title')}</p>
        </div>
        <div className="shrink-0 size-[24px]" />
      </div>

      {/* 메시지 표시 */}
      {message && (
        <div className={`mx-[20px] mt-[16px] p-[12px] rounded-[6px] text-center text-[14px] ${
          message.includes('실패')
            ? 'bg-red-50 text-red-600'
            : 'bg-mint-25 text-mint-600'
        }`}>
          {message}
        </div>
      )}

      {/* 컨텐츠 */}
      <div className="box-border flex flex-col items-center p-[20px] relative w-full">
        {/* 프리미엄 구독 카드 */}
        <div className="bg-white box-border flex flex-col gap-[16px] items-center px-[16px] py-[20px] relative rounded-[16px] shadow-[0px_0px_16px_0px_rgba(0,0,0,0.04)] shrink-0 w-full">
          {/* 카드 헤더 */}
          <div className="flex gap-[8px] items-center relative shrink-0 w-full">
            <div className="relative shrink-0 size-[24px]">
              <img alt="" className="block max-w-none size-full" src={IconCrown} />
            </div>
            <div className="flex flex-col font-['Pretendard_Variable',sans-serif] font-bold h-full justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-black flex-1">
              <p className="leading-[22px]">{translatePlanName(displayPlan.name)}</p>
            </div>
          </div>

          {/* 구분선 */}
          <div className="bg-[#ededed] h-px shrink-0 w-full" />

          {/* 기능 리스트 */}
          <div className="flex flex-col gap-[16px] items-start relative shrink-0 w-full">
            <div className="flex flex-col gap-[8px] items-start relative shrink-0 w-full">
              {[t('subscription.feature1'), t('subscription.feature2'), t('subscription.feature3'), t('subscription.feature4')].map((feature, index) => (
                <div key={index} className="flex gap-[6px] items-center relative shrink-0 w-full">
                  <div className="relative shrink-0 size-[16px]">
                    <img alt="" className="block max-w-none size-full" src={Icon16LineCheck} />
                  </div>
                  <p className={`basis-0 font-['Pretendard_Variable',sans-serif] font-normal grow leading-[18px] min-h-px min-w-px not-italic relative shrink-0 text-[13px] ${
                    index === 0 ? 'text-[#2c9696]' : 'text-[#25272d]'
                  }`}>
                    {feature}
                  </p>
                </div>
              ))}
            </div>

            {/* 가격 */}
            <div className="flex flex-col font-['Pretendard_Variable',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[15px] text-black text-right w-full">
              <p className="leading-[20px]">{isEnglish ? `$${(displayPlan.price / 1000).toFixed(0)}/month` : `월 ${displayPlan.price?.toLocaleString() || '14,900'}원`}</p>
            </div>

            {/* 구독 상태에 따른 버튼 */}
            {isSubscribed ? (
              <>
                <button
                  type="button"
                  disabled
                  className="bg-[#d4d9e2] box-border flex gap-[6px] h-[40px] items-center justify-center px-[14px] py-0 relative rounded-[6px] shrink-0 w-full cursor-not-allowed"
                >
                  <p className="font-['Pretendard_Variable',sans-serif] font-medium leading-[20px] not-italic relative shrink-0 text-[14px] text-nowrap text-[#7e89a0] whitespace-pre">
                    {t('subscription.subscribed')}
                  </p>
                </button>

                {currentSubscription?.ended_at && (
                  <div className="flex flex-col font-['Pretendard_Variable',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[13px] text-[#515968] text-center w-full">
                    <p className="leading-[18px]">{isEnglish ? `Next billing date: ${getNextBillingDate()}` : `다음 결제일: ${getNextBillingDate()}`}</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="bg-white border border-[#d4d9e2] border-solid box-border flex gap-[6px] h-[40px] items-center justify-center px-[14px] py-0 relative rounded-[6px] shrink-0 w-full mt-[8px]"
                >
                  <p className="font-['Pretendard_Variable',sans-serif] font-medium leading-[20px] not-italic relative shrink-0 text-[14px] text-nowrap text-[#515968] whitespace-pre">
                    {t('subscription.cancelSubscription')}
                  </p>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setShowPrepareModal(true)}
                className="bg-[#2c9696] box-border flex gap-[6px] h-[40px] items-center justify-center px-[14px] py-0 relative rounded-[6px] shrink-0 w-full hover:opacity-90"
              >
                <p className="font-['Pretendard_Variable',sans-serif] font-medium leading-[20px] not-italic relative shrink-0 text-[14px] text-nowrap text-white whitespace-pre">
                  {t('subscription.subscribe')}
                </p>
              </button>
            )}
          </div>
        </div>

        {/* 멤버십 유의사항 */}
        <div className="bg-gray-50 content-stretch flex flex-col items-start relative shrink-0 w-full">
          <div className="bg-gray-50 box-border content-stretch flex gap-[10px] items-start px-[24px] py-[20px] relative shrink-0 w-full">
            <div className="basis-0 content-stretch flex flex-col gap-[16px] grow items-start min-h-px min-w-px relative shrink-0">
              <p className="font-['Pretendard_Variable:Medium',sans-serif] leading-[20px] min-w-full not-italic relative shrink-0 text-gray-600 text-15m w-[min-content]">
                {t('subscription.membershipNotes')}
              </p>
            </div>
            <div className="relative shrink-0 size-[24px]">
              <button
                type="button"
                onClick={() => setShowNotes(!showNotes)}
                className="absolute flex h-[6px] items-center justify-center left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] w-[14px] transition-transform"
                style={{ transform: showNotes ? 'translate(-50%, -50%) rotate(-90deg)' : 'translate(-50%, -50%) rotate(90deg)' }}
              >
                <div className="flex-none">
                  <div className="h-[14px] relative w-[6px]">
                    <div className="absolute inset-[-5.36%_-12.5%]">
                      <img alt="" className="block max-w-none size-full" src={ChevronRight} />
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {showNotes && (
            <div className="bg-gray-50 box-border content-stretch flex gap-[10px] items-start pb-[32px] pt-0 px-[24px] relative shrink-0 w-full">
              <div className="basis-0 font-['Pretendard_Variable:Regular',sans-serif] grow leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#5c5c5c] text-14r">
                <p className="leading-[20px] mb-0">{t('subscription.purchaseGuide')}</p>
                <p className="leading-[20px] mb-0">&nbsp;</p>
                <ul className="list-disc mb-0">
                  <li className="mb-0 ms-[21px]">
                    <span className="leading-[20px]">{t('subscription.note1')}</span>
                  </li>
                  <li className="mb-0 ms-[21px]">
                    <span className="leading-[20px]">{t('subscription.note2')}</span>
                  </li>
                  <li className="ms-[21px]">
                    <span className="leading-[20px]">{t('subscription.note3')}</span>
                  </li>
                </ul>
                <p className="leading-[20px] mb-0">&nbsp;</p>
                <p className="leading-[20px] mb-0">{t('subscription.refundGuide')}</p>
                <p className="leading-[20px] mb-0">&nbsp;</p>
                <ul className="list-disc">
                  <li className="mb-0 ms-[21px]">
                    <span className="leading-[20px]">{t('subscription.note1')}</span>
                  </li>
                  <li className="mb-0 ms-[21px]">
                    <span className="leading-[20px]">{t('subscription.note2')}</span>
                  </li>
                  <li className="ms-[21px]">
                    <span className="leading-[20px]">{t('subscription.note3')}</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 구독 취소 확인 모달 */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[16px] p-[24px] max-w-[320px] w-full mx-[20px]">
            <div className="flex flex-col gap-[16px]">
              <div className="flex flex-col gap-[8px]">
                <p className="font-['Pretendard_Variable',sans-serif] font-semibold text-[18px] text-[#2b2f36]">
                  {t('subscription.cancelConfirmTitle')}
                </p>
                <p className="font-['Pretendard_Variable',sans-serif] font-normal text-[14px] text-[#515968] leading-[20px]">
                  {isEnglish ? (
                    <>Are you sure you want to cancel your subscription?<br />You can still use the service until the expiration date.</>
                  ) : (
                    <>정말 구독을 취소하시겠습니까?<br />취소해도 결제 만료일까지는 사용할 수 있습니다.</>
                  )}
                </p>
              </div>
              <div className="flex gap-[8px]">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 bg-[#f3f4f7] text-[#515968] font-['Pretendard_Variable',sans-serif] font-medium text-[14px] h-[40px] rounded-[6px]"
                >
                  {t('subscription.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleCancelSubscription}
                  className="flex-1 bg-[#2c9696] text-white font-['Pretendard_Variable',sans-serif] font-medium text-[14px] h-[40px] rounded-[6px]"
                >
                  {t('subscription.confirm')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 준비중 모달 */}
      {showPrepareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[16px] p-[24px] max-w-[320px] w-full mx-[20px]">
            <div className="flex flex-col gap-[16px]">
              <div className="flex flex-col gap-[8px] items-center">
                <p className="font-['Pretendard_Variable',sans-serif] font-semibold text-[18px] text-[#2b2f36]">
                  {t('subscription.notice')}
                </p>
                <p className="font-['Pretendard_Variable',sans-serif] font-normal text-[14px] text-[#515968] leading-[20px] text-center">
                  {t('subscription.preparing')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPrepareModal(false)}
                className="w-full bg-[#2c9696] text-white font-['Pretendard_Variable',sans-serif] font-medium text-[14px] h-[40px] rounded-[6px]"
              >
                {t('subscription.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPage;
