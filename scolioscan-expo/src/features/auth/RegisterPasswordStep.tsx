import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';
import { useAuthStore } from '@/src/store/authStore';
import AuthField from './AuthField';
import { styles } from './register.styles';
import { hasPasswordLength, hasPasswordMix } from './registerValidation';

type RegisterPasswordStepProps = {
  passwordVisible: boolean;
  onTogglePasswordVisible: () => void;
};

export default function RegisterPasswordStep({
  passwordVisible,
  onTogglePasswordVisible,
}: RegisterPasswordStepProps) {
  const password = useAuthStore((state) => state.registerDraft.password);
  const updateRegisterDraft = useAuthStore((state) => state.updateRegisterDraft);
  const passwordHasLength = hasPasswordLength(password);
  const passwordHasMix = hasPasswordMix(password);

  return (
    <>
      <AuthField
        autoCapitalize="none"
        autoComplete="password"
        autoCorrect={false}
        label="비밀번호"
        placeholder="비밀번호를 입력해주세요"
        returnKeyType="next"
        secureTextEntry={!passwordVisible}
        textContentType="password"
        value={password}
        variant="password"
        onChangeText={(text) => updateRegisterDraft({ password: text })}
        onToggleSecure={onTogglePasswordVisible}
      />
      <View style={styles.passwordRules}>
        <View style={styles.passwordRuleRow}>
          <Ionicons
            name="checkmark"
            size={16}
            color={passwordHasMix ? '#5F9F9D' : '#C3CAD6'}
            style={styles.passwordRuleIcon}
          />
          <Text
            style={[
              styles.passwordRuleText,
              passwordHasMix ? styles.passwordRuleTextActive : null,
            ]}
          >
            영문, 숫자, 특수문자 포함
          </Text>
        </View>
        <View style={styles.passwordRuleRow}>
          <Ionicons
            name="checkmark"
            size={16}
            color={passwordHasLength ? '#5F9F9D' : '#C3CAD6'}
            style={styles.passwordRuleIcon}
          />
          <Text
            style={[
              styles.passwordRuleText,
              passwordHasLength ? styles.passwordRuleTextActive : null,
            ]}
          >
            최소 8자 이상
          </Text>
        </View>
      </View>
    </>
  );
}
