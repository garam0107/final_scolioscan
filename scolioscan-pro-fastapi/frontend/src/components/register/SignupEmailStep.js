import React, { useState, useEffect, useRef } from 'react';
import InputNormal from '../InputNormal';
import Button from '../Button';
import { isValidEmail } from '../../utils/validation';
import { authAPI } from '../../utils/api';
import { useLanguage } from '../../contexts/LanguageContext';

const SignupEmailStep = ({ initialValue = '', onNext, onBack }) => {
  const { t } = useLanguage();
  const [email, setEmail] = useState(initialValue);
  const [emailState, setEmailState] = useState('keyout-empty');
  const [hasBlurred, setHasBlurred] = useState(false);
  const [loading, setLoading] = useState(false);
  const [duplicateError, setDuplicateError] = useState('');
  const emailInputRef = useRef(null);

  useEffect(() => {
    if (initialValue) {
      setEmail(initialValue);
    }
  }, [initialValue]);

  const isEmailValid = isValidEmail(email);
  const showError = emailState === 'keyout-error' && (!isEmailValid || !email.trim());
  const isButtonDisabled = !email.trim() || !isEmailValid;

  const handleEmailFocus = () => {
    if (showError) {
      setEmailState('keyin-typing');
    } else {
      setEmailState(email ? 'keyin-typing' : 'keyin-empty');
    }
  };

  const handleEmailBlur = () => {
    setHasBlurred(true);
    const trimmedEmail = email.trim();
    const isValid = isValidEmail(trimmedEmail);
    if (trimmedEmail.length > 0 && !isValid) {
      setEmailState('keyout-error');
    } else {
      setEmailState('keyout-empty');
    }
  };

  const handleEmailChange = (value) => {
    setEmail(value);
    setDuplicateError('');
    if (hasBlurred && !isValidEmail(value) && value.length > 0) {
      setEmailState('keyout-error');
    } else if (hasBlurred && isValidEmail(value)) {
      setEmailState(value ? 'keyin-typing' : 'keyin-empty');
    } else {
      setEmailState(value ? 'keyin-typing' : 'keyin-empty');
    }
  };

  const handleContinue = async () => {
    const trimmedEmail = email.trim();
    setDuplicateError('');

    if (!trimmedEmail) {
      setHasBlurred(true);
      setEmailState('keyout-error');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setHasBlurred(true);
      setEmailState('keyout-error');
      return;
    }

    // 이메일 중복 확인
    setLoading(true);
    try {
      const response = await authAPI.checkEmail(trimmedEmail);
      if (response.data.exists) {
        setDuplicateError(t('signup.emailExists'));
        setEmailState('keyout-error');
        return;
      }
      onNext(trimmedEmail);
    } catch (error) {
      console.error('이메일 확인 오류:', error);
      setDuplicateError(t('signup.emailCheckError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Content */}
      <div className="basis-0 bg-white box-border flex flex-col gap-[24px] grow items-start min-h-0 min-w-0 pb-[40px] pt-[20px] px-[20px] relative shrink-0 w-full">
        {/* Title */}
        <div className="font-['Pretendard_Variable',sans-serif] font-bold leading-[38px] relative shrink-0 text-gray-700 text-[28px] w-full">
          <p className="mb-0">{t('signup.emailStepLine1')}</p>
          <p>{t('signup.emailStepLine2')}</p>
        </div>

        {/* Email Input */}
        <div className="flex flex-col gap-[8px] items-start relative shrink-0 w-full">
          <InputNormal
            placeholder={t('signup.emailPlaceholder')}
            value={email}
            state={emailState}
            errorMessage={
              duplicateError
                ? duplicateError
                : showError
                  ? !email.trim()
                    ? t('signup.emailRequired')
                    : t('signup.invalidEmail')
                  : undefined
            }
            disabled={loading}
            onChange={handleEmailChange}
            onFocus={handleEmailFocus}
            onBlur={handleEmailBlur}
            onClear={() => {
              setEmail('');
              setEmailState('keyin-empty');
              setHasBlurred(false);
              setDuplicateError('');
              if (emailInputRef.current) {
                emailInputRef.current.value = '';
              }
            }}
            ref={emailInputRef}
          />
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
            disabled={isButtonDisabled || loading}
            loading={loading}
            className="w-full"
          >
            {t('signup.continue')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SignupEmailStep;

