import { FarmTheme } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

export type BadgeVariant = 'active' | 'completed' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'active',
  size = 'md',
  dot = true,
  style,
  textStyle,
}) => {
  const getColors = () => {
    switch (variant) {
      case 'active':
        return {
          bg: 'rgba(220, 252, 231, 0.85)',
          text: FarmTheme.colors.forest,
          border: 'rgba(34, 197, 94, 0.35)',
          dot: FarmTheme.colors.emerald,
        };
      case 'completed':
        return {
          bg: 'rgba(224, 242, 254, 0.85)',
          text: FarmTheme.colors.skyDark,
          border: 'rgba(2, 132, 199, 0.3)',
          dot: FarmTheme.colors.sky,
        };
      case 'warning':
        return {
          bg: 'rgba(254, 243, 199, 0.90)',
          text: FarmTheme.colors.goldDark,
          border: 'rgba(245, 158, 11, 0.35)',
          dot: FarmTheme.colors.amber,
        };
      case 'danger':
        return {
          bg: 'rgba(254, 226, 226, 0.90)',
          text: FarmTheme.colors.roseDark,
          border: 'rgba(239, 68, 68, 0.35)',
          dot: FarmTheme.colors.rose,
        };
      case 'info':
        return {
          bg: 'rgba(245, 243, 255, 0.85)',
          text: FarmTheme.colors.purple,
          border: 'rgba(124, 58, 237, 0.3)',
          dot: FarmTheme.colors.purple,
        };
      case 'neutral':
      default:
        return {
          bg: 'rgba(243, 244, 246, 0.85)',
          text: '#4B5563',
          border: 'rgba(156, 163, 175, 0.3)',
          dot: '#9CA3AF',
        };
    }
  };

  const colors = getColors();
  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          paddingVertical: isSm ? 2 : 4,
          paddingHorizontal: isSm ? 8 : 10,
        },
        style,
      ]}
    >
      {dot && (
        <View
          style={[
            styles.dot,
            {
              backgroundColor: colors.dot,
              width: isSm ? 5 : 6,
              height: isSm ? 5 : 6,
            },
          ]}
        />
      )}
      <Text
        style={[
          styles.text,
          {
            color: colors.text,
            fontSize: isSm ? 11 : 12,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: FarmTheme.radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    borderRadius: FarmTheme.radius.full,
    marginRight: 5,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
