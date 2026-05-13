import { Ionicons } from '@expo/vector-icons';
import { CommonActions, useNavigation } from '@react-navigation/native';
import * as Device from 'expo-device';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { LayoutChangeEvent, ScrollView as ScrollViewType } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { userAPI } from '@/src/api/user';
import PrimaryButton from '@/src/components/ui/PrimaryButton';
import ToastAlert from '@/src/components/ui/ToastAlert';
import { useAuth } from '@/src/contexts/AuthContext';
import {
  formatBirthdayIso,
  formatPhoneNumber,
  isValidBirthday,
  isValidPhoneNumber,
  normalizePhoneNumber,
} from '@/src/features/auth/registerValidation';
import styles from '@/src/features/settings/accountManage.styles';

type GenderValue = 'male' | 'female';
type ToastTone = 'info' | 'success' | 'warning' | 'error';

const DEVICE_MODEL_NAMES: Record<string, string> = {
  'SM-G981N': 'Galaxy S20 5G',
  'SM-G986N': 'Galaxy S20+ 5G',
  'SM-G988N': 'Galaxy S20 Ultra 5G',
  'SM-G991N': 'Galaxy S21 5G',
  'SM-G996N': 'Galaxy S21+ 5G',
  'SM-G998N': 'Galaxy S21 Ultra 5G',
  'SM-S901N': 'Galaxy S22',
  'SM-S906N': 'Galaxy S22+',
  'SM-S908N': 'Galaxy S22 Ultra',
  'SM-S911N': 'Galaxy S23',
  'SM-S916N': 'Galaxy S23+',
  'SM-S918N': 'Galaxy S23 Ultra',
  'SM-S921N': 'Galaxy S24',
  'SM-S926N': 'Galaxy S24+',
  'SM-S928N': 'Galaxy S24 Ultra',
  'SM-S931N': 'Galaxy S25',
  'SM-S936N': 'Galaxy S25+',
  'SM-S938N': 'Galaxy S25 Ultra',
};

function splitBirthday(birthday?: string) {
  // 서버 생년월일 문자열을 입력칸 세 개에서 쓰기 쉬운 값으로 나눈다.
  if (!birthday) {
    return { year: '', month: '', day: '' };
  }

  const datePart = birthday.split(/[T ]/)[0];
  const [year, month, day] = datePart.split(/[-/.]/);

  return {
    year: year || '',
    month: month?.padStart(2, '0') || '',
    day: day?.padStart(2, '0') || '',
  };
}

function normalizeBirthdayInput(value: string, maxLength: number) {
  // 생년월일 입력은 숫자만 남기고 각 칸의 최대 길이를 제한한다.
  return value.replace(/\D/g, '').slice(0, maxLength);
}

function normalizeApiError(error: unknown) {
  // API 응답과 일반 오류를 토스트에 보여줄 수 있는 한 줄 메시지로 정리한다.
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { detail?: string } } }).response;
    const detail = response?.data?.detail;

    if (typeof detail === 'string' && detail.trim()) {
      return detail;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return '요청 처리 중 오류가 발생했습니다.';
}

function getCurrentDeviceLabel() {
  // 기기 모델 코드가 그대로 보이지 않도록 가능한 경우 사용자 친화적인 모델명으로 바꾼다.
  const modelName = Device.modelName?.trim();
  const modelId = Device.modelId?.trim();
  const deviceName = Device.deviceName?.trim();
  const manufacturer = Device.manufacturer;
  const mappedModelName = DEVICE_MODEL_NAMES[modelName || ''] || DEVICE_MODEL_NAMES[modelId || ''];

  if (mappedModelName) {
    return mappedModelName;
  }

  if (modelName && !/^SM-[A-Z0-9]+$/i.test(modelName)) {
    return modelName;
  }

  if (deviceName && !/^SM-[A-Z0-9]+$/i.test(deviceName)) {
    return deviceName;
  }

  if (manufacturer && modelName && !modelName.toLowerCase().includes(manufacturer.toLowerCase())) {
    return `${manufacturer} ${modelName}`;
  }

  if (modelName) {
    return modelName;
  }

  if (Platform.OS === 'ios') {
    return 'iPhone';
  }

  if (Platform.OS === 'android') {
    return 'Android 기기';
  }

  return '현재 기기';
}

