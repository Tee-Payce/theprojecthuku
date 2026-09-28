import { FarmTheme } from '@/constants/theme';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';

export type GlassVariant = 'default' | 'forest' | 'harvest' | 'rose' | 'emerald' | 'surface';

interface GlassCardProps extends ViewProps {
  children?: React.ReactNode;
  variant?: GlassVariant;
  intensity?: number;
  style?: ViewStyle | ViewStyle[];
  contentStyle?: ViewStyle;
  noBorder?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'default',
  intensity = 35,
  style,
  contentStyle,
  noBorder = false,
  ...rest
}) => {
  const getGradientColors = (): readonly [string, string, ...string[]] => {
    switch (variant) {
      case 'forest':
        return ['rgba(10, 42, 22, 0.92)', 'rgba(18, 72, 35, 0.85)'] as const;
      case 'harvest':
        return FarmTheme.gradients.harvestCard;
      case 'rose':
        return FarmTheme.gradients.roseCard;
      case 'emerald':
        return FarmTheme.gradients.emeraldCard;
      case 'surface':
        return ['rgba(255, 255, 255, 0.95)', 'rgba(248, 250, 248, 0.92)'] as const;
      case 'default':
      default:
        return FarmTheme.gradients.glassCard;
    }
  };

  const getBorderColor = (): string => {
    if (noBorder) return 'transparent';
    switch (variant) {
      case 'forest':
        return 'rgba(255, 255, 255, 0.16)';
      case 'harvest':
        return FarmTheme.colors.glassBorderAmber;
      case 'rose':
        return FarmTheme.colors.glassBorderRose;
      case 'emerald':
        return FarmTheme.colors.glassBorderGreen;
      case 'surface':
        return FarmTheme.colors.borderSubtle;
      case 'default':
      default:
        return FarmTheme.colors.glassBorder;
    }
  };

  const isDark = variant === 'forest';

  return (
    <View
      style={[
        styles.container,
        FarmTheme.shadows.glass,
        {
          borderColor: getBorderColor(),
        },
        style,
      ]}
      {...rest}
    >
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {Platform.OS === 'ios' && (
        <BlurView
          intensity={intensity}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: FarmTheme.radius.lg,
    overflow: 'hidden',
    borderWidth: 1.2,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  content: {
    padding: 16,
  },
});
