import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
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

function splitBirthday(birthday?: string) {
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
  return value.replace(/\D/g, '').slice(0, maxLength);
}

function normalizeApiError(error: unknown) {
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
  const insets = useSafeAreaInsets();
  const { user, refreshSession } = useAuth();

  const [name, setName] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [gender, setGender] = useState<GenderValue>('male');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastTone, setToastTone] = useState<ToastTone>('info');
  const [toastKey, setToastKey] = useState(0);
  const scrollViewRef = useRef<ScrollViewType | null>(null);
  const [phoneFieldY, setPhoneFieldY] = useState(0);

  useEffect(() => {
    const birthday = splitBirthday(user?.birthday);

    setName(user?.name || '');
    setBirthYear(birthday.year);
    setBirthMonth(birthday.month);
    setBirthDay(birthday.day);
    setGender(user?.sex === false ? 'female' : 'male');
    setPhone(user?.phone || '');
    setEmail(user?.user_id || '');
  }, [user]);

  function handleFieldLayout(setter: (value: number) => void) {
    return (event: LayoutChangeEvent) => {
      setter(event.nativeEvent.layout.y);
    };
  }

  function scrollToField(y: number) {
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

  const initialBirthday = splitBirthday(user?.birthday);
  const initialGender: GenderValue = user?.sex === false ? 'female' : 'male';
  const hasChanges =
    name !== (user?.name || '') ||
    phone !== (user?.phone || '') ||
    birthYear !== initialBirthday.year ||
    birthMonth !== initialBirthday.month ||
    birthDay !== initialBirthday.day ||
    gender !== initialGender;
  const canSave = hasChanges && !saving;

  async function handleSave() {
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

  return (
    <SafeAreaView edges={['top', 'left', 'right', ]} style={styles.screen}>
      <ToastAlert
        visible={Boolean(toastMessage)}
        message={toastMessage}
        tone={toastTone}
        toastKey={toastKey}
        onDismiss={() => setToastMessage('')}
      />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color="#B9C1CC" />
        </Pressable>
        <Text style={styles.headerTitle}>계정 관리</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom }]}
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

        <View style={styles.actionArea}>
          <View style={styles.actionLinkRow}>
            <Text style={styles.actionLinkText}>비밀번호 변경</Text>
            <View style={styles.actionDivider} />
            <Text style={styles.actionLinkText}>회원 탈퇴</Text>
          </View>

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
      </ScrollView>
    </SafeAreaView>
  );
}