function normalizeRegionName(regionName: string) {
  const regionAliases: Record<string, string> = {
    서울특별시: '서울',
    부산광역시: '부산',
    대구광역시: '대구',
    인천광역시: '인천',
    광주광역시: '광주',
    대전광역시: '대전',
    울산광역시: '울산',
    세종특별자치시: '세종',
    경기도: '경기',
    강원도: '강원',
    강원특별자치도: '강원',
    충청북도: '충북',
    충청남도: '충남',
    전라북도: '전북',
    전북특별자치도: '전북',
    전라남도: '전남',
    경상북도: '경북',
    경상남도: '경남',
    제주특별자치도: '제주',
  };

  return regionAliases[regionName] || regionName.replace(/특별자치시|특별자치도|특별시|광역시|도|시$/g, '');
}

function formatLocationAddress(address?: Location.LocationGeocodedAddress) {
  // 위치 권한이 허용된 경우 설정 화면에 시도 단위의 짧은 위치만 표시한다.
  if (!address) {
    return '위치 확인 완료';
  }

  const regionName = address.city || address.region || address.country;

  return regionName ? normalizeRegionName(regionName) : '위치 확인 완료';
}

function Field({
  label,
  value,
  placeholder,
  onChangeText,
  keyboardType,
  textContentType,
  autoComplete,
  autoCorrect = false,
  maxLength,
  rightElement,
  onFocus,
  editable = true,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'email-address' | 'number-pad' | 'phone-pad';
  textContentType?: 'name' | 'emailAddress' | 'telephoneNumber' | 'none';
  autoComplete?: 'name' | 'email' | 'tel' | 'off';
  autoCorrect?: boolean;
  maxLength?: number;
  rightElement?: React.ReactNode;
  onFocus?: () => void;
  editable?: boolean;
}) {
  // 계정 관리 입력 필드는 라벨, 입력, 우측 버튼 구조를 공통으로 사용한다.
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          value={value}
          placeholder={placeholder}
          placeholderTextColor="#B6BECE"
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          textContentType={textContentType}
          autoComplete={autoComplete}
          autoCorrect={autoCorrect}
          maxLength={maxLength}
          onFocus={onFocus}
          editable={editable}
          style={styles.input}
        />
        {rightElement}
      </View>
    </View>
  );
}

