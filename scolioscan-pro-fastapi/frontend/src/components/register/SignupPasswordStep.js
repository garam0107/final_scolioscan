import React, { useState, useEffect } from 'react';
import InputNormal from '../InputNormal';
import Button from '../Button';
import { validatePassword, validatePasswordDetail } from '../../utils/validation';
import { useLanguage } from '../../contexts/LanguageContext';

const SignupPasswordStep = ({ initialValue = '', onNext, onBack }) => {
  const { t } = useLanguage();
  const [password, setPassword] = useState(initialValue);
  const [passwordState, setPasswordState] = useState('keyout-empty');
  const [hasBlurred, setHasBlurred] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (initialValue) {
      setPassword(initialValue);
    }
  }, [initialValue]);

  const passwordValidation = validatePassword(password);
  const passwordValidationDetail = validatePasswordDetail(password);
  const showError = passwordState === 'keyout-error';
  const isButtonDisabled = !password.trim() || !passwordValidation.isValid;

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handlePasswordFocus = () => {
    if (showError) {
      setPasswordState('keyin-typing');
    } else {
      setPasswordState(password ? 'keyin-typing' : 'keyin-empty');
    }
  };

  const handlePasswordBlur = () => {
    setHasBlurred(true);
    const validation = validatePassword(password);
    if (!password.trim() || !validation.isValid) {
      setPasswordState('keyout-error');
    } else {
      setPasswordState('keyout-empty');
    }
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    if (hasBlurred) {
      const validation = validatePassword(value);
      if (!value.trim() || !validation.isValid) {
        setPasswordState('keyout-error');
      } else {
        setPasswordState(value ? 'keyin-typing' : 'keyin-empty');
      }
    } else {
      setPasswordState(value ? 'keyin-typing' : 'keyin-empty');
    }
  };

  const handleContinue = () => {
    const trimmedPassword = password.trim();
    
    if (!trimmedPassword) {
      setHasBlurred(true);
      setPasswordState('keyout-error');
      return;
    }
    
    const validation = validatePassword(trimmedPassword);
    if (!validation.isValid) {
      setHasBlurred(true);
      setPasswordState('keyout-error');
      return;
    }
    
    onNext(trimmedPassword);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Content */}
      <div className="basis-0 bg-white box-border flex flex-col gap-[24px] grow items-start min-h-0 min-w-0 pb-[40px] pt-[20px] px-[20px] relative shrink-0 w-full">
        {/* Title */}
        <div className="font-['Pretendard_Variable',sans-serif] font-bold leading-[38px] relative shrink-0 text-gray-700 text-[28px] w-full">
          <p className="mb-0">{t('signup.passwordStepLine1')}</p>
          <p>{t('signup.passwordStepLine2')}</p>
        </div>

        {/* Password Input */}
        <div className="flex flex-col gap-[8px] items-start relative shrink-0 w-full">
          <div className="relative w-full">
            <InputNormal
              type={showPassword ? 'text' : 'password'}
              placeholder={t('signup.passwordPlaceholder')}
              value={password}
              state={passwordState}
              onChange={handlePasswordChange}
              onFocus={handlePasswordFocus}
              onBlur={handlePasswordBlur}
            />
            {/* Password visibility toggle */}
            {password && (
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="
                  absolute right-[12px] top-1/2 -translate-y-1/2
                  flex items-center justify-center
                  w-8 h-8 shrink-0
                  text-[#C0C0C4]
                  hover:bg-gray-75 rounded
                  transition-colors
                  z-10
                "
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0.666667 8C0.666667 8 3.33333 2.66667 8 2.66667C12.6667 2.66667 15.3333 8 15.3333 8C15.3333 8 12.6667 13.3333 8 13.3333C3.33333 13.3333 0.666667 8 0.666667 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.96 11.96C10.7133 12.7133 9.4 13.3333 8 13.3333C3.33333 13.3333 0.666667 8 0.666667 8C1.49333 6.16 2.82667 4.82667 4.04 3.96M6.6 2.82667C7.4 2.69333 8.2 2.66667 8 2.66667C12.6667 2.66667 15.3333 8 15.3333 8C14.8267 9.17333 13.4933 10.5067 12.04 11.3733L6.6 2.82667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M0.666667 0.666667L15.3333 15.3333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            )}
          </div>

          {/* Password validation checklist */}
          <div className="flex flex-col gap-[4px] items-start relative shrink-0 w-full">
            <div className="box-border flex gap-[4px] items-start px-[8px] py-0 relative shrink-0 w-full">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={passwordValidationDetail.hasLetterNumberSpecial ? 'text-primary-500' : 'text-gray-500'}>
                <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className={`font-['Pretendard_Variable',sans-serif] font-normal leading-[16px] text-[12px] ${passwordValidationDetail.hasLetterNumberSpecial ? 'text-primary-500' : 'text-gray-500'}`}>
                {t('signup.passwordHasLetterNumberSpecial')}
              </p>
            </div>

            <div className="box-border flex gap-[4px] items-start px-[8px] py-0 relative shrink-0 w-full">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={passwordValidationDetail.minLength ? 'text-primary-500' : 'text-gray-500'}>
                <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className={`font-['Pretendard_Variable',sans-serif] font-normal leading-[16px] text-[12px] ${passwordValidationDetail.minLength ? 'text-primary-500' : 'text-gray-500'}`}>
                {t('signup.passwordMinLength')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="flex flex-col items-start relative shrink-0 w-full">
        <div className="bg-white box-border flex flex-col items-start pb-[16px] pt-[4px] px-[16px] relative shrink-0 w-full">
          <Button
            type="button"
            variant="filled"
            color="primary"
            size="big"
            onClick={handleContinue}
            disabled={isButtonDisabled}
            className="w-full"
          >
            {t('signup.continue')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SignupPasswordStep;

