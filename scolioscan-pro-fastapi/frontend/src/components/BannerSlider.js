import React, { useState, useEffect, useRef } from 'react';

/**
 * 배너 슬라이더 컴포넌트
 * - 자동 슬라이드 (기본 4초)
 * - 터치/마우스 스와이프 지원
 * - 페이지 인디케이터
 */
const BannerSlider = ({ items, interval = 4000, height = '112px' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const sliderRef = useRef(null);
  const autoSlideTimerRef = useRef(null);

  // 자동 슬라이드
  useEffect(() => {
    if (isDragging) return; // 드래그 중에는 자동 슬라이드 중지

    autoSlideTimerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, interval);

    return () => {
      if (autoSlideTimerRef.current) {
        clearInterval(autoSlideTimerRef.current);
      }
    };
  }, [items.length, interval, isDragging]);

  // 터치/마우스 이벤트 핸들러
  const handleStart = (clientX) => {
    setIsDragging(true);
    setStartX(clientX);
    if (autoSlideTimerRef.current) {
      clearInterval(autoSlideTimerRef.current);
    }
  };

  const handleMove = (clientX) => {
    if (!isDragging) return;
    const diff = clientX - startX;
    setTranslateX(diff);
  };

  const handleEnd = () => {
    if (!isDragging) return;

    const threshold = 50; // 슬라이드 임계값
    if (Math.abs(translateX) > threshold) {
      if (translateX > 0) {
        // 오른쪽으로 스와이프 (이전 슬라이드)
        setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
      } else {
        // 왼쪽으로 스와이프 (다음 슬라이드)
        setCurrentIndex((prev) => (prev + 1) % items.length);
      }
    }

    setIsDragging(false);
    setTranslateX(0);
  };

  // 마우스 이벤트
  const handleMouseDown = (e) => {
    handleStart(e.clientX);
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleEnd();
    }
  };

  // 터치 이벤트
  const handleTouchStart = (e) => {
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (isDragging) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl"
      style={{ height }}
    >
      <div
        ref={sliderRef}
        className="flex h-full"
        style={{
          transform: `translateX(calc(-${currentIndex * 100}% / ${items.length} + ${isDragging ? translateX : 0}px))`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
          width: `${items.length * 100}%`,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="relative shrink-0 h-full"
            style={{
              width: `calc(100% / ${items.length})`,
              flexShrink: 0,
            }}
          >
            <div className="relative h-full w-full">
              {item.content}
            </div>
          </div>
        ))}
      </div>

      {/* 페이지 인디케이터 */}
      <div className="absolute bg-[rgba(255,255,255,0.2)] bottom-[9px] flex items-center justify-center px-[6px] py-[2px] right-[11px] rounded-[8px] z-10">
        <p className="text-10r text-gray-50 leading-[14px]">
          {currentIndex + 1} / {items.length}
        </p>
      </div>
    </div>
  );
};

export default BannerSlider;
