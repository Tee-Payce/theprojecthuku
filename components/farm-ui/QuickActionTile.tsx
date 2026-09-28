import { FarmTheme } from '@/constants/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

interface QuickActionTileProps {
  title: string;
  subtitle?: string;
  onPress: () => void;
  iconName?: keyof typeof Ionicons.glyphMap;
  mciName?: keyof typeof MaterialCommunityIcons.glyphMap;
  emoji?: string;
  gradientColors?: readonly [string, string, ...string[]];
  badgeText?: string;
  style?: ViewStyle;
}

export const QuickActionTile: React.FC<QuickActionTileProps> = ({
  title,
  subtitle,
  onPress,
  iconName,
  mciName,
  emoji,
  gradientColors = FarmTheme.gradients.forestButton,
  badgeText,
  style,
}) => {
  const handlePress = () => {
    try {
      Haptics.selectionAsync();
    } catch {
      // Haptics fallback
    }
    onPress();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      style={[styles.tileWrapper, style]}
    >
      <View style={styles.cardContainer}>
        {/* Soft glass background */}
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.90)', 'rgba(246, 250, 246, 0.80)']}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.content}>
          {/* Icon with gradient circle */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {emoji ? (
              <Text style={styles.emojiText}>{emoji}</Text>
            ) : iconName ? (
              <Ionicons name={iconName} size={20} color="#FFFFFF" />
            ) : mciName ? (
              <MaterialCommunityIcons name={mciName} size={20} color="#FFFFFF" />
            ) : null}
          </View>

          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>

          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}

          {badgeText && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badgeText}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tileWrapper: {
    borderRadius: FarmTheme.radius.md,
    ...FarmTheme.shadows.soft,
    overflow: 'hidden',
  },
  cardContainer: {
    borderRadius: FarmTheme.radius.md,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    overflow: 'hidden',
  },
  content: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 96,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: FarmTheme.radius.sm,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    ...FarmTheme.shadows.soft,
  },
  emojiText: {
    fontSize: 22,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: FarmTheme.colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 10,
    color: FarmTheme.colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: FarmTheme.colors.amber,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: FarmTheme.radius.full,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
});
