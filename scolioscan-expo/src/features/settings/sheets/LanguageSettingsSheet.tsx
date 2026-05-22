import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, Text, View } from 'react-native';

import CommonSettingsSheet from '@/src/features/settings/components/CommonSettingsSheet';
import styles from '@/src/features/settings/sheets/settingsSheets.styles';

type LanguageSettingsSheetProps = {
  visible: boolean;
  selectedLanguage: string;
  onSelect: (language: string) => void;
  onClose: () => void;
};

const LANGUAGE_OPTIONS = ['한국어', 'English', '日本語', '中文'];

export default function LanguageSettingsSheet({
  visible,
  selectedLanguage,
  onSelect,
  onClose,
}: LanguageSettingsSheetProps) {
  // 현재는 한국어만 실제 적용하고 다른 언어는 준비 중 안내만 보여준다.
  return (
    <CommonSettingsSheet
      visible={visible}
      title="언어 설정"
      description="앱에 표시할 언어를 선택해주세요"
      height={302}
      bottomPlacement="safeArea"
      onClose={onClose}
    >
      <View style={styles.languageOptionList}>
        {LANGUAGE_OPTIONS.map((language) => {
          const selected = selectedLanguage === language;

          return (
            <Pressable
              key={language}
              style={styles.languageOptionRow}
              onPress={() => {
                if (language !== '한국어') {
                  Alert.alert('준비중입니다');
                  return;
                }

                onSelect(language);
                onClose();
              }}
            >
              <Text style={styles.languageOptionText}>{language}</Text>
              {selected ? <Ionicons name="checkmark" size={24} color="#22BCB7" /> : null}
            </Pressable>
          );
        })}
      </View>
    </CommonSettingsSheet>
  );
}
