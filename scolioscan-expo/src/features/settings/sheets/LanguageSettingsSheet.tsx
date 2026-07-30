import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import CommonSettingsSheet from '@/src/features/settings/components/CommonSettingsSheet';
import styles from '@/src/features/settings/sheets/settingsSheets.styles';
import type { AppLanguage } from '@/src/i18n/resources';

type LanguageSettingsSheetProps = {
  visible: boolean;
  selectedLanguage: AppLanguage;
  onSelect: (language: AppLanguage) => void;
  onClose: () => void;
};

type LanguageOption = { value: AppLanguage; labelKey: string };

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: 'ko', labelKey: 'settings.language.korean' },
  { value: 'en', labelKey: 'settings.language.english' },
  { value: 'ja', labelKey: 'settings.language.japanese' },
];

export default function LanguageSettingsSheet({
  visible,
  selectedLanguage,
  onSelect,
  onClose,
}: LanguageSettingsSheetProps) {
  const { t } = useTranslation();

  return (
    <CommonSettingsSheet
      visible={visible}
      title={t('settings.language.title')}
      description={t('settings.language.description')}
      height={244}
      bottomPlacement="safeArea"
      onClose={onClose}
    >
      <View style={styles.languageOptionList}>
        {LANGUAGE_OPTIONS.map((language) => {
          const selected = selectedLanguage === language.value;

          return (
            <Pressable
              key={language.value}
              style={styles.languageOptionRow}
              onPress={() => {
                onSelect(language.value);
                onClose();
              }}
            >
              <Text style={styles.languageOptionText}>{t(language.labelKey)}</Text>
              {selected ? <Ionicons name="checkmark" size={24} color="#22BCB7" /> : null}
            </Pressable>
          );
        })}
      </View>
    </CommonSettingsSheet>
  );
}
