import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

type AuthFieldVariant = 'email' | 'password' | 'text';

type AuthFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  variant: AuthFieldVariant;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  onToggleSecure?: () => void;
  secureTextEntry?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  fieldBoxStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  iconColor?: string;
} & Pick<
  TextInputProps,
  | 'autoCapitalize'
  | 'autoComplete'
  | 'autoCorrect'
  | 'keyboardType'
  | 'returnKeyType'
  | 'textContentType'
  | 'onSubmitEditing'
  | 'blurOnSubmit'
  | 'editable'
  | 'maxLength'
  | 'multiline'
  | 'numberOfLines'
  | 'selectionColor'
  | 'placeholderTextColor'
  | 'importantForAutofill'
>;

export default function AuthField({
  label,
  value,
  placeholder,
  variant,
  onChangeText,
  onClear,
  onToggleSecure,
  secureTextEntry,
  containerStyle,
  labelStyle,
  fieldBoxStyle,
  inputStyle,
  iconColor = '#B9C0CF',
  autoCapitalize,
  autoComplete,
  autoCorrect = false,
  keyboardType,
  returnKeyType,
  textContentType,
  onSubmitEditing,
  blurOnSubmit,
  editable = true,
  maxLength,
  multiline,
  numberOfLines,
  selectionColor,
  placeholderTextColor = '#C7CCD7',
  importantForAutofill,
}: AuthFieldProps) {
  const showClearButton = variant !== 'password' && Boolean(onClear) && Boolean(value);
  const showPasswordButton = variant === 'password' && Boolean(onToggleSecure);

  return (
    <View style={[styles.fieldGroup, containerStyle]}>
      <Text style={[styles.fieldLabel, labelStyle]}>{label}</Text>
      <View style={[styles.fieldBox, fieldBoxStyle]}>
        <TextInput
          autoCapitalize={autoCapitalize ?? 'none'}
          autoComplete={
            autoComplete ?? (variant === 'email' ? 'email' : variant === 'password' ? 'password' : 'name')
          }
          autoCorrect={autoCorrect}
          blurOnSubmit={blurOnSubmit}
          editable={editable}
          importantForAutofill={importantForAutofill}
          keyboardType={keyboardType ?? (variant === 'email' ? 'email-address' : 'default')}
          maxLength={maxLength}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          returnKeyType={returnKeyType}
          secureTextEntry={variant === 'password' ? Boolean(secureTextEntry) : false}
          selectionColor={selectionColor}
          style={[styles.fieldInput, showClearButton || showPasswordButton ? styles.fieldInputWithIcon : null, inputStyle]}
          textContentType={textContentType}
          value={value}
        />
        <View style={styles.fieldActions}>
          {showClearButton ? (
            <Pressable onPress={onClear} hitSlop={10} style={styles.fieldIconButton}>
              <Ionicons name="close" size={22} color={iconColor} />
            </Pressable>
          ) : null}
          {showPasswordButton ? (
            <Pressable onPress={onToggleSecure} hitSlop={10} style={styles.fieldIconButton}>
              <Ionicons
                name={secureTextEntry ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color={iconColor}
              />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldGroup: {
    width: '100%',
  },
  fieldLabel: {
    color: '#111827',
    fontFamily: 'PretendardVariable',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },
  fieldBox: {
    alignItems: 'center',
    backgroundColor: '#F7F7F8',
    borderColor: '#DADADC',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 56,
    paddingLeft: 18,
    paddingRight: 12,
    width: '100%',
  },
  fieldInput: {
    color: '#292929',
    flex: 1,
    fontFamily: 'PretendardVariable',
    fontSize: 15,
    fontWeight: '500',
    minHeight: 56,
    paddingVertical: 0,
    width: '100%',
  },
  fieldInputWithIcon: {
    paddingRight: 8,
  },
  fieldActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  fieldIconButton: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
});
