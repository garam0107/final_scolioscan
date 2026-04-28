import { TextInput, View } from 'react-native';
import { useAuthStore } from '@/src/store/authStore';
import AuthField from './AuthField';
import { styles } from './register.styles';

export default function RegisterBirthdayStep() {
  const name = useAuthStore((state) => state.registerDraft.name);
  const birthYear = useAuthStore((state) => state.registerDraft.birthYear);
  const birthMonth = useAuthStore((state) => state.registerDraft.birthMonth);
  const birthDay = useAuthStore((state) => state.registerDraft.birthDay);
  const updateRegisterDraft = useAuthStore((state) => state.updateRegisterDraft);

  return (
    <>
      <AuthField
        editable={false}
        label="이름"
        placeholder=""
        value={name}
        variant="text"
        onChangeText={() => undefined}
      />
      <View style={styles.birthdayWrap}>
        <View style={styles.birthdayRow}>
          <View style={[styles.birthdayInputBox, styles.birthdayYearBox]}>
            <TextInput
              keyboardType="number-pad"
              maxLength={4}
              placeholder="YYYY"
              placeholderTextColor="#C7CCD7"
              style={styles.birthdayInput}
              value={birthYear}
              onChangeText={(text) => updateRegisterDraft({ birthYear: text })}
            />
          </View>
          <View style={[styles.birthdayInputBox, styles.birthdayMonthBox]}>
            <TextInput
              keyboardType="number-pad"
              maxLength={2}
              placeholder="MM"
              placeholderTextColor="#C7CCD7"
              style={styles.birthdayInput}
              value={birthMonth}
              onChangeText={(text) => updateRegisterDraft({ birthMonth: text })}
            />
          </View>
          <View style={[styles.birthdayInputBox, styles.birthdayDayBox]}>
            <TextInput
              keyboardType="number-pad"
              maxLength={2}
              placeholder="DD"
              placeholderTextColor="#C7CCD7"
              style={styles.birthdayInput}
              value={birthDay}
              onChangeText={(text) => updateRegisterDraft({ birthDay: text })}
            />
          </View>
        </View>
      </View>
    </>
  );
}
