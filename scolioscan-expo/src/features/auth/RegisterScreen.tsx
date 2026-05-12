import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  AppState,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, } from 'react-native-safe-area-context';
import { useAuth } from '@/src/contexts/AuthContext';
import { useAuthStore } from '@/src/store/authStore';
import ToastAlert from '@/src/components/ui/ToastAlert';
import RegisterAgreementStep from './RegisterAgreementStep';
import RegisterBirthdayStep from './RegisterBirthdayStep';
import RegisterCarrierStep from './RegisterCarrierStep';
import RegisterCompleteStep from './RegisterCompleteStep';
import RegisterEmailStep from './RegisterEmailStep';
import RegisterGenderStep from './RegisterGenderStep';
import RegisterNameStep from './RegisterNameStep';
import RegisterMessageStep from './RegisterMessageStep';
import RegisterPasswordStep from './RegisterPasswordStep';
import {
  AgreementKey,
  AGREEMENTS,
  initialAgreementState,
  isAllAgreed,
  isAllRequiredAgreed,
} from './agreements';
import { styles } from './register.styles';
import {
  formatBirthdayIso,
  hasPasswordLength,
  hasPasswordMix,
  isValidBirthday,
  isValidEmail,
  isValidPhoneNumber,
  normalizeRegisterMessage,
} from './registerValidation';
import { openSmsComposer } from './register/openSmsComposer';
type RegisterStep = 'agreement' | 'email' | 'password' | 'name' | 'birthday' | 'carrier' | 'message' | 'gender' | 'complete';

