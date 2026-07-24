import { i18n } from '@/src/i18n';
import { Modal, Pressable, Text, View } from 'react-native';

import styles from '@/src/features/home/styles/measurementLimitModal.styles';

type MeasurementLimitModalProps = {
  visible: boolean;
  resetAt: string | undefined;
  onClose: () => void;
};

const LANGUAGE_LOCALES = {
  ko: 'ko-KR',
  en: 'en-US',
  ja: 'ja-JP',
} as const;

function formatResetDate(resetAt: string | undefined) {
  if (!resetAt) {
    return '';
  }

  // 서버의 시간대 없는 ISO 문자열은 UTC 기준이므로 명시적으로 UTC로 변환한다.
  const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(resetAt);
  const resetDate = new Date(hasTimezone ? resetAt : `${resetAt}Z`);

  if (Number.isNaN(resetDate.getTime())) {
    return '';
  }

  const language = i18n.language.startsWith('en')
    ? 'en'
    : i18n.language.startsWith('ja')
      ? 'ja'
      : 'ko';

  return new Intl.DateTimeFormat(LANGUAGE_LOCALES[language], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(resetDate);
}

export default function MeasurementLimitModal({
  visible,
  resetAt,
  onClose,
}: MeasurementLimitModalProps) {
  const formattedResetDate = formatResetDate(resetAt);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{i18n.t('월 10회 이용 횟수를 모두 사용했습니다.')}</Text>
          {formattedResetDate ? (
            <Text style={styles.description}>
              {i18n.t('{{date}}부터 다시 측정할 수 있어요.', { date: formattedResetDate })}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={i18n.t('확인')}
            onPress={onClose}
            style={({ pressed }) => [styles.confirmButton, pressed && styles.pressed]}
          >
            <Text style={styles.confirmButtonText}>{i18n.t('확인')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
