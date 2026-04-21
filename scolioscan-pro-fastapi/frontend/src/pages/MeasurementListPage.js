import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MeasurementDetailModal from '../components/MeasurementDetailModal';
import { analysisAPI } from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import IconArrowLeft from '../assets/icons/ProfileEdit/IconArrowLeft.svg';
import ChevronDownIcon from '../assets/icons/MeasurementList/IconChevronDown.svg';

const PAGE_SIZE = 20;

// 측정 카드 컴포넌트
const MeasurementCard = ({ date, type, thoracic, lumbar, onClick, upperBackLabel, lumbarLabel }) => {
  return (
    <button
      onClick={onClick}
      className="bg-white flex items-center justify-between px-5 py-4 rounded-xl shadow-[0px_0px_16px_0px_rgba(0,0,0,0.04)] w-full text-left hover:shadow-lg transition-shadow"
    >
      <div className="flex flex-col gap-1">
        <p className="text-15m text-gray-900 leading-5">{date}</p>
        <div className="bg-mint-25 px-2 py-1 rounded-[5px] inline-block w-fit">
          <p className="text-13r text-mint-600 leading-[18px]">{type}</p>
        </div>
      </div>
      <div className="flex flex-col gap-1 items-end">
        <div className="flex gap-2 items-center">
          <p className="text-13r text-gray-600">{upperBackLabel}</p>
          <p className="text-15sb text-gray-900 w-[40px] leading-[20px]">{Number(thoracic).toFixed(1)}°</p>
        </div>
        <div className="flex gap-2 items-center">
          <p className="text-13r text-gray-600">{lumbarLabel}</p>
          <p className="text-15sb text-gray-900 w-[40px] leading-[20px]">{Number(lumbar).toFixed(1)}°</p>
        </div>
      </div>
    </button>
  );
};

