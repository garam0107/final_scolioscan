import Ionicons from '@expo/vector-icons/Ionicons';
import { MuseoModerno_700Bold, useFonts as useMuseoFonts } from '@expo-google-fonts/museomoderno';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { loadAsync } from 'expo-font';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ToastAlert from '@/src/components/ui/ToastAlert';
import { useAuth } from '@/src/contexts/AuthContext';
import SocialAccountDecisionModal from '@/src/features/auth/components/SocialAccountDecisionModal';
import { clearSavedEmail, loadSavedEmail, saveSavedEmail } from '@/src/lib/savedEmailStorage';
import type { SocialAuthResponse, SocialProvider } from '@/src/types/auth';
import GoogleIcon from '../../../assets/icons/google.svg';
import KakaoIcon from '../../../assets/icons/kakao.svg';
import LoginLogo from '../../../assets/icons/login_logo.svg';
import NaverIcon from '../../../assets/icons/naver.svg';
import styles from './login.styles';

const pretendardFont = require('../../../assets/fonts/PretendardVariable.ttf');
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

type SocialDecisionState = {
  provider: SocialProvider;
  providerEmail: string | null;
  socialTempToken: string;
};

WebBrowser.maybeCompleteAuthSession();

function isValidEmail(email: string) {
  // 서버 요청 전에 기본 이메일 형식만 먼저 확인해 불필요한 요청을 줄인다.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeLoginToastMessage(message: string) {
  // 서버와 라이브러리 오류 문구를 로그인 화면에서 쓰는 안내 문구로 정리한다.
  if (message.includes('Incorrect email or password')) {
    return '아이디 또는 비밀번호가 맞지 않아요.';
  }

  if (message.includes('sign in cancelled')) {
    return '로그인을 취소했어요.';
  }

  if (
    message.includes('올바른 이메일 형식') ||
    message.includes('not a valid email') ||
    (message.includes('email') && message.includes('422')) ||
    message.includes('422')
  ) {
    return '올바른 이메일 형식이 아니에요.';
  }

  return message;
}

function getQueryParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return typeof value === 'string' && value.trim() ? value : null;
}

