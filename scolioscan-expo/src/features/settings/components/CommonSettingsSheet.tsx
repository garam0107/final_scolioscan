import { i18n } from '@/src/i18n';
import { Modal, Pressable, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import styles from '@/src/features/settings/components/commonSettingsSheet.styles';

type SheetActionVariant = 'default' | 'primary' | 'danger' | 'google' | 'naver' | 'kakao';

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
  headerTopContent?: ReactNode;
  titleTone?: 'default' | 'danger';
  presentation?: 'default' | 'centerConfirm';
  bottomPlacement?: 'safeArea' | 'screen';
  height?: number;
  onClose: () => void;
  children?: ReactNode;
  actions?: SheetAction[];
  contentStyle?: ViewStyle;
  actionBottomPadding?: number;
  pinActionsToBottom?: boolean;
  avoidKeyboard?: boolean;
};

export default function CommonSettingsSheet({
  visible,
  title,
  description,
  headerTopContent,
  titleTone = 'default',
  presentation = 'default',
  bottomPlacement = 'safeArea',
  height,
  onClose,
  children,
  actions,
  contentStyle,
  actionBottomPadding,
  pinActionsToBottom = false,
  avoidKeyboard = false,
}: CommonSettingsSheetProps) {
  const insets = useSafeAreaInsets();
  const isCenterConfirm = presentation === 'centerConfirm';
  // 기기별 네비바 높이를 그대로 반영해 시트가 네비바 바로 위에서 끝나게 한다.
  const sheetBottomOffset = bottomPlacement === 'safeArea' ? insets.bottom : 0;
  const resolvedActionBottomPadding =
    actionBottomPadding ?? (bottomPlacement === 'safeArea' ? 16 : Math.max(insets.bottom, 16));
  
  const sheetContent = (
    <Pressable
      style={[
        styles.sheet,
        height ? { height } : null,
        // 설정 시트는 네비바 위에서 끝나도록 safe area를 내부 여백이 아닌 바깥 여백으로 처리한다.
        sheetBottomOffset ? { marginBottom: sheetBottomOffset } : null,
        contentStyle,
      ]}
      onPress={(event) => event.stopPropagation()}
    >
      <View style={[styles.header, isCenterConfirm && styles.centerConfirmHeader]}>
        {headerTopContent ? <View style={styles.headerTopContent}>{headerTopContent}</View> : null}
        <Text
          style={[
            styles.title,
            isCenterConfirm && styles.centerConfirmTitle,
            titleTone === 'danger' && styles.dangerTitle,
          ]}
        >
          {i18n.t(title)}
        </Text>
        {description ? (
          <Text style={[styles.description, isCenterConfirm && styles.centerConfirmDescription]}>
            {i18n.t(description)}
          </Text>
        ) : null}
      </View>

      {pinActionsToBottom ? <View style={styles.pinnedContent}>{children}</View> : children}

      {actions?.length ? (
        <View
          style={[
            styles.actionRow,
            pinActionsToBottom && styles.pinnedActionRow,
            isCenterConfirm && styles.centerConfirmActionRow,
            { paddingBottom: resolvedActionBottomPadding },
          ]}
        >
          {actions.map((action) => {
            const isPrimary = action.variant === 'primary';
            const isDanger = action.variant === 'danger';
            const isGoogle = action.variant === 'google';
            const isNaver = action.variant === 'naver';
            const isKakao = action.variant === 'kakao';
            return (
              <Pressable
                key={action.label}
                disabled={action.disabled}
                onPress={action.onPress}
                style={[
                  styles.actionButton,
                  isCenterConfirm && styles.centerConfirmActionButton,
                  isPrimary && styles.primaryButton,
                  isDanger && styles.dangerButton,
                  isGoogle && styles.googleButton,
                  isNaver && styles.naverButton,
                  isKakao && styles.kakaoButton,
                  action.disabled && styles.disabledButton,
                ]}
              >
                <Text
                  style={[
                    styles.actionButtonText,
                    (isPrimary || isDanger || isGoogle || isNaver) && styles.filledActionButtonText,
                    action.disabled && styles.disabledButtonText,
                  ]}
                >
                  {i18n.t(action.label)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </Pressable>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        {avoidKeyboard ? (
          <KeyboardStickyView offset={{ closed: 0, opened: 40 }} style={styles.keyboardStickySheet}>
            {/* 입력창이 있는 시트 전체를 자판 위로 올린다. */}
            {sheetContent}
          </KeyboardStickyView>
        ) : (
          sheetContent
        )}
      </Pressable>
    </Modal>
  );
}
