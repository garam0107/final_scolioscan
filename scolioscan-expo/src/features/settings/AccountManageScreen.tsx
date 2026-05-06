import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { LayoutChangeEvent, ScrollView as ScrollViewType } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import PrimaryButton from '@/src/components/ui/PrimaryButton';
import { useAuth } from '@/src/contexts/AuthContext';
import { formatPhoneNumber, normalizePhoneNumber } from '@/src/features/auth/registerValidation';
import styles from '@/src/features/settings/accountManage.styles';

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
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'email-address' | 'number-pad' | 'phone-pad';
  textContentType?:
    | 'name'
    | 'emailAddress'
    | 'telephoneNumber'
    | 'none';
  autoComplete?: 'name' | 'email' | 'tel' | 'off';
  autoCorrect?: boolean;
  maxLength?: number;
  rightElement?: React.ReactNode;
  onFocus?: () => void;
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
          style={styles.input}
        />
        {rightElement}
      </View>
    </View>
  );
}

type GenderValue = 'male' | 'female';

export default function AccountManageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [gender, setGender] = useState<GenderValue>('male');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const scrollViewRef = useRef<ScrollViewType | null>(null);
  const [phoneFieldY, setPhoneFieldY] = useState(0);
  const [emailFieldY, setEmailFieldY] = useState(0);

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
      // 입력칸이 키보드 위쪽에 자연스럽게 보이도록 여유를 둡니다.
      y: Math.max(0, y - 24),
      animated: true,
    });
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.top}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color="#B9C1CC" />
          </Pressable>
          <Text style={styles.headerTitle}>계정 관리</Text>
          <View style={styles.headerSide} />
        </View>

        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[styles.content, { paddingBottom: 0}]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
            <View onLayout={handleFieldLayout(setEmailFieldY)}>
              <Field
                label="이메일"
                value={email}
                placeholder="abc@next.com"
                onChangeText={setEmail}
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
                onFocus={() => scrollToField(emailFieldY)}
              />
            </View>
          </View>

          <View style={styles.actionArea}>
            <View style={styles.actionLinkRow}>
              <Text style={styles.actionLinkText}>비밀번호 변경</Text>
              <View style={styles.actionDivider} />
              <Text style={styles.actionLinkText}>회원 탈퇴</Text>
            </View>

            <PrimaryButton
              title="저장"
              onPress={() => undefined}
              height={40}
              backgroundColor="#3D9A9A"
              borderRadius={4}
              style={styles.saveButton}
              textStyle={styles.saveButtonText}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
