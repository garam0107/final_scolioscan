import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { Colors } from '@/src/constants/theme';

type FormTextFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  inputStyle?: TextInputProps['style'];
  secureTextEntry?: boolean;
  showSecureToggle?: boolean;
  onToggleSecure?: () => void;
  onChangeText: (value: string) => void;
} & Pick<
  TextInputProps,
  'autoCapitalize' | 'autoComplete' | 'autoCorrect' | 'keyboardType' | 'maxLength' | 'returnKeyType' | 'textContentType'
>;

export default function FormTextField({
  label,
  value,
  placeholder,
  inputStyle,
  secureTextEntry,
  showSecureToggle = false,
  onToggleSecure,
  onChangeText,
  autoCapitalize = 'none',
  autoComplete,
  autoCorrect = false,
  keyboardType = 'default',
  maxLength,
  returnKeyType = 'next',
  textContentType,
}: FormTextFieldProps) {
  const hasSecureButton = showSecureToggle && onToggleSecure;

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          autoCorrect={autoCorrect}
          keyboardType={keyboardType}
          maxLength={maxLength}
          placeholder={placeholder}
          placeholderTextColor="#B6BECE"
          returnKeyType={returnKeyType}
          secureTextEntry={secureTextEntry}
          style={[styles.input, hasSecureButton ? styles.inputWithIcon : null, inputStyle]}
          textContentType={textContentType}
          value={value}
          onChangeText={onChangeText}
        />
        {hasSecureButton ? (
          <Pressable onPress={onToggleSecure} hitSlop={10} style={styles.iconButton}>
            <Ionicons
              name={secureTextEntry ? 'eye-off-outline' : 'eye-outline'}
              size={24}
              color={Colors.gray[200]}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldGroup: {
    marginBottom: 24,
  },
  fieldLabel: {
    color: Colors.gray[800],
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 8,
  },
  inputWrap: {
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderColor: Colors.gray[100],
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 52,
    paddingHorizontal: 14,
  },
  input: {
    color: Colors.gray[800],
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    height: 52,
    lineHeight: 20,
    paddingBottom: 0,
    paddingTop: 0,
    paddingVertical: 0,
    textAlignVertical: 'center',
    width: '100%',
  },
  inputWithIcon: {
    paddingRight: 8,
  },
  iconButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
});