const MeasurementListPage = () => {
  const navigate = useNavigate();
  const { t, isEnglish } = useLanguage();
  const [sortOrder, setSortOrder] = useState('newest');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedMeasurement, setSelectedMeasurement] = useState(null);
  const [measurementModalOpen, setMeasurementModalOpen] = useState(false);
  const dropdownRef = useRef(null);
  const loaderRef = useRef(null);

  // Ref for back button handler
  const stateRef = useRef({
    measurementModalOpen: false,
    isDropdownOpen: false
  });

  // Keep ref in sync with state
  useEffect(() => {
    stateRef.current = {
      measurementModalOpen,
      isDropdownOpen
    };
  }, [measurementModalOpen, isDropdownOpen]);

  // 페이지별 오버레이 핸들러 등록 (App.js의 글로벌 handleBackButton에서 호출됨)
  useEffect(() => {
    window._pageOverlayHandler = () => {
      const state = stateRef.current;

      if (state.measurementModalOpen) {
        setMeasurementModalOpen(false);
        setSelectedMeasurement(null);
        return true;
      }
      if (state.isDropdownOpen) {
        setIsDropdownOpen(false);
        return true;
      }
      return false;
    };

    return () => {
      delete window._pageOverlayHandler;
    };
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = async () => {
    try {
      setLoading(true);
      const response = await analysisAPI.getAnalyses({ skip: 0, limit: PAGE_SIZE });
      const data = response.data || [];
      setAnalyses(data);
      setHasMore(data.length >= PAGE_SIZE);
    } catch (error) {
      console.error('Failed to load analyses:', error);
      setAnalyses([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  // 더 불러오기
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const response = await analysisAPI.getAnalyses({
        skip: analyses.length,
        limit: PAGE_SIZE
      });
      const newData = response.data || [];

      if (newData.length > 0) {
        setAnalyses(prev => [...prev, ...newData]);
      }
      setHasMore(newData.length >= PAGE_SIZE);
    } catch (error) {
      console.error('Failed to load more analyses:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [analyses.length, loadingMore, hasMore]);

  // Intersection Observer로 무한 스크롤 감지
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, loadMore]);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 날짜 포맷 함수
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isEnglish) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    }
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  // 측정 타입 매핑
  const getTypeLabel = (type) => {
    const typeMap = {
      1: t('measurementList.camera2D'),
      2: t('measurementList.video3D'),
      3: t('measurementList.scoliometerMeasure')
    };
    return typeMap[type] || t('measurementList.camera2D');
  };

  // 정렬된 측정 데이터
  const sortedMeasurements = useMemo(() => {
    const sorted = [...analyses];
    sorted.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return sortOrder === 'newest'
        ? dateB - dateA  // 최신순: 내림차순
        : dateA - dateB; // 오래된순: 오름차순
    });
    return sorted;
  }, [sortOrder, analyses]);

  const handleSortChange = (value) => {
    setSortOrder(value);
    setIsDropdownOpen(false);
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* 헤더 */}
      <div className="bg-gray-50 box-border content-stretch flex h-[68px] items-center justify-between p-[20px] relative shrink-0 w-full">
        <button
          onClick={() => navigate(-1)}
          className="content-stretch flex gap-[10px] items-center relative shrink-0"
        >
          <div className="relative shrink-0 size-[24px]">
            <div className="absolute flex inset-[17.71%_32.29%] items-center justify-center">
              <div className="flex-none h-[8.5px] rotate-[90deg] w-[15.5px]">
                <img alt="" className="block max-w-none size-full" style={{ filter: 'brightness(0) saturate(100%) invert(35%) sepia(3%) saturate(1000%) hue-rotate(180deg) brightness(95%) contrast(90%)' }} src={IconArrowLeft} />
              </div>
            </div>
          </div>
        </button>
        <h1 className="text-18sb text-gray-800 leading-[24px]">{t('measurementList.title')}</h1>
        <div className="shrink-0 size-[24px]" />
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex flex-col gap-4 px-5 w-full pb-5">
        {/* 드롭다운 */}
        <div className="flex justify-end w-full">
          <div className="relative w-[104px]" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="bg-white border border-gray-90 border-solid box-border content-stretch flex h-[40px] items-center pl-[4px] pr-[4px] py-0 rounded-[6px] w-full"
            >
              <p className="[white-space-collapse:collapse] basis-0 font-['Pretendard_Variable:Regular',sans-serif] grow leading-[20px] min-h-px min-w-px not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-gray-600 text-14r text-nowrap">{sortOrder === 'newest' ? t('measurementList.newest') : t('measurementList.oldest')}</p>
              <div className="content-stretch flex items-center justify-center relative shrink-0 size-[32px]">
                <div className="relative shrink-0 size-[16px]">
                  <div className="absolute inset-[31.63%_12.88%_25.94%_12.88%]">
                    <img alt="" className="block max-w-none size-full" src={ChevronDownIcon} />
                  </div>
                </div>
              </div>
            </button>
            {isDropdownOpen && (
              <div className="absolute top-[44px] left-0 right-0 bg-white border border-gray-90 rounded-[6px] shadow-lg z-10">
                <button
                  onClick={() => handleSortChange('newest')}
                  className={`w-full px-4 py-2 text-left text-14r leading-5 first:rounded-t-[6px] last:rounded-b-[6px] hover:bg-gray-25 ${
                    sortOrder === 'newest' ? 'text-gray-900 bg-gray-25' : 'text-gray-600'
                  }`}
                >
                  {t('measurementList.newest')}
                </button>
                <button
                  onClick={() => handleSortChange('oldest')}
                  className={`w-full px-4 py-2 text-left text-14r leading-5 first:rounded-t-[6px] last:rounded-b-[6px] hover:bg-gray-25 ${
                    sortOrder === 'oldest' ? 'text-gray-900 bg-gray-25' : 'text-gray-600'
                  }`}
                >
                  {t('measurementList.oldest')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 측정 목록 */}
        <div className="flex flex-col gap-[10px] w-full">
          {loading ? (
            null
          ) : sortedMeasurements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-16m text-gray-500 text-center">
                {t('measurementList.noData')}
              </p>
            </div>
          ) : (
            <>
              {sortedMeasurements.map((analysis) => (
                <MeasurementCard
                  key={analysis.id}
                  date={formatDate(analysis.created_at)}
                  type={getTypeLabel(analysis.analysis_type)}
                  thoracic={analysis.main_thoracic || 0}
                  lumbar={analysis.lumbar || 0}
                  upperBackLabel={t('measurementList.upperBack')}
                  lumbarLabel={t('measurementList.lumbar')}
                  onClick={() => {
                    setSelectedMeasurement(analysis);
                    setMeasurementModalOpen(true);
                  }}
                />
              ))}

              {/* 무한 스크롤 로더 */}
              <div ref={loaderRef} className="py-4">
                {loadingMore && (
                  <div className="flex items-center justify-center">
                    <p className="text-14m text-gray-400">{t('measurementList.loading')}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 측정 상세 모달 */}
      { measurementModalOpen && (
        <MeasurementDetailModal
          isOpen={measurementModalOpen}
          onClose={() => {
            setMeasurementModalOpen(false);
            setSelectedMeasurement(null);
          }}
          measurement={selectedMeasurement}
          history={analyses}
        />
      )}
    </div>
  );
};

export default MeasurementListPage;
