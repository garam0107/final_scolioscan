import React, { useState, useRef, useCallback, forwardRef } from 'react';

const InputNormal = forwardRef(({
  value = '',
  placeholder = 'Placeholder',
  errorMessage,
  state, // 'keyout-empty', 'keyin-empty', 'keyin-typing', 'keyout-error'
  disabled = false,
  type = 'text',
  maxLength,
  className = '',
  onChange,
  onFocus,
  onBlur,
  onClear,
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  
  // 외부 ref와 내부 ref 병합
  React.useImperativeHandle(ref, () => inputRef.current);

  const hasValue = Boolean(value);
  const showClearButton = (isFocused || hasValue) && hasValue && type !== 'password';
  const hasError = Boolean(errorMessage) || state === 'keyout-error';
  
  // state에 따른 스타일 결정
  const getBorderColor = () => {
    if (hasError) return 'border-red-400';
    if (state === 'keyin-typing' || isFocused) return 'border-primary-500';
    return 'border-gray-100';
  };

  const handleChange = useCallback(
    (e) => {
      if (!disabled && onChange) {
        onChange(e.target.value);
      }
    },
    [disabled, onChange]
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (!disabled && onFocus) {
      onFocus();
    }
  }, [disabled, onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    if (!disabled && onBlur) {
      onBlur();
    }
  }, [disabled, onBlur]);

  const handleClear = useCallback(() => {
    if (!disabled && onClear) {
      onClear();
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [disabled, onClear]);

  return (
    <div className={`flex flex-col ${hasError ? 'gap-1' : 'gap-2'} items-start w-full ${className}`}>
      <div
        className={`
          relative flex items-center h-[52px] w-full
          pl-[16px] pr-[12px] py-0 rounded-[6px]
          bg-[#f7f7f8]
          border ${getBorderColor()} border-solid
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          transition-colors
        `}
        style={{
          borderColor: hasError ? '#FF4747' : (state === 'keyin-typing' || isFocused) ? '#2C9696' : '#dadadc'
        }}
      >
        <input
          ref={inputRef}
          type={type}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`
            flex-1 min-w-0
            font-medium
            text-[15px] leading-[20px]
            ${hasValue ? 'text-[#292929]' : 'text-gray-200'}
            placeholder:text-gray-200
            bg-transparent border-0 outline-none
            focus:outline-none focus:ring-0 focus:border-0
          `}
        />

        {showClearButton && (
          <button
            type="button"
            onClick={handleClear}
            className="
              flex items-center justify-center
              w-8 h-8 shrink-0
              text-gray-400
              hover:bg-gray-75 rounded
              transition-colors
            "
            aria-label="입력 내용 지우기"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 4L4 12M4 4L12 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      {hasError && errorMessage && (
        <div className="pl-4 pr-3 w-full">
          <p className="text-12r text-red-400">{errorMessage}</p>
        </div>
      )}
    </div>
  );
});

InputNormal.displayName = 'InputNormal';

export default InputNormal;