function extractGoogleIdToken(result: unknown) {
  if (typeof result !== 'object' || result === null) {
    return null;
  }

  const payload = result as {
    idToken?: string;
    data?: {
      idToken?: string;
    };
  };

  return payload.idToken ?? payload.data?.idToken ?? null;
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

export default function LoginScreen() {
  const router = useRouter();
  const { login, verifyGoogleSocialLogin, exchangeSocialTicket, isAuthenticated, loading: authLoading } = useAuth();
  const [museoLoaded] = useMuseoFonts({ MuseoModerno_700Bold });
  const [pretendardLoaded, setPretendardLoaded] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberId, setRememberId] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastKey, setToastKey] = useState(0);
  const [socialDecision, setSocialDecision] = useState<SocialDecisionState | null>(null);

  useEffect(() => {
    loadAsync({ PretendardVariable: pretendardFont })
      .then(() => setPretendardLoaded(true))
      .catch(() => setPretendardLoaded(true));
  }, []);

  useEffect(() => {
    // 구글 SDK는 웹 클라이언트 ID를 기준으로 id_token을 발급하도록 초기에 설정한다.
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
    });
  }, []);

  useEffect(() => {
    let active = true;

    const loadRememberedEmail = async () => {
      // 저장한 이메일이 있으면 입력값과 체크 상태를 함께 복원한다.
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
    // 이미 로그인한 사용자는 로그인 화면을 건너뛰고 홈으로 보낸다.
    if (!authLoading && isAuthenticated) {
      router.replace('/home');
    }
  }, [authLoading, isAuthenticated, router]);

  const fontsLoaded = museoLoaded && pretendardLoaded;
  const isLoginReady = Boolean(email.trim() && password.trim());
  const isBusy = loading || authLoading;
  const isLoginDisabled = isBusy || !isLoginReady;

  const socialProviderLabel = useMemo(() => {
    if (!socialDecision) {
      return '';
    }

    if (socialDecision.provider === 'google') {
      return '구글';
    }

    if (socialDecision.provider === 'kakao') {
      return '카카오';
    }

    return '네이버';
  }, [socialDecision]);

  const showToast = (message: string) => {
    setToastKey((current) => current + 1);
    setToastMessage(message);
  };

  const resetSocialDecisionModal = () => {
    // 계정 유무 확인 모달을 닫을 때는 소셜 분기 상태만 정리한다.
    setSocialDecision(null);
  };

  const handleSocialAuthResponse = async (response: SocialAuthResponse) => {
    if (response.status === 'login_success') {
      resetSocialDecisionModal();
      router.replace('/home');
      return;
    }

    // 미연결 계정은 로그인 화면에서 기존 계정 로그인 또는 회원가입으로만 분기시킨다.
    setSocialDecision({
      provider: response.provider,
      providerEmail: response.provider_email ?? null,
      socialTempToken: response.social_temp_token,
    });
  };

  const handleLogin = async () => {
    if (isBusy) {
      return;
    }

    if (!email.trim()) {
      showToast('이메일을 입력해주세요.');
      return;
    }

    if (!isValidEmail(email.trim())) {
      showToast('올바른 이메일 형식이 아니에요.');
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

  const handleGoogleLogin = async () => {
    if (isBusy) {
      return;
    }

    if (!GOOGLE_WEB_CLIENT_ID) {
      showToast('구글 로그인 설정이 아직 완료되지 않았어요.');
      return;
    }

    setLoading(true);

    try {
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices();
      }

      const signInResult = await GoogleSignin.signIn();
      const idToken = extractGoogleIdToken(signInResult);
      if (!idToken) {
        throw new Error('Google id_token을 가져오지 못했어요.');
      }

      const response = await verifyGoogleSocialLogin(idToken);
      await handleSocialAuthResponse(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : '구글 로그인에 실패했습니다.';
      if (message.includes('cancelled') || message.includes('SIGN_IN_CANCELLED')) {
        return;
      }
      showToast(normalizeLoginToastMessage(message));
    } finally {
      setLoading(false);
    }
  };

  const handleBrowserSocialLogin = async (provider: Extract<SocialProvider, 'kakao' | 'naver'>) => {
    if (isBusy) {
      return;
    }

    if (!API_BASE_URL) {
      showToast('API 주소가 설정되지 않았어요.');
      return;
    }

    setLoading(true);

    try {
      const redirectUrl = `scolioscan://oauth/${provider}`;
      const authUrl = `${API_BASE_URL}/auth/oauth/${provider}/start`;
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

      // 동의 화면에서 취소하면 로그인 화면에 그대로 머무르도록 별도 오류 처리 없이 종료한다.
      if (result.type !== 'success' || !result.url) {
        return;
      }

      const { queryParams } = Linking.parse(result.url);
      const ticket = getQueryParam(queryParams?.ticket);
      const error = getQueryParam(queryParams?.error);
      const errorDescription = getQueryParam(queryParams?.error_description);

      if (error) {
        if (error === 'access_denied') {
          return;
        }

        throw new Error(errorDescription ?? error);
      }

      if (!ticket) {
        throw new Error('소셜 로그인 티켓을 받지 못했어요.');
      }

      const response = await exchangeSocialTicket(ticket);
      await handleSocialAuthResponse(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : '소셜 로그인에 실패했습니다.';
      showToast(normalizeLoginToastMessage(message));
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToSocialSignup = () => {
    if (!socialDecision) {
      return;
    }

    router.push({
      pathname: '/register',
      params: {
        social_provider: socialDecision.provider,
        social_temp_token: socialDecision.socialTempToken,
        provider_email: socialDecision.providerEmail ?? '',
      },
    });
    resetSocialDecisionModal();
  };

  const handleUseExistingAccount = () => {
  
    resetSocialDecisionModal();
   
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
      <SocialAccountDecisionModal
        visible={socialDecision !== null}
        loading={isBusy}
        providerLabel={socialProviderLabel}
        providerEmail={socialDecision?.providerEmail ?? null}
        onClose={resetSocialDecisionModal}
        onHasAccount={handleUseExistingAccount}
        onNeedSignup={handleMoveToSocialSignup}
      />
      {loading ? (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#2C9696" />
            <Text style={styles.loadingText}>로그인 중입니다...</Text>
          </View>
        </View>
      ) : null}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardWrap}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
              <View style={styles.dividerWrap}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>또는</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialRow}>
                <Pressable
                  onPress={() => void handleGoogleLogin()}
                  disabled={isBusy}
                  style={({ pressed }) => [styles.socialButton, pressed ? styles.buttonPressed : null]}
                >
                  <GoogleIcon width={40} height={40} />
                </Pressable>
                <Pressable
                  onPress={() => void handleBrowserSocialLogin('naver')}
                  disabled={isBusy}
                  style={({ pressed }) => [styles.socialButton, pressed ? styles.buttonPressed : null]}
                >
                  <NaverIcon width={40} height={40} />
                </Pressable>
                <Pressable
                  onPress={() => void handleBrowserSocialLogin('kakao')}
                  disabled={isBusy}
                  style={({ pressed }) => [styles.socialButton, pressed ? styles.buttonPressed : null]}
                >
                  <KakaoIcon width={40} height={40} />
                </Pressable>
              </View>

              <View style={styles.signupPrompt}>
                <Text style={styles.signupPromptText}>아직 계정이 없으신가요?</Text>
                <Pressable onPress={() => router.push('/register')} hitSlop={8}>
                  <Text style={styles.signupLink}>회원가입</Text>
                </Pressable>
              </View>

              <View style={styles.findAccountRow}>
                <Pressable
                  onPress={() => router.push('/email-find')}
                  disabled={isBusy}
                  hitSlop={8}
                >
                  <Text style={styles.findAccountText}>이메일 찾기</Text>
                </Pressable>
                <Text style={styles.findAccountDivider}>|</Text>
                <Pressable
                  onPress={() => router.push('/password-find')}
                  disabled={isBusy}
                  hitSlop={8}
                >
                  <Text style={styles.findAccountText}>비밀번호 찾기</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
