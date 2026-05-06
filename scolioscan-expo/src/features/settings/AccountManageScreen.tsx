import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

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

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color="#B9C1CC" />
        </Pressable>
        <Text style={styles.headerTitle}>계정 관리</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
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

          <Field
            label="연락처"
            value={formatPhoneNumber(phone)}
            placeholder="010-0000-0000"
            onChangeText={(value) => setPhone(normalizePhoneNumber(value))}
            keyboardType="number-pad"
            textContentType="telephoneNumber"
            autoComplete="tel"
            maxLength={13}
          />
          <Field
            label="이메일"
            value={email}
            placeholder="abc@next.com"
            onChangeText={setEmail}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
