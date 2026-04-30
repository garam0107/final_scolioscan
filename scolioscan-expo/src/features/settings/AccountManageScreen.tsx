import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/src/contexts/AuthContext';
import styles from '@/src/features/settings/accountManage.styles';

function splitBirthday(birthday?: string) {
  if (!birthday) return ['1995', '07', '08'];

  const datePart = birthday.split(/[T ]/)[0];
  const [year, month, day] = datePart.split(/[-/.]/);

  return [
    year || '1995',
    month?.padStart(2, '0') || '07',
    day?.padStart(2, '0') || '08',
  ];
}

function Field({
  label,
  value,
  placeholder,
  editable = false,
  onChangeText,
  rightElement,
}: {
  label: string;
  value: string;
  placeholder?: string;
  editable?: boolean;
  onChangeText?: (value: string) => void;
  rightElement?: React.ReactNode;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          value={value}
          placeholder={placeholder}
          placeholderTextColor="#C8CFD8"
          editable={editable}
          onChangeText={onChangeText}
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
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '홍길동');

  const birthday = useMemo(() => splitBirthday(user?.birthday), [user?.birthday]);
  const gender = user?.sex === false ? 'female' : 'male';

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
            editable
            onChangeText={setName}
            rightElement={<Ionicons name="close" size={18} color="#C2C9D2" />}
          />

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>생년월일</Text>
            <View style={styles.birthRow}>
              {birthday.map((item) => (
                <View key={item} style={styles.birthInputWrap}>
                  <Text style={styles.birthInputText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>성별</Text>
            <View style={styles.genderRow}>
              <View style={[styles.genderOption, gender === 'male' && styles.genderOptionActive]}>
                <Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>남성</Text>
              </View>
              <View style={[styles.genderOption, gender === 'female' && styles.genderOptionActive]}>
                <Text style={[styles.genderText, gender === 'female' && styles.genderTextActive]}>여성</Text>
              </View>
            </View>
          </View>

          <Field label="연락처" value={user?.phone || ''} placeholder="010-0000-0000" />
          <Field label="이메일" value={user?.user_id || ''} placeholder="abc@next.com" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
