import { MuseoModerno_700Bold, useFonts as useMuseoFonts } from '@expo-google-fonts/museomoderno';
import { loadAsync } from 'expo-font';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '@/src/contexts/AuthContext';
import ToastAlert from '@/src/components/ui/ToastAlert';
import { clearSavedEmail, loadSavedEmail, saveSavedEmail } from '@/src/lib/savedEmailStorage';
import LoginLogo from '../../../assets/icons/login_logo.svg';
import GoogleIcon from '../../../assets/icons/google.svg';
import NaverIcon from '../../../assets/icons/naver.svg';
import AppleIcon from '../../../assets/icons/apple.svg';

const pretendardFont = require('../../../assets/fonts/PretendardVariable.ttf');

function isValidEmail(email: string) {
  // 서버 호출 전에 기본 이메일 형식만 먼저 확인해 불필요한 요청을 줄인다.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeLoginToastMessage(message: string) {
  // 서버와 라이브러리에서 온 에러 문구를 로그인 화면의 안내 문구로 맞춘다.
  if (message.includes('Incorrect email or password')) {
    return '아이디 혹은 비밀번호가 맞지 않아요';
  }

  if (
    message.includes('올바른 이메일 형식') ||
    message.includes('not a valid email') ||
    message.includes('email') && message.includes('422') ||
    message.includes('422')
  ) {
    return '올바른 이메일 형식이 아닙니다';
  }

  return message;
}