export default function RegisterScreen() {
  const router = useRouter();
  const { checkEmail, checkPhone, register, messageCode,octomoApi } = useAuth();
  const draft = useAuthStore((state) => state.registerDraft);
  const resetRegisterDraft = useAuthStore((state) => state.resetRegisterDraft);
  const [step, setStep] = useState<RegisterStep>('agreement');
  const [agreement, setAgreement] = useState(initialAgreementState);
  const requiredAgreed = isAllRequiredAgreed(agreement);

  const toggleAgreement = (key: AgreementKey) => {
    setAgreement((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAllAgreements = () => {
    const next = !isAllAgreed(agreement);
    setAgreement(
      AGREEMENTS.reduce(
        (acc, item) => ({ ...acc, [item.key]: next }),
        {} as typeof agreement,
      ),
    );
  };
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  // 인증코드 발급하고 문자앱을 한 번 열었는지
  const [smsRequested, setSmsRequested] = useState(false);
  // /verify 호출 중인지
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  // 키보드 창 닫히고 버튼 위치 조정
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [toastKey, setToastKey] = useState(0);
  const passwordHasLength = hasPasswordLength(draft.password);
  const passwordHasMix = hasPasswordMix(draft.password);
  const birthdayReady = isValidBirthday(draft.birthYear, draft.birthMonth, draft.birthDay);

//handleMessagePress: /issue-code + 문자앱 열기
// AppState active: 자동 /verify
// true: setStep('email')
// false: 토스트 표시, message 유지
// 나중에 인증 확인 버튼 방식으로 바꿀 때는 AppState effect를 빼고 버튼으로 handleVerifyPhone을 호출


// OCTOMO API 호출 후 인증 완료 확인 함수
  const handleVerifyPhone = useCallback(async () => {
  if (verifyingPhone || loading || step !== 'message' || !smsRequested) {
    return;
  }

  setVerifyingPhone(true);

  try {
    const response = await octomoApi(draft.phone);

    if (response.verified) {
      showToast('휴대전화 번호 인증이 완료되었습니다.');
      setSmsRequested(false);
      setStep('email');
      return;
    }

    showToast('휴대전화 번호 인증이 아직 완료되지 않았습니다.');
  } catch (error) {
    const message = error instanceof Error ? error.message : '휴대전화 번호 인증 확인에 실패했습니다.';
    showToast(normalizeRegisterMessage(message));
  } finally {
    setVerifyingPhone(false);
  }
}, [draft.phone, loading, octomoApi, smsRequested, step, verifyingPhone]);


  useEffect(() => {
  const subscription = AppState.addEventListener('change', (nextAppState) => {
        if (nextAppState === 'active') {
      setTimeout(() => {
        void handleVerifyPhone();
      }, 1500);
    }
  });

  return () => {
    subscription.remove();
  };
}, [handleVerifyPhone]);


  // footer 버튼 위치 조정
  useEffect(() => {
  const showSubscription = Keyboard.addListener('keyboardDidShow', (event) => {
    setKeyboardHeight(event.endCoordinates.height);
  });

  const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
    setKeyboardHeight(0);
  });

  return () => {
    showSubscription.remove();
    hideSubscription.remove();
  };
}, []);


  useEffect(() => {
    // 회원가입 화면에 들어올 때마다 임시 입력값을 초기화합니다.
    resetRegisterDraft();

    return () => {
      // 화면을 떠날 때도 다시 비워서 다음 진입 시 이전 값이 남지 않게 합니다.
      resetRegisterDraft();
    };
  }, [resetRegisterDraft]);

  const stepMeta = useMemo(() => {
    if (step === 'agreement') {
      return {
        title: '',
        buttonText: '계속하기',
      };
    }
    if (step === 'carrier') {
      return {
        title: draft.carrier ? '휴대전화 번호를\n입력해주세요' : '이용하고 계신\n통신사를 알려주세요',
        buttonText: '계속하기',
      };
    }

    if (step === 'message') {
      return {
        title: '인증을 위해 메시지 어플을\n실행할게요',
        buttonText: '동의 및 휴대전화 번호 확인',
      };
    }
    if (step === 'email') {
      return {
        title: '이메일을\n입력해주세요',
        buttonText: '계속하기',
      };
    }

    if (step === 'password') {
      return {
        title: '비밀번호를\n입력해주세요',
        buttonText: '계속하기',
      };
    }

    if (step === 'name') {
      return {
        title: '이름을\n입력해주세요',
        buttonText: '계속하기',
      };
    }

    if (step === 'birthday') {
      return {
        title: '생년월일을\n입력해주세요',
        buttonText: '계속하기',
      };
    }
    if (step === 'complete') {
      return {
        title: '',
        buttonText: '로그인 하러가기',
      };
    }
    return {
      title: '마지막으로\n성별을 알려주세요',
      buttonText: '시작하기',
    };
  }, [draft.carrier, step]);

  const showToast = (message: string) => {
    setToastKey((current) => current + 1);
    setToastMessage(message);
  };

  const handleEmailCheck = async (trimmedEmail: string) => {
    if (checkingEmail || loading) {
      return;
    }

    setCheckingEmail(true);

    try {
      const exists = await checkEmail(trimmedEmail);
      if (exists) {
        showToast('이미 가입된 이메일입니다.');
        return;
      }

      setStep('password');
    } catch (error) {
      const message = error instanceof Error ? error.message : '이메일 중복 확인에 실패했습니다.';
      showToast(normalizeRegisterMessage(message));
    } finally {
      setCheckingEmail(false);
    }
  };

  const handlePhoneCheck = async (normalizePhoneNumber: string) =>{
    if (checkingPhone || loading){
      return;
    }
    setCheckingPhone(true);
    try {
      const exists = await checkPhone(normalizePhoneNumber);
      if (exists) {
        showToast('이미 가입된 휴대폰 번호입니다.')
        return;
      }
      setStep('message');

    } catch (error){
      const message = error instanceof Error ? error.message : '휴대폰 번호 중복 확인에 실패했습니다.';
      showToast(message);
    }finally{
      setCheckingPhone(false);
    }
  };

  const goNext = () => {
    if (step === 'agreement') {
      if (!requiredAgreed) {
        showToast('필수 약관에 모두 동의해주세요.');
        return;
      }
      setStep('carrier');
      return;
    }

    if (step === 'carrier') {
      if (!draft.carrier) {
        showToast('통신사를 선택해주세요.');
        return;
      }

      if (!isValidPhoneNumber(draft.phone)) {
        showToast('휴대전화 번호를 올바르게 입력해주세요.');
        return;
      }
      const normalizePhoneNumber = draft.phone.trim();
      void handlePhoneCheck(normalizePhoneNumber);

      return;
    }

    // if (step === 'message') {
    //   const OctomoApiResponse = octomoApi(draft.phone);
    //   console.log("OCTOMO API 리스폰스 : ", OctomoApiResponse);
    //   setStep('email');
    // }
    // if (step === 'message') {
    //   setStep('email');
    //   return;
    // }
    if (step === 'email') {
      const trimmedEmail = draft.email.trim();
      if (!trimmedEmail) {
        showToast('이메일을 입력해주세요.');
        return;
      }

      if (!isValidEmail(trimmedEmail)) {
        showToast('올바른 이메일 형식이 아닙니다.');
        return;
      }

      void handleEmailCheck(trimmedEmail);
      return;
    }

    if (step === 'password') {
      if (!passwordHasLength || !passwordHasMix) {
        showToast('비밀번호 조건을 모두 만족해야 합니다.');
        return;
      }

      setStep('name');
      return;
    }

    if (step === 'name') {
      if (!draft.name.trim()) {
        showToast('이름을 입력해주세요.');
        return;
      }

      setStep('birthday');
      return;
    }

    if (step === 'birthday') {
      if (!birthdayReady) {
        showToast('생년월일을 올바르게 입력해주세요.');
        return;
      }

      setStep('gender');
      return;
    }

   

    
  };

  const handleStart = async () => {
    if (draft.gender === null) {
      showToast('성별을 선택해주세요.');
      return;
    }

    if (loading) {
      return;
    }

    setLoading(true);

    try {
      await register({
        user_id: draft.email.trim(),
        user_pw: draft.password,
        name: draft.name.trim(),
        sex: draft.gender,
        // 현재 화면에는 아직 없는 필수 항목이라 임시값을 넣었습니다.
        // 다음 단계에서 전화번호, 생년월일, 주소 입력이 붙으면 이 부분만 바꾸면 됩니다.
        phone: draft.phone,
        birthday: formatBirthdayIso(draft.birthYear, draft.birthMonth, draft.birthDay),
        address: draft.address,
        detail_address: draft.detailAddress || null,
      });

      resetRegisterDraft();
      // setDoneModalVisible(true);
      setStep('complete');
    } catch (error) {
      const message = error instanceof Error ? error.message : '회원가입에 실패했습니다.';
      showToast(normalizeRegisterMessage(message));
    } finally {
      setLoading(false);
    }
  };

  const primaryDisabled =
    loading ||
    checkingEmail ||
    checkingPhone ||
    verifyingPhone ||
    (step === 'agreement' && !requiredAgreed) ||
    (step === 'email' && (!draft.email.trim() || !isValidEmail(draft.email.trim()))) ||
    (step === 'password' && (!passwordHasLength || !passwordHasMix)) ||
    (step === 'name' && !draft.name.trim()) ||
    (step === 'birthday' && !birthdayReady) ||
    (step === 'carrier' && (!draft.carrier || !isValidPhoneNumber(draft.phone))) ||
    (step === 'gender' && draft.gender === null);
  // 문자 인증 함수
  const handleMessagePress = async () => {
  try {
    const messageCodeResponse = await messageCode(draft.phone);

    const opened = await openSmsComposer({
      phoneNumber: messageCodeResponse.recipientNumber,
      message: messageCodeResponse.messageText,
    });

    if (!opened) {
      showToast('메시지 앱을 열 수 없습니다.');
      return;
    }

    setSmsRequested(true);
  } catch (error) {
    const message = error instanceof Error ? error.message : '인증 메시지 생성에 실패했습니다.';
    showToast(normalizeRegisterMessage(message));
  }
};

  


  const handlePrimaryPress = () => {
    if (step === 'complete') {
      router.replace('/login');
      return;
    }

    if (step === 'gender') {
      void handleStart();
      return;
    }

    if (step === 'message'){
      void handleMessagePress();
      return;
    }

    goNext();
  };

  const handleBack = () => {
    if (step === 'agreement') {
      router.back();
      return;
    }

    if (step === 'carrier') {
      setStep('agreement');
      return;
    }

    if (step === 'message') {
      setStep('carrier');
      return;
    }


    if (step === 'email') {
      setStep('message')
      return;
    }

    if (step === 'password') {
      setStep('email');
      return;
    }

    if (step === 'name') {
      setStep('password');
      return;
    }

    if (step === 'birthday') {
      setStep('name');
      return;
    }

    setStep('birthday');
  };

  return (
    <SafeAreaView style={styles.page}>
      <ToastAlert
        visible={Boolean(toastMessage)}
        message={toastMessage}
        onDismiss={() => setToastMessage('')}
        tone="info"
        toastKey={toastKey}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardWrap}
      >
        <View style={styles.screen}>
          <View style={styles.header}>
            <Pressable onPress={handleBack} hitSlop={12}>
              <Ionicons name="chevron-back" size={28} color="#4B5563" />
            </Pressable>
          </View>

          <View style={styles.content}>
            {step === 'complete' || step === 'agreement' ? null : (
              <Text style={styles.title}>{stepMeta.title}</Text>
            )}

            {step === 'agreement' ? (
              <RegisterAgreementStep
                state={agreement}
                onToggle={toggleAgreement}
                onToggleAll={toggleAllAgreements}
              />
            ) : null}

            {step === 'email' ? (
              <RegisterEmailStep onSubmit={() => void goNext()} />
            ) : null}

            {step === 'password' ? (
              <RegisterPasswordStep
                passwordVisible={passwordVisible}
                onTogglePasswordVisible={() => setPasswordVisible((current) => !current)}
              />
            ) : null}

            {step === 'name' ? (
              <RegisterNameStep onSubmit={() => void goNext()} />
            ) : null}

            {step === 'birthday' ? (
              <RegisterBirthdayStep />
            ) : null}

            {step === 'carrier' ? (
              <RegisterCarrierStep />
            ) : null}

            {step === 'message' ? (
              <RegisterMessageStep />
            ) : null}

            {step === 'gender' ? (
              <RegisterGenderStep />
            ) : null}

            {step === 'complete' ? (
              <RegisterCompleteStep />
            ) : null}

          </View>

            <View
              style={[
                styles.footer,
                Platform.OS === 'android' && keyboardHeight > 0
                  ? { paddingBottom: 0}
                  : null,
              ]}
            >
            <Pressable
              disabled={primaryDisabled}
              onPress={handlePrimaryPress}
              style={({ pressed }) => [
                styles.primaryButton,
                primaryDisabled ? styles.primaryButtonDisabled : styles.primaryButtonActive,
                pressed && !primaryDisabled ? styles.pressed : null,
              ]}
            >
              <Text style={styles.primaryButtonText}>{stepMeta.buttonText}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
