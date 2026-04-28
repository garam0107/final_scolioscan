import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { useAuthStore } from '@/src/store/authStore';
import ToastAlert from '@/src/components/ui/ToastAlert';
import RegisterBirthdayStep from './RegisterBirthdayStep';
import RegisterCarrierStep from './RegisterCarrierStep';
import RegisterEmailStep from './RegisterEmailStep';
import RegisterGenderStep from './RegisterGenderStep';
import RegisterNameStep from './RegisterNameStep';
import RegisterPasswordStep from './RegisterPasswordStep';
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

type RegisterStep = 'email' | 'password' | 'name' | 'birthday' | 'carrier' | 'gender';

export default function RegisterScreen() {
  const router = useRouter();
  const { checkEmail, register } = useAuth();
  const draft = useAuthStore((state) => state.registerDraft);
  const resetRegisterDraft = useAuthStore((state) => state.resetRegisterDraft);
  const [step, setStep] = useState<RegisterStep>('email');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastKey, setToastKey] = useState(0);
  const [doneModalVisible, setDoneModalVisible] = useState(false);
  const passwordHasLength = hasPasswordLength(draft.password);
  const passwordHasMix = hasPasswordMix(draft.password);
  const birthdayReady = isValidBirthday(draft.birthYear, draft.birthMonth, draft.birthDay);

  useEffect(() => {
    // 회원가입 화면에 들어올 때마다 임시 입력값을 초기화합니다.
    resetRegisterDraft();

    return () => {
      // 화면을 떠날 때도 다시 비워서 다음 진입 시 이전 값이 남지 않게 합니다.
      resetRegisterDraft();
    };
  }, [resetRegisterDraft]);

  const stepMeta = useMemo(() => {
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

    if (step === 'carrier') {
      return {
        title: draft.carrier ? '휴대전화 번호를\n입력해주세요' : '이용하고 계신\n통신사를 알려주세요',
        buttonText: '계속하기',
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

  const goNext = () => {
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

      setStep('gender');
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
      setDoneModalVisible(true);
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
    (step === 'email' && (!draft.email.trim() || !isValidEmail(draft.email.trim()))) ||
    (step === 'password' && (!passwordHasLength || !passwordHasMix)) ||
    (step === 'name' && !draft.name.trim()) ||
    (step === 'birthday' && !birthdayReady) ||
    (step === 'carrier' && (!draft.carrier || !isValidPhoneNumber(draft.phone))) ||
    (step === 'gender' && draft.gender === null);

  const handlePrimaryPress = () => {
    if (step === 'gender') {
      void handleStart();
      return;
    }

    goNext();
  };

  const handleBack = () => {
    if (step === 'email') {
      router.back();
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

    if (step === 'carrier') {
      setStep('birthday');
      return;
    }

    setStep('carrier');
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
            <Pressable onPress={handleBack} hitSlop={12} style={styles.backButton}>
              <Ionicons name="chevron-back" size={28} color="#4B5563" />
            </Pressable>
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>{stepMeta.title}</Text>

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

            {step === 'gender' ? (
              <RegisterGenderStep />
            ) : null}
          </View>

          <View style={styles.footer}>
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

      <Modal transparent animationType="fade" visible={doneModalVisible} onRequestClose={() => setDoneModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setDoneModalVisible(false)} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>회원가입 완료</Text>
            <Text style={styles.modalMessage}>가입이 완료되었습니다. 로그인 화면으로 이동합니다.</Text>
            <Pressable
              onPress={() => {
                setDoneModalVisible(false);
                router.replace('/login');
              }}
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>확인</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
