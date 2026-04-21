import React, { useState, useEffect, useRef } from 'react';
import InputNormal from '../InputNormal';
import Button from '../Button';
import { useLanguage } from '../../contexts/LanguageContext';

const SignupNameStep = ({ initialValue = '', onNext, onBack }) => {
  const { t } = useLanguage();
  const [name, setName] = useState(initialValue);
  const [nameState, setNameState] = useState('keyout-empty');
  const [errorMessage, setErrorMessage] = useState(undefined);
  const nameInputRef = useRef(null);

  useEffect(() => {
    if (initialValue) {
      setName(initialValue);
    }
  }, [initialValue]);

  const isButtonDisabled = !name.trim();
  const showError = nameState === 'keyout-error';

  const handleNameFocus = () => {
    if (nameState === 'keyout-error') {
      setNameState('keyin-typing');
    } else {
      setNameState(name ? 'keyin-typing' : 'keyin-empty');
    }
  };

  const handleNameBlur = () => {
    setNameState('keyout-empty');
  };

  const handleNameChange = (value) => {
    setName(value);
    if (errorMessage) {
      setErrorMessage(undefined);
    }
    setNameState(value ? 'keyin-typing' : 'keyin-empty');
  };

  const handleContinue = () => {
    const trimmedName = name.trim();

    if (trimmedName.length > 8) {
      setErrorMessage(t('signup.nameMaxLength'));
      setNameState('keyout-error');
      return;
    }

    if (!trimmedName) {
      setErrorMessage(t('signup.nameRequired'));
      setNameState('keyout-error');
      return;
    }

    setErrorMessage(undefined);
    setNameState('keyout-empty');
    onNext(trimmedName);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pt-0 pb-10">
        <div className="flex flex-col gap-6">
          {/* Title */}
          <div className="font-['Pretendard_Variable',sans-serif] font-bold leading-[38px] text-gray-700 text-[28px] pt-6">
            <p className="mb-0">{t('signup.nameStepLine1')}</p>
            <p>{t('signup.nameStepLine2')}</p>
          </div>

          {/* Name Input */}
          <div className="flex flex-col gap-[4px]">
            <InputNormal
              placeholder={t('signup.namePlaceholder')}
              value={name}
              state={nameState}
              errorMessage={errorMessage}
              onChange={handleNameChange}
              onFocus={handleNameFocus}
              onBlur={handleNameBlur}
              onClear={() => {
                setName('');
                setNameState('keyin-empty');
                setErrorMessage(undefined);
                if (nameInputRef.current) {
                  nameInputRef.current.value = '';
                }
              }}
              ref={nameInputRef}
            />
          </div>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="px-4 pt-1 pb-4">
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
  );
};

export default SignupNameStep;

