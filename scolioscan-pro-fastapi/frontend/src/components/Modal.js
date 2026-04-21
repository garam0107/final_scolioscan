import React, { useEffect } from 'react';
import { IconArrowLeft } from '../assets/icons/ArrowLeft';

/**
 * 전체 화면 모달 컴포넌트
 * 오른쪽에서 슬라이드되어 들어오는 애니메이션
 */
const Modal = ({ isOpen, onClose, title, subtitle, children, bgColor = 'bg-white' }) => {
  // 모달 열릴 때 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className={`absolute top-0 right-0 bottom-0 w-full ${bgColor} flex flex-col transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className={`box-border content-stretch flex gap-[20px] h-[68px] items-center p-[20px] relative shrink-0 w-full ${bgColor}`}>
          <div className="content-stretch flex gap-[10px] items-center relative shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="relative shrink-0 w-[24px] h-[24px] flex items-center justify-center"
              aria-label="뒤로 가기"
            >
              <IconArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
          </div>
          {(title || subtitle) && (
            <div className="flex flex-col flex-1">
              {title && <h1 className="text-15sb text-gray-900 leading-5">{title}</h1>}
              {subtitle && <p className="text-13r text-gray-500 leading-[18px]">{subtitle}</p>}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
