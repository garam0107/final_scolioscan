import { Pressable, Text, View } from 'react-native';
import { useAuthStore } from '@/src/store/authStore';
import AuthField from './AuthField';
import { formatPhoneNumber, isValidPhoneNumber, normalizePhoneNumber } from './registerValidation';
import { styles } from './register.styles';

const carrierOptions = ['SKT', 'KT', 'LG U+', 'SKT\n알뜰폰', 'KT\n알뜰폰', 'LG U+\n알뜰폰'];

export default function RegisterCarrierStep() {
  const carrier = useAuthStore((state) => state.registerDraft.carrier);
  const phone = useAuthStore((state) => state.registerDraft.phone);
  const updateRegisterDraft = useAuthStore((state) => state.updateRegisterDraft);

  return (
    <View style={styles.carrierWrap}>
      <View style={styles.carrierGrid}>
        {carrierOptions.map((option) => {
          const isSelected = carrier === option;

          return (
            <Pressable
              key={option}
              onPress={() => updateRegisterDraft({ carrier: option, phone: '' })}
              style={({ pressed }) => [
                styles.carrierButton,
                isSelected ? styles.carrierButtonActive : null,
                pressed ? styles.pressed : null,
              ]}
            >
              <Text style={[styles.carrierButtonText, isSelected ? styles.carrierButtonTextActive : null]}>
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {carrier ? (
        <View style={styles.phoneWrap}>
          <AuthField
            autoComplete="tel"
            autoCorrect={false}
            label="휴대폰 번호"
            keyboardType="number-pad"
            maxLength={13}
            placeholder="010-0000-0000"
            returnKeyType="done"
            textContentType="telephoneNumber"
            value={formatPhoneNumber(phone)}
            variant="text"
            onChangeText={(text) => updateRegisterDraft({ phone: normalizePhoneNumber(text) })}
            onClear={() => updateRegisterDraft({ phone: '' })}
          />
          {phone.trim().length > 0 && !isValidPhoneNumber(phone) ? (
            <Text style={styles.phoneHelperText}>숫자만 입력해주세요.</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
