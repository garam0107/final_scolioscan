import { Modal, Pressable, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import styles from '@/src/features/settings/components/commonSettingsSheet.styles';

type SheetActionVariant = 'default' | 'primary' | 'danger';

type SheetAction = {
  label: string;
  onPress: () => void;
  variant?: SheetActionVariant;
  disabled?: boolean;
};

type CommonSettingsSheetProps = {
  visible: boolean;
  title: string;
  description?: string;
  titleTone?: 'default' | 'danger';
  height?: number;
  onClose: () => void;
  children?: ReactNode;
  actions?: SheetAction[];
  contentStyle?: ViewStyle;
};

export default function CommonSettingsSheet({
  visible,
  title,
  description,
  titleTone = 'default',
  height,
  onClose,
  children,
  actions,
  contentStyle,
}: CommonSettingsSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, height ? { height } : null, contentStyle]}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={[styles.title, titleTone === 'danger' && styles.dangerTitle]}>{title}</Text>
            {description ? <Text style={styles.description}>{description}</Text> : null}
          </View>

          {children}

          {actions?.length ? (
            <View style={[styles.actionRow, { paddingBottom: Math.max(insets.bottom, 16) }]}>
              {actions.map((action) => {
                const isPrimary = action.variant === 'primary';
                const isDanger = action.variant === 'danger';

                return (
                  <Pressable
                    key={action.label}
                    disabled={action.disabled}
                    onPress={action.onPress}
                    style={[
                      styles.actionButton,
                      isPrimary && styles.primaryButton,
                      isDanger && styles.dangerButton,
                      action.disabled && styles.disabledButton,
                    ]}
                  >
                    <Text
                      style={[
                        styles.actionButtonText,
                        (isPrimary || isDanger) && styles.filledActionButtonText,
                        action.disabled && styles.disabledButtonText,
                      ]}
                    >
                      {action.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
