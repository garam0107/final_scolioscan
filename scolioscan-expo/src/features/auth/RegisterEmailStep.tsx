import { useAuthStore } from '@/src/store/authStore';
import AuthField from './AuthField';

type RegisterEmailStepProps = {
  onSubmit: () => void;
};

export default function RegisterEmailStep({ onSubmit }: RegisterEmailStepProps) {
  const email = useAuthStore((state) => state.registerDraft.email);
  const updateRegisterDraft = useAuthStore((state) => state.updateRegisterDraft);

  return (
    <AuthField
      autoCapitalize="none"
      autoComplete="email"
      autoCorrect={false}
      label="이메일"
      placeholder="이메일을 입력해주세요"
      returnKeyType="next"
      textContentType="emailAddress"
      value={email}
      variant="email"
      onChangeText={(text) => updateRegisterDraft({ email: text })}
      onClear={() => updateRegisterDraft({ email: '' })}
      onSubmitEditing={onSubmit}
    />
  );
}