function Field({
  label,
  value,
  placeholder,
  secureTextEntry,
  onChangeText,
  onClear,
  onToggleSecure,
}: {
  label: string;
  value: string;
  placeholder: string;
  secureTextEntry?: boolean;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  onToggleSecure?: () => void;
}) {
  // 로그인 화면에서 이메일과 비밀번호 입력 UI를 같은 구조로 재사용한다.
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldBox}>
        <TextInput
          autoCapitalize="none"
          autoComplete={label === '이메일' ? 'email' : 'password'}
          autoCorrect={false}
          placeholder={placeholder}
          placeholderTextColor="#C7CCD7"
          secureTextEntry={secureTextEntry}
          style={[styles.fieldInput, secureTextEntry ? styles.fieldInputWithIcon : null]}
          value={value}
          onChangeText={onChangeText}
        />
        <View style={styles.fieldActions}>
          {onClear && value ? (
            <Pressable onPress={onClear} hitSlop={10} style={styles.fieldIconButton}>
              <Ionicons name="close" size={24} color="#B9C0CF" />
            </Pressable>
          ) : null}
          {onToggleSecure ? (
            <Pressable onPress={onToggleSecure} hitSlop={10} style={styles.fieldIconButton}>
              <Ionicons
                name={secureTextEntry ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color="#B9C0CF"
              />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function PrimaryButton({
  title,
  onPress,
  disabled,
  active,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primaryButton,
        active ? styles.primaryButtonActive : styles.primaryButtonInactive,
        pressed && !disabled ? styles.buttonPressed : null,
        disabled ? styles.buttonDisabled : null,
      ]}
    >
      <Text style={styles.primaryButtonText}>{title}</Text>
    </Pressable>
  );
}

function SimpleModal({
  visible,
  title,
  message,
  onClose,
}: {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
}) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>
          <Pressable onPress={onClose} style={styles.modalButton}>
            <Text style={styles.modalButtonText}>확인</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const [museoLoaded] = useMuseoFonts({ MuseoModerno_700Bold });
  const [pretendardLoaded, setPretendardLoaded] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberId, setRememberId] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastKey, setToastKey] = useState(0);

  useEffect(() => {
    loadAsync({ PretendardVariable: pretendardFont })
      .then(() => setPretendardLoaded(true))
      .catch(() => setPretendardLoaded(true));
  }, []);

  useEffect(() => {
    let active = true;

    const loadRememberedEmail = async () => {
      // 저장된 이메일이 있으면 입력값과 체크 상태를 함께 복원한다.
      const savedEmail = await loadSavedEmail();
      if (!active || !savedEmail) {
        return;
      }

      setEmail(savedEmail);
      setRememberId(true);
    };

    void loadRememberedEmail();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    // 이미 로그인된 사용자는 로그인 화면을 건너뛰고 홈으로 보낸다.
    if (!authLoading && isAuthenticated) {
      router.replace('/home');
    }
  }, [authLoading, isAuthenticated, router]);

  const fontsLoaded = museoLoaded && pretendardLoaded;
  const isLoginReady = Boolean(email.trim() && password.trim());
  const isLoginDisabled = loading || authLoading || !isLoginReady;

  const showToast = (message: string) => {
    setToastKey((current) => current + 1);
    setToastMessage(message);
  };

  const handleLogin = async () => {
    if (loading || authLoading) {
      return;
    }

    if (!email.trim()) {
      showToast('이메일을 입력해주세요.');
      return;
    }

    if (!isValidEmail(email.trim())) {
      showToast('올바른 이메일 형식이 아닙니다');
      return;
    }

    if (!password.trim()) {
      showToast('비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);

    const trimmedEmail = email.trim();

    try {
      await login({ user_id: trimmedEmail, user_pw: password });
      // 아이디 저장 선택에 맞춰 로컬 저장소의 이메일을 갱신한다.
      if (rememberId) {
        await saveSavedEmail(trimmedEmail);
      } else {
        await clearSavedEmail();
      }
      router.replace('/home');
    } catch (loginError) {
      const message = loginError instanceof Error ? loginError.message : '로그인에 실패했습니다.';
      showToast(normalizeLoginToastMessage(message));
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded) {
    return (
      <SafeAreaView style={styles.loadingPage}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#5F9F9D" />
        </View>
      </SafeAreaView>
    );
  }

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
        <View style={styles.content}>
          <View style={styles.brandArea}>
            <LoginLogo width={60} height={60} />
            <Text style={styles.brandName}>ScolioScan</Text>
            <Text style={styles.subtitle}>당신의 척추 건강을 측정합니다</Text>
          </View>

          <View style={styles.formArea}>
            <Field
              label="이메일"
              value={email}
              placeholder="이메일을 입력해주세요"
              onChangeText={setEmail}
              onClear={() => setEmail('')}
            />
            <Field
              label="비밀번호"
              value={password}
              placeholder="비밀번호를 입력해주세요"
              secureTextEntry={!passwordVisible}
              onChangeText={setPassword}
              onToggleSecure={() => setPasswordVisible((current) => !current)}
            />

            <View style={styles.helperRow}>
              <Pressable
                onPress={() => setRememberId((current) => !current)}
                style={styles.rememberWrap}
                hitSlop={8}
              >
                <View style={[styles.checkbox, rememberId && styles.checkboxChecked]}>
                  {rememberId ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
                </View>
                <Text style={styles.rememberText}>이메일 저장</Text>
              </Pressable>
            </View>

            <PrimaryButton
              title="로그인"
              onPress={() => void handleLogin()}
              disabled={isLoginDisabled}
              active={isLoginReady}
            />
            {/* 소셜 로그인 추가 후 해제 */}
            {/* <View style={styles.dividerWrap}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>또는</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialRow}>
              <Pressable
                onPress={() => setSocialModalOpen(true)}
                disabled={loading || authLoading}
                style={({ pressed }) => [styles.socialButton, pressed ? styles.buttonPressed : null]}
              >
                <GoogleIcon width={40} height={40} />
              </Pressable>
              <Pressable
                onPress={() => setSocialModalOpen(true)}
                disabled={loading || authLoading}
                style={({ pressed }) => [styles.socialButton, pressed ? styles.buttonPressed : null]}
              >
                <NaverIcon width={40} height={40} />
              </Pressable>
              <Pressable
                onPress={() => setSocialModalOpen(true)}
                disabled={loading || authLoading}
                style={({ pressed }) => [styles.socialButton, pressed ? styles.buttonPressed : null]}
              >
                <AppleIcon width={40} height={40} />
              </Pressable>
            </View> */}

            <View style={styles.signupPrompt}>
              <Text style={styles.signupPromptText}>아직 계정이 없으신가요?</Text>
              <Pressable onPress={() => router.push('/register')} hitSlop={8}>
                <Text style={styles.signupLink}>회원가입</Text>
              </Pressable>
            </View>

            <View style={styles.findAccountRow}>
              <Pressable
                onPress={() => router.push('/email-find')}
                disabled={loading || authLoading}
                hitSlop={8}
              >
                <Text style={styles.findAccountText}>아이디 찾기</Text>
              </Pressable>
              <Text style={styles.findAccountDivider}>|</Text>
              <Pressable
                onPress={() => router.push('/password-find')}
                disabled={loading || authLoading}
                hitSlop={8}
              >
                <Text style={styles.findAccountText}>비밀번호 찾기</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      <SimpleModal
        visible={socialModalOpen}
        title="소셜 로그인"
        message="소셜 로그인 기능은 준비 중입니다."
        onClose={() => setSocialModalOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingPage: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  page: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardWrap: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  brandArea: {
    alignItems: 'center',
    width: '100%',
  },
  brandName: {
    color: '#7AD7D4',
    fontFamily: 'MuseoModerno_700Bold',
    fontSize: 32,
    letterSpacing: -0.32,
    marginBottom: 8,
    marginTop: 8,
  },
  subtitle: {
    color: '#4F5564',
    fontFamily: 'PretendardVariable',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    textAlign: 'center',
  },
  formArea: {
    marginTop: 44,
    width: '100%',
    maxWidth: 296,
  },
  fieldGroup: {
    marginBottom: 16,
    width: '100%',
  },
  fieldLabel: {
    color: '#000000',
    fontFamily: 'PretendardVariable',
    fontSize: 14,
    fontWeight: '500',
    lineHeight : 20,
    marginBottom: 10,
  },
  fieldBox: {
    backgroundColor: '#F7F7F8',
    borderColor: '#DADADC',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingLeft: 18,
    paddingRight: 12,
    width: '100%',
  },
  fieldInput: {
    color: '#292929',
    flex: 1,
    fontFamily: 'PretendardVariable',
    fontSize: 15,
    fontWeight: '500',
    minHeight: 56,
    paddingVertical: 0,
    width: '100%',
  },
  fieldInputWithIcon: {
    paddingRight: 8,
  },
  fieldActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  fieldIconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
    width: 28,
  },
  helperRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  rememberWrap: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  checkbox: {
    alignItems: 'center',
    borderColor: '#8AA7A6',
    borderRadius: 6,
    borderWidth: 1.5,
    height: 22,
    justifyContent: 'center',
    marginRight: 8,
    width: 22,
  },
  checkboxChecked: {
    backgroundColor: '#5F9F9D',
    borderColor: '#5F9F9D',
  },
  rememberText: {
    color: '#000000',
    fontFamily: 'PretendardVariable',
    fontSize: 12,
  },
  findPasswordText: {
    color: '#6B7280',
    fontFamily: 'PretendardVariable',
    fontSize: 12,
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: 6,
    height: 48,
    justifyContent: 'center',
    width: '100%',
  },
  primaryButtonActive: {
    backgroundColor: '#5F9F9D',
  },
  primaryButtonInactive: {
    backgroundColor: '#CBD5D8',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: 'PretendardVariable',
    fontSize: 16,
    lineHeight: 22,
  },
  dividerWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 20,
  },
  dividerLine: {
    backgroundColor: '#D5DADF',
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    color: '#9CA3AF',
    fontFamily: 'PretendardVariable',
    fontSize: 12,
    fontWeight: '500',
    marginHorizontal: 10,
  },
  socialRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
  },
  socialButton: {
    alignItems: 'center',
    borderRadius: 999,
    justifyContent: 'center',
    height: 48,
    width: 48,
  },
  signupPrompt: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  signupPromptText: {
    color: '#6B7280',
    fontFamily: 'PretendardVariable',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  signupLink: {
    color: '#5F9F9D',
    fontFamily: 'PretendardVariable',
    fontSize: 12,
    lineHeight: 20,
    marginLeft: 4,
  },
  findAccountRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  findAccountText: {
    color: '#6B7280',
    fontFamily: 'PretendardVariable',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 20,
  },
  findAccountDivider: {
    color: '#94A3B8',
    fontFamily: 'PretendardVariable',
    fontSize: 12,
    marginHorizontal: 8,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.35)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    maxWidth: 320,
    paddingHorizontal: 20,
    paddingVertical: 20,
    width: '100%',
  },
  modalTitle: {
    color: '#1F2937',
    fontFamily: 'PretendardVariable',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    color: '#4B5563',
    fontFamily: 'PretendardVariable',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  modalButton: {
    alignItems: 'center',
    backgroundColor: '#5F9F9D',
    borderRadius: 6,
    height: 42,
    justifyContent: 'center',
    marginTop: 18,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontFamily: 'PretendardVariable',
    fontSize: 15,
    fontWeight: '600',
  },
});
