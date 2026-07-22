import { i18n } from '@/src/i18n';
import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import type { KeyboardTypeOptions, LayoutChangeEvent } from 'react-native';

import {
  formatPhoneNumber,
  normalizePhoneNumber,
} from '@/src/features/auth/registerValidation';
import styles from '@/src/features/settings/accountManage/components/accountManageComponents.styles';
import { normalizeBirthdayInput } from '@/src/features/settings/accountManage/accountManageUtils';

type GenderValue = 'male' | 'female';

type FieldProps = {
  label: string;
  value: string;
  placeholder?: string;
  onChangeText: (value: string) => void;
  keyboardType?: KeyboardTypeOptions;
  textContentType?: 'name' | 'emailAddress' | 'telephoneNumber' | 'none';
  autoComplete?: 'name' | 'email' | 'tel' | 'off';
  autoCorrect?: boolean;
  maxLength?: number;
  rightElement?: ReactNode;
  onFocus?: () => void;
  editable?: boolean;
};

type AccountEditFormProps = {
  name: string;
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  gender: GenderValue;
  phone: string;
  email: string;
  phoneFieldY: number;
  onNameChange: (value: string) => void;
  onBirthYearChange: (value: string) => void;
  onBirthMonthChange: (value: string) => void;
  onBirthDayChange: (value: string) => void;
  onGenderChange: (value: GenderValue) => void;
  onPhoneChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneLayout: (event: LayoutChangeEvent) => void;
  onPhoneFocus: (y: number) => void;
};

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
}: FieldProps) {
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

export default function AccountEditForm({
  name,
  birthYear,
  birthMonth,
  birthDay,
  gender,
  phone,
  email,
  phoneFieldY,
  onNameChange,
  onBirthYearChange,
  onBirthMonthChange,
  onBirthDayChange,
  onGenderChange,
  onPhoneChange,
  onEmailChange,
  onPhoneLayout,
  onPhoneFocus,
}: AccountEditFormProps) {
  return (
    <View style={styles.accountSection}>
      <Field
        label={i18n.t("이름")}
        value={name}
        placeholder={i18n.t("이름을 입력해주세요")}
        onChangeText={onNameChange}
        textContentType="name"
        autoComplete="name"
        rightElement={
          name ? (
            <Pressable hitSlop={8} onPress={() => onNameChange('')}>
              <Ionicons name="close" size={18} color="#C2C9D2" />
            </Pressable>
          ) : null
        }
      />

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>{i18n.t("생년월일")}</Text>
        <View style={styles.birthRow}>
          <View style={styles.birthInputWrap}>
            <TextInput
              keyboardType="number-pad"
              maxLength={4}
              placeholder="YYYY"
              placeholderTextColor="#C8CFD8"
              style={styles.birthInput}
              value={birthYear}
              onChangeText={(value) => onBirthYearChange(normalizeBirthdayInput(value, 4))}
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
              onChangeText={(value) => onBirthMonthChange(normalizeBirthdayInput(value, 2))}
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
              onChangeText={(value) => onBirthDayChange(normalizeBirthdayInput(value, 2))}
            />
          </View>
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>{i18n.t("성별")}</Text>
        <View style={styles.genderRow}>
          <Pressable
            onPress={() => onGenderChange('male')}
            style={[styles.genderOption, gender === 'male' && styles.genderOptionActive]}
          >
            <Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>{i18n.t("남성")}</Text>
          </Pressable>
          <Pressable
            onPress={() => onGenderChange('female')}
            style={[styles.genderOption, gender === 'female' && styles.genderOptionActive]}
          >
            <Text style={[styles.genderText, gender === 'female' && styles.genderTextActive]}>{i18n.t("여성")}</Text>
          </Pressable>
        </View>
      </View>

      <View onLayout={onPhoneLayout}>
        <Field
          label={i18n.t("연락처")}
          value={formatPhoneNumber(phone)}
          placeholder="010-0000-0000"
          onChangeText={(value) => onPhoneChange(normalizePhoneNumber(value))}
          keyboardType="number-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          maxLength={13}
          onFocus={() => onPhoneFocus(phoneFieldY)}
        />
      </View>

      <Field
        label={i18n.t("이메일")}
        value={email}
        onChangeText={onEmailChange}
        keyboardType="email-address"
        textContentType="emailAddress"
        autoComplete="email"
        editable={false}
      />
    </View>
  );
}
