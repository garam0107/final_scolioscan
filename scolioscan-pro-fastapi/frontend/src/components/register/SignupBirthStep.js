import React, { useState, useEffect, useMemo } from 'react';
import BirthSelect from '../BirthSelect';
import Button from '../Button';
import { useLanguage } from '../../contexts/LanguageContext';

const SignupBirthStep = ({ initialYear = '', initialMonth = '', initialDay = '', onNext, onBack }) => {
  const { t } = useLanguage();
  const [birthYear, setBirthYear] = useState(initialYear);
  const [birthMonth, setBirthMonth] = useState(initialMonth);
  const [birthDay, setBirthDay] = useState(initialDay);
  const [birthYearState, setBirthYearState] = useState('keyout-empty');
  const [birthMonthState, setBirthMonthState] = useState('keyout-empty');
  const [birthDayState, setBirthDayState] = useState('keyout-empty');

  useEffect(() => {
    if (initialYear) setBirthYear(initialYear);
    if (initialMonth) setBirthMonth(initialMonth);
    if (initialDay) setBirthDay(initialDay);
  }, [initialYear, initialMonth, initialDay]);

  // Year options (현재 연도부터 1900년까지)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= 1900; year--) {
      years.push(year.toString());
    }
    return years;
  }, []);

  // Month options (1-12월)
  const monthOptions = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    
    let maxMonth = 12;
    if (birthYear) {
      const selectedYear = parseInt(birthYear, 10);
      if (selectedYear === currentYear) {
        maxMonth = currentMonth;
      }
    }
    
    return Array.from({ length: maxMonth }, (_, i) => {
      const month = i + 1;
      return month.toString().padStart(2, '0');
    });
  }, [birthYear]);

  // Day options
  const dayOptions = useMemo(() => {
    if (!birthYear || !birthMonth) {
      return Array.from({ length: 31 }, (_, i) => {
        const day = i + 1;
        return day.toString().padStart(2, '0');
      });
    }

    const year = parseInt(birthYear, 10);
    const month = parseInt(birthMonth, 10);
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();
    
    const daysInMonth = new Date(year, month, 0).getDate();
    let maxDay = daysInMonth;
    
    if (year === currentYear && month === currentMonth) {
      maxDay = currentDay;
    }
    
    return Array.from({ length: maxDay }, (_, i) => {
      const day = i + 1;
      return day.toString().padStart(2, '0');
    });
  }, [birthYear, birthMonth]);

  const isButtonDisabled = !birthYear || !birthMonth || !birthDay;

  const handleBirthYearChange = (value) => {
    setBirthYear(value);
    setBirthYearState('keyin-typing');
    
    // 년도 변경 시 일자 재검증
    if (birthDay) {
      const year = parseInt(value, 10);
      const month = parseInt(birthMonth, 10);
      if (month) {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1;
        const currentDay = today.getDate();
        
        let maxDay = new Date(year, month, 0).getDate();
        if (year === currentYear && month === currentMonth) {
          maxDay = currentDay;
        }
        
        const selectedDay = parseInt(birthDay, 10);
        if (selectedDay > maxDay) {
          setBirthDay('');
          setBirthDayState('keyin-empty');
        }
      }
    }
  };

  const handleBirthMonthChange = (value) => {
    setBirthMonth(value);
    setBirthMonthState('keyin-typing');
    
    // 월 변경 시 일자 재검증
    if (birthDay) {
      const year = parseInt(birthYear, 10);
      const month = parseInt(value, 10);
      if (year) {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1;
        const currentDay = today.getDate();
        
        let maxDay = new Date(year, month, 0).getDate();
        if (year === currentYear && month === currentMonth) {
          maxDay = currentDay;
        }
        
        const selectedDay = parseInt(birthDay, 10);
        if (selectedDay > maxDay) {
          setBirthDay('');
          setBirthDayState('keyin-empty');
        }
      }
    }
  };

  const handleBirthDayChange = (value) => {
    setBirthDay(value);
    setBirthDayState('keyin-typing');
  };

  const handleContinue = () => {
    onNext({
      birthYear,
      birthMonth,
      birthDay,
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pt-0 pb-10">
        <div className="flex flex-col gap-6">
          {/* Title */}
          <div className="font-['Pretendard_Variable',sans-serif] font-bold leading-[38px] text-gray-700 text-[28px] pt-6">
            <p className="mb-0">{t('signup.birthStepLine1')}</p>
            <p>{t('signup.birthStepLine2')}</p>
          </div>

          {/* Birth Date Input */}
          <div className="flex gap-[8px] items-start">
            {/* Year */}
            <div className="basis-0 flex flex-col grow">
              <BirthSelect
                value={birthYear}
                placeholder=" YYYY"
                state={birthYearState}
                options={yearOptions}
                onChange={handleBirthYearChange}
                onFocus={() => setBirthYearState('keyin-typing')}
                onBlur={() => setBirthYearState('keyout-empty')}
              />
            </div>

            {/* Month */}
            <div className="flex flex-col w-[100px]">
              <BirthSelect
                value={birthMonth}
                placeholder="MM"
                state={birthMonthState}
                options={monthOptions}
                onChange={handleBirthMonthChange}
                onFocus={() => setBirthMonthState('keyin-typing')}
                onBlur={() => setBirthMonthState('keyout-empty')}
              />
            </div>

            {/* Day */}
            <div className="flex flex-col w-[100px]">
              <BirthSelect
                value={birthDay}
                placeholder="DD"
                state={birthDayState}
                options={dayOptions}
                onChange={handleBirthDayChange}
                onFocus={() => setBirthDayState('keyin-typing')}
                onBlur={() => setBirthDayState('keyout-empty')}
              />
            </div>
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

export default SignupBirthStep;

