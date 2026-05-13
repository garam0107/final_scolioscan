import { useAuthStore } from '@/src/store/authStore';
import AuthField from './AuthField';

type RegisterEmailStepProps = {
  onSubmit: () => void;
};

export default function RegisterEmailStep({ onSubmit }: RegisterEmailStepProps) {
  // 이메일 입력값은 가입 전체 단계에서 공유되는 임시 저장소에 바로 반영한다.
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
