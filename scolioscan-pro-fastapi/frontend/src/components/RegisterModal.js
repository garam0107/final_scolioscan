import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useAuth } from '../contexts/AuthContext';
import { useSignup } from '../contexts/SignupContext';
import { useLanguage } from '../contexts/LanguageContext';
import SignupEmailStep from './register/SignupEmailStep';
import SignupPasswordStep from './register/SignupPasswordStep';
import SignupNameStep from './register/SignupNameStep';
import SignupBirthStep from './register/SignupBirthStep';
import SignupGenderStep from './register/SignupGenderStep';

const STEPS = {
  EMAIL: 'email',
  PASSWORD: 'password',
  NAME: 'name',
  BIRTH: 'birth',
  GENDER: 'gender',
};

/**
 * 회원가입 모달 컴포넌트 (단계별 플로우)
 */
const RegisterModal = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(STEPS.EMAIL);
  const [loading, setLoading] = useState(false);
  const { register, login } = useAuth();
  const { signupData, updateSignupData, clearSignupData } = useSignup();

  // 모달이 열릴 때 첫 단계로 초기화
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(STEPS.EMAIL);
    }
  }, [isOpen]);

  // 모달이 닫힐 때 데이터 초기화
  useEffect(() => {
    if (!isOpen) {
      clearSignupData();
    }
  }, [isOpen, clearSignupData]);

  const handleStepNext = (stepData) => {
    switch (currentStep) {
      case STEPS.EMAIL:
        updateSignupData({ email: stepData });
        setCurrentStep(STEPS.PASSWORD);
        break;
      case STEPS.PASSWORD:
        updateSignupData({ password: stepData });
        setCurrentStep(STEPS.NAME);
        break;
      case STEPS.NAME:
        updateSignupData({ name: stepData });
        setCurrentStep(STEPS.BIRTH);
        break;
      case STEPS.BIRTH:
        updateSignupData({
          birthYear: stepData.birthYear,
          birthMonth: stepData.birthMonth,
          birthDay: stepData.birthDay,
        });
        setCurrentStep(STEPS.GENDER);
        break;
      case STEPS.GENDER:
        handleFinalSubmit(stepData);
        break;
      default:
        break;
    }
  };

  const handleStepBack = () => {
    switch (currentStep) {
      case STEPS.PASSWORD:
        setCurrentStep(STEPS.EMAIL);
        break;
      case STEPS.NAME:
        setCurrentStep(STEPS.PASSWORD);
        break;
      case STEPS.BIRTH:
        setCurrentStep(STEPS.NAME);
        break;
      case STEPS.GENDER:
        setCurrentStep(STEPS.BIRTH);
        break;
      default:
        break;
    }
  };

  const handleFinalSubmit = async (gender) => {
    const finalData = {
      ...signupData,
      gender,
    };

    // 생년월일을 Date 객체로 변환 후 ISO 8601 datetime 형식으로 변환
    const formatBirthday = (year, month, day) => {
      if (!year || !month || !day) return '';
      const date = new Date(
        parseInt(year, 10),
        parseInt(month, 10) - 1,
        parseInt(day, 10),
        0, 0, 0, 0
      );
      return date.toISOString();
    };

    setLoading(true);

    try {
      // 회원가입 API 호출
      await register({
        user_id: finalData.email,
        user_pw: finalData.password,
        name: finalData.name,
        phone: '010-0000-0000', // 임시값 (필요시 추가)
        birthday: formatBirthday(finalData.birthYear, finalData.birthMonth, finalData.birthDay),
        sex: finalData.gender === 'male', // true: 남성, false: 여성
        address: '서울시 강남구 테헤란로 123', // 임시값 (필요시 추가)
        detail_address: '101동 101호', // 임시값 (필요시 추가)
      });

      // 회원가입 성공 시 자동 로그인
      await login({
        user_id: finalData.email,
        user_pw: finalData.password,
      });

      // 전역 데이터 초기화
      clearSignupData();
      
      // 모달 닫기
      handleClose();
    } catch (error) {
      console.error('회원가입 실패:', error);
      alert(error.response?.data?.detail || t('signup.signupFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      // 첫 단계가 아니면 이전 단계로 이동
      if (currentStep !== STEPS.EMAIL) {
        handleStepBack();
      } else {
        // 첫 단계면 모달 닫기
        onClose();
      }
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case STEPS.EMAIL:
        return (
          <SignupEmailStep
            initialValue={signupData.email}
            onNext={handleStepNext}
            onBack={handleClose}
          />
        );
      case STEPS.PASSWORD:
        return (
          <SignupPasswordStep
            initialValue={signupData.password}
            onNext={handleStepNext}
            onBack={handleStepBack}
          />
        );
      case STEPS.NAME:
        return (
          <SignupNameStep
            initialValue={signupData.name}
            onNext={handleStepNext}
            onBack={handleStepBack}
          />
        );
      case STEPS.BIRTH:
        return (
          <SignupBirthStep
            initialYear={signupData.birthYear}
            initialMonth={signupData.birthMonth}
            initialDay={signupData.birthDay}
            onNext={handleStepNext}
            onBack={handleStepBack}
          />
        );
      case STEPS.GENDER:
        return (
          <SignupGenderStep
            initialValue={signupData.gender}
            onNext={handleStepNext}
            onBack={handleStepBack}
          />
        );
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case STEPS.EMAIL:
        return t('signup.stepTitleEmail');
      case STEPS.PASSWORD:
        return t('signup.stepTitlePassword');
      case STEPS.NAME:
        return t('signup.stepTitleName');
      case STEPS.BIRTH:
        return t('signup.stepTitleBirth');
      case STEPS.GENDER:
        return t('signup.stepTitleGender');
      default:
        return t('signup.stepTitleDefault');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={getStepTitle()}>
      <div className="flex flex-col h-full">
        {renderStep()}
      </div>
    </Modal>
  );
};

export default RegisterModal;
