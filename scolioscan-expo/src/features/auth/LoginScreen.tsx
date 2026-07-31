import { i18n } from '@/src/i18n';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MuseoModerno_700Bold, useFonts as useMuseoFonts } from '@expo-google-fonts/museomoderno';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { login as kakaoLogin } from '@react-native-seoul/kakao-login';
import NaverLogin from '@react-native-seoul/naver-login';
import * as AppleAuthentication from 'expo-apple-authentication';
import { loadAsync } from 'expo-font';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
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
import { useAuthStore } from '@/src/store/authStore';
import type { SocialAuthResponse } from '@/src/types/auth';
import AppleIcon from '../../../assets/icons/apple.svg';
import GoogleIcon from '../../../assets/icons/google.svg';
import KakaoIcon from '../../../assets/icons/kakao.svg';
import LoginLogo from '../../../assets/icons/login_logo.svg';
import NaverIcon from '../../../assets/icons/naver.svg';
import styles from './login.styles';


const pretendardFont = require('../../../assets/fonts/PretendardVariable.ttf');
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

function isValidEmail(email: string) {
  // 서버 요청 전에 기본 이메일 형식을 먼저 확인해 불필요한 요청을 줄인다.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeLoginToastMessage(message: string) {
  // 서버와 SDK 오류를 로그인 화면 안내 문구로 통일한다.
  if (message.includes('Incorrect email or password')) {
    return '아이디 또는 비밀번호가 맞지 않습니다.';
  }

  if (
    message.includes('sign in cancelled') ||
    message.includes('SIGN_IN_CANCELLED') ||
    message.includes('cancelled') ||
    message.includes('canceled')
  ) {
    return '로그인을 취소했어요.';
  }

  if (
    message.includes('올바른 이메일 형식') ||
    message.includes('not a valid email') ||
    (message.includes('email') && message.includes('422')) ||
    message.includes('422')
  ) {
    return '올바른 이메일 형식이 아닙니다.';
  }

  return message;
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
  // 로그인 화면에서 입력 UI를 같은 구조로 재사용한다.
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldBox}>
        <TextInput
          autoCapitalize="none"
          autoComplete={label === i18n.t("이메일") ? 'email' : 'password'}
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
  const {
    login,
    verifyGoogleSocialLogin,
    verifyKakaoSocialLogin,
    verifyNaverSocialLogin,
    verifyAppleSocialLogin,
    linkSocialAccount,
    isAuthenticated,
    loading: authLoading,
  } = useAuth();
  const [museoLoaded] = useMuseoFonts({ MuseoModerno_700Bold });
  const [pretendardLoaded, setPretendardLoaded] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberId, setRememberId] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastKey, setToastKey] = useState(0);
  const [isSocialLinkLoginMode, setIsSocialLinkLoginMode] = useState(false);
  const [showSocialDecisionModal, setShowSocialDecisionModal] = useState(false);
  const [appleLoginAvailable, setAppleLoginAvailable] = useState(false);
  const socialDecision = useAuthStore((state) => state.pendingSocialDecision);
  const setPendingSocialDecision = useAuthStore((state) => state.setPendingSocialDecision);


  useEffect(() => {
    loadAsync({ PretendardVariable: pretendardFont })
      .then(() => setPretendardLoaded(true))
      .catch(() => setPretendardLoaded(true));
  }, []);

  useEffect(() => {
    let active = true;

    if (Platform.OS !== 'ios') {
      return () => {
        active = false;
      };
    }

    // 실제 기기에서 Apple 인증 사용 가능 여부를 확인한 뒤에만 공식 버튼을 노출한다.
    void AppleAuthentication.isAvailableAsync()
      .then((isAvailable) => {
        if (active) {
          setAppleLoginAvailable(isAvailable);
        }
      })
      .catch(() => {
        if (active) {
          setAppleLoginAvailable(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    // 구글 SDK가 id_token을 반환하도록 웹 클라이언트 ID를 설정한다.
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      iosClientId: GOOGLE_IOS_CLIENT_ID,
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

    if (socialDecision.provider === 'naver') {
      return '네이버';
    }

    return '애플';
  }, [socialDecision]);

  const showToast = (message: string) => {
    setToastKey((current) => current + 1);
    setToastMessage(message);
  };

  const resetSocialDecisionModal = () => {
    setIsSocialLinkLoginMode(false);
    setShowSocialDecisionModal(false);
    setPendingSocialDecision(null);
  };
  const hideSocialDecisionModal = () => {
    setShowSocialDecisionModal(false);
    setIsSocialLinkLoginMode(true);
  };
  const handleSocialAuthResponse = async (response: SocialAuthResponse) => {
    if (response.status === 'login_success') {
      resetSocialDecisionModal();
      return;
    }

    // 미연결 계정이면 기존 계정 로그인 또는 회원가입 모달로 분기한다.
    setPendingSocialDecision({
      provider: response.provider,
      providerEmail: response.provider_email ?? null,
      socialTempToken: response.social_temp_token,
    });
    setShowSocialDecisionModal(true);
  };

  const handleLogin = async () => {
    if (isBusy) {
      return;
    }

    if (!email.trim()) {
      showToast(i18n.t("이메일을 입력해 주세요."));
      return;
    }

    if (!isValidEmail(email.trim())) {
      showToast(i18n.t("올바른 이메일 형식이 아닙니다."));
      return;
    }

    if (!password.trim()) {
      showToast(i18n.t("비밀번호를 입력해 주세요."));
      return;
    }

    setLoading(true);

    const trimmedEmail = email.trim();

    try {
      if (socialDecision) {
        await linkSocialAccount({
          user_id: trimmedEmail,
          user_pw: password,
          social_temp_token: socialDecision.socialTempToken,
        });
        setShowSocialDecisionModal(false);
        setPendingSocialDecision(null);
      } else {
        await login({ user_id: trimmedEmail, user_pw: password });
      }
      // 이메일 저장 선택에 맞춰 로컬 저장소 값을 갱신한다.
      if (rememberId) {
        await saveSavedEmail(trimmedEmail);
      } else {
        await clearSavedEmail();
      }
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
      showToast(i18n.t("구글 로그인 설정이 아직 완료되지 않았어요."));
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
        return;
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

  const handleKakaoLogin = async () => {
    if (isBusy) {
      return;
    }

    setLoading(true);

    try {
      // 카카오 SDK 로그인 결과의 access token을 백엔드 verify API로 전달한다.
      
      const token = await kakaoLogin();
     
      if (!token.accessToken) {
        throw new Error('카카오 access token을 받지 못했습니다.');
      }
 
      const response = await verifyKakaoSocialLogin(token.accessToken);
      await handleSocialAuthResponse(response);
    } catch (error) {
    
      const message = error instanceof Error ? error.message : '카카오 로그인에 실패했습니다.';
      if (message.includes('cancelled') || message.includes('canceled')) {
       
        return;
      }
      showToast(normalizeLoginToastMessage(message));
    } finally {
      setLoading(false);
    }
  };

  const handleNaverLogin = async () => {
    if (isBusy) {
      return;
    }

    setLoading(true);

    try {
      // 네이버 SDK 로그인 결과의 access token을 백엔드 verify API로 전달한다.
      const result = await NaverLogin.login();
      const successResponse = (result as { successResponse?: { accessToken?: string } }).successResponse;
      const failureResponse = (result as { failureResponse?: { message?: string; isCancel?: boolean } }).failureResponse;

      if (failureResponse?.isCancel) {
        return;
      }

      const accessToken = successResponse?.accessToken;
      if (!accessToken) {
        throw new Error(failureResponse?.message ?? '네이버 access token을 받지 못했습니다.');
      }

      const response = await verifyNaverSocialLogin(accessToken);
      await handleSocialAuthResponse(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : '네이버 로그인에 실패했습니다.';
      if (message.includes('cancelled') || message.includes('canceled')) {
        return;
      }
      showToast(normalizeLoginToastMessage(message));
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    if (isBusy || !appleLoginAvailable) {
      return;
    }

    setLoading(true);

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken || !credential.authorizationCode) {
        throw new Error(i18n.t('애플 인증 정보를 받지 못했습니다.'));
      }

      const response = await verifyAppleSocialLogin(
        credential.identityToken,
        credential.authorizationCode,
        [credential.fullName?.givenName, credential.fullName?.familyName]
          .filter(Boolean)
          .join(' ') || null,
      );
      await handleSocialAuthResponse(response);
    } catch (error) {
      const errorCode =
        typeof error === 'object' && error !== null && 'code' in error
          ? String((error as { code?: unknown }).code)
          : '';

      if (errorCode === 'ERR_REQUEST_CANCELED') {
        return;
      }

      const message =
        error instanceof Error ? error.message : i18n.t('애플 로그인에 실패했습니다.');
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
    hideSocialDecisionModal();
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
        visible={showSocialDecisionModal}
        loading={isBusy}
        providerLabel={socialProviderLabel}
        providerEmail={socialDecision?.providerEmail ?? null}
        onClose={resetSocialDecisionModal}
        onHasAccount={handleUseExistingAccount}
        onNeedSignup={handleMoveToSocialSignup}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardWrap}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.brandArea}>
              <LoginLogo width={60} height={60} />
              <Text style={styles.brandName}>ScolioScan</Text>
              <Text style={styles.subtitle}>{i18n.t("당신의 척추 건강을 측정합니다")}</Text>
              {isSocialLinkLoginMode  ? (
              <View style={styles.socialLinkGuideBox}>
                <Text style={styles.socialLinkGuideText}>{i18n.t("가입하신 ScolioScan 계정으로 로그인하시면")}</Text>
                <Text style={styles.socialLinkGuideTextCenter}>{i18n.t("Social 계정을 연동할게요.")}</Text>
              </View>
            ) : null}
            </View>


            <View style={styles.formArea}>
              <Field
                label={i18n.t("이메일")}
                value={email}
                placeholder={i18n.t("이메일을 입력해 주세요")}
                onChangeText={setEmail}
                onClear={() => setEmail('')}
              />
              <Field
                label={i18n.t("비밀번호")}
                value={password}
                placeholder={i18n.t("비밀번호를 입력해 주세요")}
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
                  <Text style={styles.rememberText}>{i18n.t("이메일 저장")}</Text>
                </Pressable>
              </View>

              <PrimaryButton
                title={i18n.t("로그인")}
                onPress={() => void handleLogin()}
                disabled={isLoginDisabled}
                active={isLoginReady}
              />
              <View style={styles.dividerWrap}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{i18n.t("또는")}</Text>
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
                  onPress={() => void handleNaverLogin()}
                  disabled={isBusy}
                  style={({ pressed }) => [styles.socialButton, pressed ? styles.buttonPressed : null]}
                >
                  <NaverIcon width={40} height={40} />
                </Pressable>
                <Pressable
                  onPress={() => void handleKakaoLogin()}
                  disabled={isBusy}
                  style={({ pressed }) => [styles.socialButton, pressed ? styles.buttonPressed : null]}
                >
                  <KakaoIcon width={40} height={40} />
                </Pressable>
                {appleLoginAvailable ? (
                  <Pressable
                    accessibilityLabel={i18n.t('Apple로 로그인')}
                    accessibilityRole="button"
                    onPress={() => void handleAppleLogin()}
                    disabled={isBusy}
                    style={({ pressed }) => [
                      styles.socialButton,
                      pressed ? styles.buttonPressed : null,
                    ]}
                  >
                    <AppleIcon width={40} height={40} />
                  </Pressable>
                ) : null}
              </View>

              <View style={styles.signupPrompt}>
                <Text style={styles.signupPromptText}>{i18n.t("아직 계정이 없으신가요?")}</Text>
                <Pressable onPress={() => router.push('/register')} hitSlop={8}>
                  <Text style={styles.signupLink}>{i18n.t("회원가입")}</Text>
                </Pressable>
              </View>

              <View style={styles.findAccountRow}>
                <Pressable
                  onPress={() => router.push('/email-find')}
                  disabled={isBusy}
                  hitSlop={8}
                >
                  <Text style={styles.findAccountText}>{i18n.t("이메일 찾기")}</Text>
                </Pressable>
                <Text style={styles.findAccountDivider}>|</Text>
                <Pressable
                  onPress={() => router.push('/password-find')}
                  disabled={isBusy}
                  hitSlop={8}
                >
                  <Text style={styles.findAccountText}>{i18n.t("비밀번호 찾기")}</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