export default function AccountManageScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ toast?: string }>();
  const insets = useSafeAreaInsets();
  const { user, refreshSession, logout } = useAuth();

  const [name, setName] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [gender, setGender] = useState<GenderValue>('male');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [withdrawPassword, setWithdrawPassword] = useState('');
  const [withdrawErrorMessage, setWithdrawErrorMessage] = useState('');
  const [withdrawCompleteVisible, setWithdrawCompleteVisible] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastTone, setToastTone] = useState<ToastTone>('info');
  const [toastKey, setToastKey] = useState(0);
  const [deviceName, setDeviceName] = useState(getCurrentDeviceLabel());
  const [deviceMeta, setDeviceMeta] = useState('위치 확인 중');
  const scrollViewRef = useRef<ScrollViewType | null>(null);
  const [phoneFieldY, setPhoneFieldY] = useState(0);

  useEffect(() => {
    // 세션 사용자 정보가 바뀌면 화면 입력값도 최신 계정 정보로 맞춘다.
    const birthday = splitBirthday(user?.birthday);

    setName(user?.name || '');
    setBirthYear(birthday.year);
    setBirthMonth(birthday.month);
    setBirthDay(birthday.day);
    setGender(user?.sex === false ? 'female' : 'male');
    setPhone(user?.phone || '');
    setEmail(user?.user_id || '');
  }, [user]);

  useEffect(() => {
    // 비밀번호 변경 화면에서 돌아온 경우 한 번만 성공 토스트를 보여준다.
    if (params.toast !== 'passwordChanged') {
      return;
    }

    showToast('비밀번호가 변경되었습니다.', 'success');
    router.setParams({ toast: undefined });
  }, [params.toast, router]);

  useEffect(() => {
    let isMounted = true;

    async function loadDeviceLocation() {
      // 현재 로그인 기기와 최근 위치를 가져와 기기 목록 영역에 표시한다.
      setDeviceName(getCurrentDeviceLabel());

      try {
        const permission = await Location.requestForegroundPermissionsAsync();

        if (permission.status !== 'granted') {
          if (isMounted) {
            setDeviceMeta('위치 권한 필요 · 로그인 중');
          }
          return;
        }

        const lastKnownLocation = await Location.getLastKnownPositionAsync({
          maxAge: 1000 * 60 * 5,
        });
        const location =
          lastKnownLocation ??
          (await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          }));

        const [address] = await Location.reverseGeocodeAsync(location.coords);

        if (isMounted) {
          setDeviceMeta(`${formatLocationAddress(address)} · 방금 전`);
        }
      } catch {
        if (isMounted) {
          setDeviceMeta('위치 확인 실패 · 로그인 중');
        }
      }
    }

    void loadDeviceLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  function handleFieldLayout(setter: (value: number) => void) {
    return (event: LayoutChangeEvent) => {
      setter(event.nativeEvent.layout.y);
    };
  }

  function scrollToField(y: number) {
    // 키보드가 올라왔을 때 전화번호 입력칸이 가려지지 않도록 살짝 위로 이동한다.
    scrollViewRef.current?.scrollTo({
      y: Math.max(0, y - 30),
      animated: true,
    });
  }

  function showToast(message: string, tone: ToastTone = 'info') {
    setToastKey((current) => current + 1);
    setToastTone(tone);
    setToastMessage(message);
  }

  function closeWithdrawModal() {
    if (withdrawing) {
      return;
    }

    setWithdrawModalVisible(false);
    setWithdrawPassword('');
    setWithdrawErrorMessage('');
  }

  const initialBirthday = splitBirthday(user?.birthday);
  const initialGender: GenderValue = user?.sex === false ? 'female' : 'male';
  const hasChanges =
    // 서버에 저장된 값과 달라진 항목이 있을 때만 저장 버튼을 활성화한다.
    name !== (user?.name || '') ||
    phone !== (user?.phone || '') ||
    birthYear !== initialBirthday.year ||
    birthMonth !== initialBirthday.month ||
    birthDay !== initialBirthday.day ||
    gender !== initialGender;
  const canSave = hasChanges && !saving;

  async function handleSave() {
    // 저장 전에 필수값과 형식을 다시 확인해 잘못된 프로필 갱신을 막는다.
    if (!canSave) {
      return;
    }

    if (!name.trim()) {
      showToast('이름을 입력해주세요.', 'warning');
      return;
    }

    if (!isValidPhoneNumber(phone)) {
      showToast('연락처를 올바르게 입력해주세요.', 'warning');
      return;
    }

    if (!isValidBirthday(birthYear, birthMonth, birthDay)) {
      showToast('생년월일을 올바르게 입력해주세요.', 'warning');
      return;
    }

    try {
      setSaving(true);
      await userAPI.updateUserProfile({
        name: name.trim(),
        phone,
        address: user?.address ?? null,
        detail_address: user?.detail_address ?? null,
        birthday: formatBirthdayIso(birthYear, birthMonth, birthDay),
        sex: gender === 'male',
      });
      await refreshSession();
      showToast('사용자 정보가 변경되었습니다.', 'success');
    } catch (error) {
      showToast(normalizeApiError(error), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleWithdraw() {
    // 회원 탈퇴는 비밀번호 확인이 끝난 뒤 완료 모달을 보여준다.
    const password = withdrawPassword.trim();

    if (!password || withdrawing) {
      return;
    }

    try {
      setWithdrawErrorMessage('');
      setWithdrawing(true);
      await userAPI.deleteCurrentUser({ password });
      setWithdrawModalVisible(false);
      setWithdrawCompleteVisible(true);
    } catch (error) {
      setWithdrawErrorMessage(normalizeApiError(error));
    } finally {
      setWithdrawing(false);
    }
  }

  async function handleWithdrawCompleteConfirm() {
    await logout();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'login' }],
      }),
    );
  }

  async function handleDeviceLogout() {
    // 현재 기기 로그아웃 후 네비게이션 스택을 로그인 화면으로 초기화한다.
    await logout();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'login' }],
      }),
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right', ]} style={styles.screen}>
      <ToastAlert
        visible={Boolean(toastMessage)}
        message={toastMessage}
        tone={toastTone}
        toastKey={toastKey}
        onDismiss={() => setToastMessage('')}
      />
      <Modal
        visible={withdrawModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeWithdrawModal}
      >
        <Pressable style={styles.withdrawModalOverlay} onPress={closeWithdrawModal}>
          <Pressable style={styles.withdrawModalCard} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.withdrawModalTitle}>떠나신다니 아쉬워요.</Text>
            <Text style={styles.withdrawModalDescription}>탈퇴하신다면 아래 정보가 삭제돼요.</Text>

            <View style={styles.withdrawDeleteBox}>
              <Text style={styles.withdrawDeleteTitle}>삭제되는 항목</Text>
              <Text style={styles.withdrawDeleteText}>• 가입 계정 및 비밀번호</Text>
              <Text style={styles.withdrawDeleteText}>• 이름 및 전화번호 등의 개인정보</Text>
              <Text style={styles.withdrawDeleteText}>• 2D, 3D 촬영 기록</Text>
              <Text style={styles.withdrawDeleteText}>• 척추측만계 측정 기록</Text>
              <Text style={styles.withdrawDeleteText}>• 분석 및 리포트 히스토리</Text>
              <Text style={styles.withdrawDeleteText}>• 앱 설정 (알림 등)</Text>
            </View>

            <Text style={styles.withdrawConfirmText}>확인을 위해 아래에 비밀번호를 입력해주세요</Text>
            <View style={styles.withdrawPasswordWrap}>
              <TextInput
                value={withdrawPassword}
                onChangeText={(value) => {
                  setWithdrawPassword(value);
                  if (withdrawErrorMessage) {
                    setWithdrawErrorMessage('');
                  }
                }}
                placeholder="비밀번호를 입력해주세요"
                placeholderTextColor="#B6BECE"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="password"
                style={styles.withdrawPasswordInput}
              />
            </View>
            {withdrawErrorMessage ? (
              <Text style={styles.withdrawErrorText}>{withdrawErrorMessage}</Text>
            ) : null}

            <View style={styles.withdrawButtonRow}>
              <Pressable style={styles.withdrawCancelButton} onPress={closeWithdrawModal}>
                <Text style={styles.withdrawCancelText}>취소</Text>
              </Pressable>
              <Pressable
                disabled={!withdrawPassword.trim() || withdrawing}
                style={[
                  styles.withdrawConfirmButton,
                  withdrawPassword.trim() ? styles.withdrawConfirmButtonActive : null,
                ]}
                onPress={() => void handleWithdraw()}
              >
                <Text style={styles.withdrawConfirmButtonText}>{withdrawing ? '처리 중...' : '회원탈퇴'}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      <Modal
        visible={withdrawCompleteVisible}
        transparent
        animationType="fade"
        onRequestClose={() => undefined}
      >
        <View style={styles.withdrawModalOverlay}>
          <View style={styles.withdrawCompleteCard}>
            <Text style={styles.withdrawCompleteTitle}>회원 탈퇴가 완료되었습니다.</Text>
            <Pressable style={styles.withdrawCompleteButton} onPress={() => void handleWithdrawCompleteConfirm()}>
              <Text style={styles.withdrawCompleteButtonText}>확인</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color="#B9C1CC" />
        </Pressable>
        <Text style={styles.headerTitle}>계정 관리</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[styles.content, { paddingBottom: 0 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="interactive"
      >
        <Text style={styles.sectionTitle}>계정 정보</Text>

        <View style={styles.accountSection}>
          <Field
            label="이름"
            value={name}
            placeholder="이름을 입력해주세요"
            onChangeText={setName}
            textContentType="name"
            autoComplete="name"
            rightElement={
              name ? (
                <Pressable hitSlop={8} onPress={() => setName('')}>
                  <Ionicons name="close" size={18} color="#C2C9D2" />
                </Pressable>
              ) : null
            }
          />

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>생년월일</Text>
            <View style={styles.birthRow}>
              <View style={styles.birthInputWrap}>
                <TextInput
                  keyboardType="number-pad"
                  maxLength={4}
                  placeholder="YYYY"
                  placeholderTextColor="#C8CFD8"
                  style={styles.birthInput}
                  value={birthYear}
                  onChangeText={(value) => setBirthYear(normalizeBirthdayInput(value, 4))}
                />
              </View>
              <View style={styles.birthInputWrap}>
                <TextInput
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="MM"
                  placeholderTextColor="#C8CFD8"
                  style={styles.birthInput}
                  value={birthMonth}
                  onChangeText={(value) => setBirthMonth(normalizeBirthdayInput(value, 2))}
                />
              </View>
              <View style={styles.birthInputWrap}>
                <TextInput
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="DD"
                  placeholderTextColor="#C8CFD8"
                  style={styles.birthInput}
                  value={birthDay}
                  onChangeText={(value) => setBirthDay(normalizeBirthdayInput(value, 2))}
                />
              </View>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>성별</Text>
            <View style={styles.genderRow}>
              <Pressable
                onPress={() => setGender('male')}
                style={[styles.genderOption, gender === 'male' && styles.genderOptionActive]}
              >
                <Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>남성</Text>
              </Pressable>
              <Pressable
                onPress={() => setGender('female')}
                style={[styles.genderOption, gender === 'female' && styles.genderOptionActive]}
              >
                <Text style={[styles.genderText, gender === 'female' && styles.genderTextActive]}>여성</Text>
              </Pressable>
            </View>
          </View>

          <View onLayout={handleFieldLayout(setPhoneFieldY)}>
            <Field
              label="연락처"
              value={formatPhoneNumber(phone)}
              placeholder="010-0000-0000"
              onChangeText={(value) => setPhone(normalizePhoneNumber(value))}
              keyboardType="number-pad"
              textContentType="telephoneNumber"
              autoComplete="tel"
              maxLength={13}
              onFocus={() => scrollToField(phoneFieldY)}
            />
          </View>

          <Field
            label="이메일"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            editable={false}
          />
        </View>

        <View style={styles.sectionSpacing}>
          <Text style={styles.sectionTitle}>로그인 방법</Text>
          <View style={styles.loginSection}>
            <View style={styles.loginMethodRow}>
              <View style={styles.loginMethodIcon}>
                <Ionicons name="mail-outline" size={22} color="#25272D" />
              </View>
              <View style={styles.loginMethodContent}>
                <View style={styles.loginMethodTitleRow}>
                  <Text style={styles.loginMethodTitle}>이메일</Text>
                  <View style={styles.infoBadge}>
                    <Text style={styles.infoBadgeText}>기본</Text>
                  </View>
                </View>
                <Text style={styles.loginMethodEmail}>{email || '-'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionSpacing}>
          <Text style={styles.sectionTitle}>로그인 기기</Text>
          <View style={styles.deviceSection}>
            <View style={styles.deviceRow}>
              <View style={styles.deviceContent}>
                <View style={styles.deviceTitleRow}>
                  <Text style={styles.deviceTitle}>{deviceName}</Text>
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>현재</Text>
                  </View>
                </View>
                <Text style={styles.deviceMeta}>{deviceMeta}</Text>
              </View>
              <Pressable hitSlop={8} onPress={() => void handleDeviceLogout()}>
                <Text style={styles.deviceLogoutText}>로그아웃</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.actionArea}>
          <View style={styles.actionLinkRow}>
            <Pressable onPress={() => router.push('/settings/password')}>
              <Text style={styles.actionLinkText}>비밀번호 변경</Text>
            </Pressable>
            <View style={styles.actionDivider} />
            <Pressable onPress={() => setWithdrawModalVisible(true)}>
              <Text style={styles.actionLinkText}>회원 탈퇴</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.fixedFooter, { paddingBottom: Math.max(insets.bottom, 60) }]}>
        <PrimaryButton
          title={saving ? '저장 중...' : '저장'}
          onPress={() => void handleSave()}
          height={40}
          backgroundColor="#3D9A9A"
          borderRadius={4}
          style={styles.saveButton}
          textStyle={styles.saveButtonText}
          disabled={!canSave}
        />
      </View>
    </SafeAreaView>
  );
}
