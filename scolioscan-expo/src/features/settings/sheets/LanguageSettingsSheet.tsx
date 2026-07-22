import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, Text, View } from 'react-native';
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

type LanguageOption =
  | { value: AppLanguage; labelKey: string }
  | { value: 'zh-Hans'; label: string };

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: 'ko', labelKey: 'settings.language.korean' },
  { value: 'en', labelKey: 'settings.language.english' },
  { value: 'ja', labelKey: 'settings.language.japanese' },
  { value: 'zh-Hans', label: '中文' },
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
      height={302}
      bottomPlacement="safeArea"
      onClose={onClose}
    >
      <View style={styles.languageOptionList}>
        {LANGUAGE_OPTIONS.map((language) => {
          const selected = language.value !== 'zh-Hans' && selectedLanguage === language.value;

          return (
            <Pressable
              key={language.value}
              style={styles.languageOptionRow}
              onPress={() => {
                // 선택 즉시 전역 언어를 전환한 뒤 설정 시트를 닫는다.
                // 중국어는 목록 균형을 유지하되, 실제 번역 제공 전에는 선택을 저장하지 않는다.
                if (language.value === 'zh-Hans') {
                  Alert.alert(
                    t('settings.language.comingSoonTitle'),
                    t('settings.language.chineseComingSoon'),
                  );
                  return;
                }

                onSelect(language.value);
                onClose();
              }}
            >
              <Text style={styles.languageOptionText}>
                {'labelKey' in language ? t(language.labelKey) : language.label}
              </Text>
              {selected ? <Ionicons name="checkmark" size={24} color="#22BCB7" /> : null}
            </Pressable>
          );
        })}
      </View>
    </CommonSettingsSheet>
  );
}
