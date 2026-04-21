import React, { useState, useEffect } from 'react';
import Button from '../Button';
import { useLanguage } from '../../contexts/LanguageContext';

const SignupGenderStep = ({ initialValue = '', onNext, onBack }) => {
  const { t } = useLanguage();
  const [gender, setGender] = useState(initialValue);

  useEffect(() => {
    if (initialValue) {
      setGender(initialValue);
    }
  }, [initialValue]);

  const isButtonDisabled = !gender;

  const handleGenderSelect = (selectedGender) => {
    setGender(selectedGender);
  };

  const handleStart = () => {
    if (!gender) return;
    onNext(gender);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pt-0 pb-10">
        <div className="flex flex-col gap-6">
          {/* Title */}
          <div className="font-['Pretendard_Variable',sans-serif] font-bold leading-[38px] text-gray-700 text-[28px] pt-6">
            <p className="mb-0">{t('signup.genderStepLine1')}</p>
            <p>{t('signup.genderStepLine2')}</p>
          </div>

          {/* Gender Selection */}
          <div className="flex gap-[8px] items-start">
            {/* Male */}
            <button
              type="button"
              onClick={() => handleGenderSelect('male')}
              className={`
                basis-0 flex items-center grow h-[60px] min-h-px min-w-px
                pl-[16px] pr-[12px] py-0 rounded-[6px]
                relative shrink-0
                border border-solid transition-colors
                ${
                  gender === 'male'
                    ? 'bg-mint-25 border-primary-500'
                    : 'bg-gray-50 border-[rgba(0,0,0,0.04)]'
                }
              `}
            >
              <span className={`
                basis-0 grow min-h-px min-w-px
                font-['Pretendard_Variable',sans-serif]
                text-[18px] leading-[24px]
                text-center whitespace-nowrap
                overflow-hidden overflow-ellipsis
                relative shrink-0
                ${
                  gender === 'male'
                    ? 'font-bold text-primary-500'
                    : 'font-medium text-gray-400'
                }
              `}>
                {t('signup.male')}
              </span>
            </button>

            {/* Female */}
            <button
              type="button"
              onClick={() => handleGenderSelect('female')}
              className={`
                basis-0 flex items-center grow h-[60px] min-h-px min-w-px
                pl-[16px] pr-[12px] py-0 rounded-[6px]
                relative shrink-0
                border border-solid transition-colors
                ${
                  gender === 'female'
                    ? 'bg-mint-25 border-primary-500'
                    : 'bg-gray-50 border-[rgba(0,0,0,0.04)]'
                }
              `}
            >
              <span className={`
                basis-0 grow min-h-px min-w-px
                font-['Pretendard_Variable',sans-serif]
                text-[18px] leading-[24px]
                text-center whitespace-nowrap
                overflow-hidden overflow-ellipsis
                relative shrink-0
                ${
                  gender === 'female'
                    ? 'font-bold text-primary-500'
                    : 'font-medium text-gray-400'
                }
              `}>
                {t('signup.female')}
              </span>
            </button>
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
          onClick={handleStart}
          disabled={isButtonDisabled}
          className="w-full"
        >
          {t('signup.start')}
        </Button>
      </div>
    </div>
  );
};

export default SignupGenderStep;

