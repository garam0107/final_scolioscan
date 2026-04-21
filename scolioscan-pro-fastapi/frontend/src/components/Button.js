import React from 'react';

const Button = ({
  children,
  variant = 'filled',
  color = 'primary',
  size = 'regular',
  disabled = false,
  loading = false,
  className = '',
  onClick,
  type = 'button',
}) => {
  const isDisabled = disabled || loading;

  // Size별 스타일
  const sizeClasses = {
    text: 'h-[26px] px-0',
    big: 'h-[48px] px-[14px]',
    regular: 'h-[40px] px-[14px]',
  }[size] || 'h-[40px] px-[14px]';

  // Color별 스타일
  let colorClasses = '';
  if (variant === 'text') {
    colorClasses = `
      bg-transparent text-primary-500 p-0
      ${!isDisabled ? 'hover:text-primary-500/80' : ''}
    `;
  } else {
    // Filled 버튼
    switch (color) {
      case 'white':
        colorClasses = `
          bg-white text-gray-800 border border-gray-200
          ${!isDisabled ? 'hover:bg-gray-50' : ''}
        `;
        break;
      case 'gray':
        colorClasses = `
          bg-gray-50 text-gray-500
          ${!isDisabled ? 'hover:bg-gray-75' : ''}
        `;
        break;
      case 'primary':
      default:
        colorClasses = `
          bg-primary-500 text-white
          ${!isDisabled ? 'hover:bg-primary-500/90' : ''}
        `;
        break;
    }
  }

  // Size별 폰트 스타일
  const fontClasses = {
    text: 'font-medium text-[15px] leading-5',
    big: 'font-medium text-base leading-[22px]',
    regular: 'font-medium text-sm leading-5',
  }[size] || 'font-medium text-sm leading-5';

  const baseClasses = `
    inline-flex items-center justify-center
    ${sizeClasses}
    ${variant === 'text' ? '' : 'rounded-md'}
    ${fontClasses}
    transition-colors duration-200
    ${colorClasses}
    ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const handleClick = () => {
    if (!isDisabled && onClick) {
      onClick();
    }
  };

  // Loading spinner
  const loadingSpinner = (
    <svg
      className="animate-spin h-4 w-4 mr-2"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={handleClick}
      className={baseClasses}
    >
      {loading && loadingSpinner}
      {children}
    </button>
  );
};

export default Button;
