import { FarmTheme } from '@/constants/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

interface FarmInputProps extends TextInputProps {
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  mciName?: keyof typeof MaterialCommunityIcons.glyphMap;
  suffix?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export const FarmInput: React.FC<FarmInputProps> = ({
  label,
  required = false,
  error,
  helperText,
  iconName,
  mciName,
  suffix,
  containerStyle,
  inputStyle,
  ...inputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>
            {label}
            {required && <Text style={styles.asterisk}> *</Text>}
          </Text>
        </View>
      )}

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          Boolean(error) && styles.inputError,
        ]}
      >
        {iconName && (
          <View style={styles.iconWrapper}>
            <Ionicons
              name={iconName}
              size={18}
              color={
                error
                  ? FarmTheme.colors.rose
                  : isFocused
                  ? FarmTheme.colors.forestMedium
                  : FarmTheme.colors.textMuted
              }
            />
          </View>
        )}
        {mciName && (
          <View style={styles.iconWrapper}>
            <MaterialCommunityIcons
              name={mciName}
              size={18}
              color={
                error
                  ? FarmTheme.colors.rose
                  : isFocused
                  ? FarmTheme.colors.forestMedium
                  : FarmTheme.colors.textMuted
              }
            />
          </View>
        )}

        <TextInput
          placeholderTextColor={FarmTheme.colors.textMuted}
          onFocus={(e) => {
            setIsFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            inputProps.onBlur?.(e);
          }}
          style={[styles.input, inputStyle]}
          {...inputProps}
        />

        {suffix && <Text style={styles.suffixText}>{suffix}</Text>}
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  labelRow: {
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: FarmTheme.colors.textSecondary,
    letterSpacing: 0.1,
  },
  asterisk: {
    color: FarmTheme.colors.rose,
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderWidth: 1.2,
    borderColor: 'rgba(20, 83, 45, 0.16)',
    borderRadius: FarmTheme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...FarmTheme.shadows.soft,
  },
  inputFocused: {
    borderColor: FarmTheme.colors.forestMedium,
    backgroundColor: '#FFFFFF',
    shadowColor: FarmTheme.colors.emerald,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  inputError: {
    borderColor: FarmTheme.colors.rose,
    backgroundColor: '#FFF8F8',
  },
  iconWrapper: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: FarmTheme.colors.textPrimary,
    padding: 0,
    minHeight: 24,
  },
  suffixText: {
    fontSize: 14,
    fontWeight: '600',
    color: FarmTheme.colors.textMuted,
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    color: FarmTheme.colors.rose,
    marginTop: 4,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: FarmTheme.colors.textMuted,
    marginTop: 4,
  },
});
