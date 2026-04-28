import { Pressable, Text, View } from 'react-native';
import { useAuthStore } from '@/src/store/authStore';
import { styles } from './register.styles';

export default function RegisterGenderStep() {
  const gender = useAuthStore((state) => state.registerDraft.gender);
  const updateRegisterDraft = useAuthStore((state) => state.updateRegisterDraft);

  return (
    <View style={styles.genderWrap}>
      <View style={styles.genderRow}>
        <Pressable
          onPress={() => updateRegisterDraft({ gender: true })}
          style={({ pressed }) => [
            styles.genderButton,
            gender === true ? styles.genderButtonActive : null,
            pressed ? styles.pressed : null,
          ]}
        >
          <Text style={[styles.genderText, gender === true ? styles.genderTextActive : null]}>
            남성
          </Text>
        </Pressable>
        <Pressable
          onPress={() => updateRegisterDraft({ gender: false })}
          style={({ pressed }) => [
            styles.genderButton,
            gender === false ? styles.genderButtonActive : null,
            pressed ? styles.pressed : null,
          ]}
        >
          <Text style={[styles.genderText, gender === false ? styles.genderTextActive : null]}>
            여성
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
