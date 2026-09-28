import { FarmTheme } from '@/constants/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

export type ButtonVariant = 'primary' | 'harvest' | 'danger' | 'glass' | 'outline' | 'subtle';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface FarmButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconName?: keyof typeof Ionicons.glyphMap;
  mciName?: keyof typeof MaterialCommunityIcons.glyphMap;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  haptic?: boolean;
}

export const FarmButton: React.FC<FarmButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  iconName,
  mciName,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  style,
  textStyle,
  haptic = true,
}) => {
  const handlePress = () => {
    if (disabled || loading) return;
    if (haptic) {
      try {
        Haptics.selectionAsync();
      } catch {
        // Haptics not supported on some platforms
      }
    }
    onPress();
  };

  const getGradientColors = (): readonly [string, string, ...string[]] | null => {
    switch (variant) {
      case 'primary':
        return ['#14532D', '#166534', '#15803D'] as const;
      case 'harvest':
        return ['#D97706', '#B45309'] as const;
      case 'danger':
        return ['#DC2626', '#B91C1C'] as const;
      default:
        return null;
    }
  };

  const isGradient = ['primary', 'harvest', 'danger'].includes(variant);

  const getPadding = () => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 8, paddingHorizontal: 14, borderRadius: FarmTheme.radius.sm };
      case 'lg':
        return { paddingVertical: 16, paddingHorizontal: 24, borderRadius: FarmTheme.radius.md };
      case 'md':
      default:
        return { paddingVertical: 12, paddingHorizontal: 18, borderRadius: FarmTheme.radius.md };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return 13;
      case 'lg':
        return 17;
      case 'md':
      default:
        return 15;
    }
  };

  const getTextColor = () => {
    if (disabled) return '#9CA3AF';
    switch (variant) {
      case 'primary':
      case 'harvest':
      case 'danger':
        return '#FFFFFF';
      case 'outline':
        return FarmTheme.colors.forest;
      case 'glass':
        return FarmTheme.colors.textPrimary;
      case 'subtle':
        return FarmTheme.colors.forestMedium;
      default:
        return FarmTheme.colors.textPrimary;
    }
  };

  const getContainerStyle = (): ViewStyle => {
    const base = getPadding();
    if (disabled) {
      return {
        ...base,
        backgroundColor: '#E5E7EB',
        borderWidth: 0,
      };
    }

    switch (variant) {
      case 'glass':
        return {
          ...base,
          backgroundColor: 'rgba(255, 255, 255, 0.75)',
          borderWidth: 1.2,
          borderColor: 'rgba(255, 255, 255, 0.85)',
          ...FarmTheme.shadows.soft,
        };
      case 'outline':
        return {
          ...base,
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          borderWidth: 1.5,
          borderColor: FarmTheme.colors.forest,
        };
      case 'subtle':
        return {
          ...base,
          backgroundColor: FarmTheme.colors.emeraldSoft,
          borderWidth: 1,
          borderColor: 'rgba(34, 197, 94, 0.25)',
        };
      case 'primary':
        return {
          ...base,
          ...FarmTheme.shadows.glowGreen,
        };
      case 'harvest':
      case 'danger':
        return {
          ...base,
          ...FarmTheme.shadows.glass,
        };
      default:
        return base;
    }
  };

  const textColor = getTextColor();
  const iconSize = getFontSize() + 2;

  const renderIcon = () => {
    if (iconName) {
      return <Ionicons name={iconName} size={iconSize} color={textColor} />;
    }
    if (mciName) {
      return <MaterialCommunityIcons name={mciName} size={iconSize} color={textColor} />;
    }
    return null;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={handlePress}
      disabled={disabled || loading}
      style={[styles.baseButton, style]}
    >
      <View style={[styles.innerContainer, getContainerStyle()]}>
        {isGradient && !disabled && (
          <LinearGradient
            colors={getGradientColors()!}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        )}

        {loading ? (
          <ActivityIndicator color={textColor} size="small" />
        ) : (
          <View style={styles.contentRow}>
            {iconPosition === 'left' && renderIcon() && (
              <View style={styles.iconLeft}>{renderIcon()}</View>
            )}
            <Text
              style={[
                styles.buttonText,
                {
                  color: textColor,
                  fontSize: getFontSize(),
                },
                textStyle,
              ]}
            >
              {title}
            </Text>
            {iconPosition === 'right' && renderIcon() && (
              <View style={styles.iconRight}>{renderIcon()}</View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    borderRadius: FarmTheme.radius.md,
  },
  innerContainer: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: '700',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
