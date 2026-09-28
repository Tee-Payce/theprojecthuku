import { FarmTheme } from '@/constants/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { GlassCard, GlassVariant } from './GlassCard';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  mciName?: keyof typeof MaterialCommunityIcons.glyphMap;
  variant?: GlassVariant;
  accentColor?: string;
  onPress?: () => void;
  style?: ViewStyle;
  valueStyle?: TextStyle;
  trendText?: string;
  trendPositive?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  iconName,
  mciName,
  variant = 'default',
  accentColor,
  onPress,
  style,
  valueStyle,
  trendText,
  trendPositive,
}) => {
  const getDefaultAccent = () => {
    switch (variant) {
      case 'emerald':
        return FarmTheme.colors.forestMedium;
      case 'harvest':
        return FarmTheme.colors.amber;
      case 'rose':
        return FarmTheme.colors.rose;
      case 'forest':
        return FarmTheme.colors.emeraldLight;
      default:
        return FarmTheme.colors.forest;
    }
  };

  const accent = accentColor || getDefaultAccent();
  const isDark = variant === 'forest';

  const cardContent = (
    <View style={styles.inner}>
      <View style={styles.topRow}>
        <Text
          style={[
            styles.title,
            { color: isDark ? 'rgba(255, 255, 255, 0.75)' : FarmTheme.colors.textMuted },
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {(iconName || mciName) && (
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.12)'
                  : `${accent}15`,
              },
            ]}
          >
            {iconName ? (
              <Ionicons
                name={iconName}
                size={18}
                color={isDark ? FarmTheme.colors.emeraldLight : accent}
              />
            ) : mciName ? (
              <MaterialCommunityIcons
                name={mciName}
                size={18}
                color={isDark ? FarmTheme.colors.emeraldLight : accent}
              />
            ) : null}
          </View>
        )}
      </View>

      <Text
        style={[
          styles.value,
          { color: isDark ? '#FFFFFF' : FarmTheme.colors.textPrimary },
          valueStyle,
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>

      {(subtitle || trendText) && (
        <View style={styles.footerRow}>
          {subtitle && (
            <Text
              style={[
                styles.subtitle,
                { color: isDark ? 'rgba(255, 255, 255, 0.65)' : FarmTheme.colors.textSecondary },
              ]}
              numberOfLines={2}
            >
              {subtitle}
            </Text>
          )}
          {trendText && (
            <View
              style={[
                styles.trendChip,
                {
                  backgroundColor:
                    trendPositive !== undefined
                      ? trendPositive
                        ? 'rgba(34, 197, 94, 0.15)'
                        : 'rgba(239, 68, 68, 0.15)'
                      : 'rgba(0,0,0,0.05)',
                },
              ]}
            >
              <Text
                style={[
                  styles.trendText,
                  {
                    color:
                      trendPositive !== undefined
                        ? trendPositive
                          ? FarmTheme.colors.forest
                          : FarmTheme.colors.rose
                        : FarmTheme.colors.textMuted,
                  },
                ]}
              >
                {trendText}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={[styles.wrapper, style]}
      >
        <GlassCard variant={variant} contentStyle={styles.cardPadding}>
          {cardContent}
        </GlassCard>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.wrapper, style]}>
      <GlassCard variant={variant} contentStyle={styles.cardPadding}>
        {cardContent}
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    minWidth: 140,
  },
  cardPadding: {
    padding: 14,
  },
  inner: {
    flexDirection: 'column',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    flex: 1,
    marginRight: 6,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: FarmTheme.radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 11,
    flex: 1,
    lineHeight: 14,
  },
  trendChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: FarmTheme.radius.xs,
    marginLeft: 6,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
