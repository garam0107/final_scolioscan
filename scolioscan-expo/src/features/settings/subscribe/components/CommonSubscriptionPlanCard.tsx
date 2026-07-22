import { i18n } from '@/src/i18n';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import CrownIcon from '../../../../../assets/icons/crown_white.svg';
import styles from '@/src/features/settings/subscribe/subscribe.styles';

type CommonSubscriptionPlanCardProps = {
  title: string;
  features: string[];
  variant?: 'standard' | 'professional';
  price?: string;
  buttonLabel: string;
  disabled?: boolean;
  onPress?: () => void;
};

export default function CommonSubscriptionPlanCard({
  title,
  features,
  variant = 'standard',
  price,
  buttonLabel,
  disabled = false,
  onPress,
}: CommonSubscriptionPlanCardProps) {
  const isProfessional = variant === 'professional';

  return (
    <View style={[styles.planCard, isProfessional && styles.professionalCard]}>
      <View style={styles.planTitleRow}>
        {isProfessional ? (
          <View style={styles.crownBadge}>
            <CrownIcon />
          </View>
        ) : null}
        <Text style={[styles.planTitle, isProfessional && styles.professionalText]}>{i18n.t(title)}</Text>
      </View>

      <View style={[styles.planDivider, isProfessional && styles.professionalDivider]} />

      <View style={styles.featureList}>
        {features.map((feature, index) => (
          <View key={feature} style={[styles.featureRow, index === features.length - 1 && styles.lastFeatureRow]}>
            <Ionicons name="checkmark" size={16} color={isProfessional ? '#FFFFFF' : index === 0 ? '#2B9696' : '#24272C'} />
            <Text
              style={[
                styles.featureText,
                !isProfessional && index === 0 && styles.standardPrimaryFeatureText,
                isProfessional && styles.professionalFeatureText,
              ]}
            >
              {i18n.t(feature)}
            </Text>
          </View>
        ))}
      </View>

      {price ? (
        <View style={styles.priceRow}>
          <Text style={styles.priceText}>{i18n.t(price)}</Text>
        </View>
      ) : null}

      <Pressable
        disabled={disabled}
        onPress={onPress}
        style={[
          styles.planButton,
          isProfessional && styles.professionalButton,
          disabled && styles.disabledPlanButton,
        ]}
      >
        <Text style={styles.planButtonText}>{i18n.t(buttonLabel)}</Text>
      </Pressable>
    </View>
  );
}
