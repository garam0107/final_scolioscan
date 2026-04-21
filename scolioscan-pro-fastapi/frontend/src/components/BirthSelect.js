import React, { useState, useRef, useEffect } from 'react';

const BirthSelect = ({
  value = '',
  placeholder = '',
  options = [],
  errorMessage,
  disabled = false,
  className = '',
  onChange,
  onFocus,
  onBlur,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);
  const dropdownRef = useRef(null);

  const hasValue = Boolean(value);
  const hasError = Boolean(errorMessage);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        selectRef.current &&
        !selectRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleFocus = () => {
    if (!disabled) {
      setIsFocused(true);
      setIsOpen(true);
      if (onFocus) {
        onFocus();
      }
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (onBlur) {
      onBlur();
    }
  };

  const handleSelect = (selectedValue) => {
    if (!disabled && onChange) {
      onChange(selectedValue);
    }
    setIsOpen(false);
    setIsFocused(false);
  };

  const selectedOption = options.find((opt) => opt === value);

  return (
    <div className={`flex flex-col ${hasError ? 'gap-1' : 'gap-2'} items-start w-full ${className}`}>
      <div className="relative w-full">
        <div
          ref={selectRef}
          onClick={handleFocus}
          className={`
            relative flex items-center h-[52px] w-full
            pl-4 pr-3 py-0 rounded-md
            bg-gray-50
            border border-gray-100 border-solid
            cursor-pointer
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${isFocused && !hasError ? 'border-primary-500' : ''}
            ${hasError ? 'border-red-400' : ''}
            transition-colors
          `}
        >
          <div
            className={`
              flex-1 min-w-0
              font-medium
              text-[15px] leading-5
              ${hasValue ? 'text-gray-800' : 'text-gray-200'}
            `}
          >
            {selectedOption || placeholder}
          </div>

          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          >
            <path
              d="M4 6L8 10L12 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {isOpen && options.length > 0 && (
          <div
            ref={dropdownRef}
            className="
              absolute z-50 mt-1 w-full
              bg-white border border-gray-200 rounded-md
              shadow-lg max-h-[200px] overflow-y-auto
            "
          >
            {options.map((option) => (
              <div
                key={option}
                onClick={() => handleSelect(option)}
                className={`
                  px-4 py-3 cursor-pointer
                  hover:bg-gray-50
                  ${value === option ? 'bg-primary-50 text-primary-500' : 'text-gray-800'}
                  transition-colors
                `}
              >
                {option}
              </div>
            ))}
          </div>
        )}
      </div>

      {hasError && errorMessage && (
        <div className="pl-4 pr-3 w-full">
          <p className="text-12r text-red-400">{errorMessage}</p>
        </div>
      )}
    </div>
  );
};

export default BirthSelect;

