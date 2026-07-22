import { i18n } from '@/src/i18n';
import { useAuthStore } from '@/src/store/authStore';
import AuthField from './AuthField';

type RegisterNameStepProps = {
  onSubmit: () => void;
};

export default function RegisterNameStep({ onSubmit }: RegisterNameStepProps) {
  const name = useAuthStore((state) => state.registerDraft.name);
  const updateRegisterDraft = useAuthStore((state) => state.updateRegisterDraft);

  return (
    <AuthField
      autoCapitalize="words"
      autoComplete="name"
      autoCorrect={false}
      label={i18n.t("이름")}
      maxLength={8}
      placeholder={i18n.t("이름을 입력해주세요")}
      returnKeyType="next"
      textContentType="name"
      value={name}
      variant="text"
      onChangeText={(text) => updateRegisterDraft({ name: text })}
      onClear={() => updateRegisterDraft({ name: '' })}
      onSubmitEditing={onSubmit}
    />
  );
}
