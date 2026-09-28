import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

interface ProgressBarProps {
  progress: number; // 0 to 1 (or 0 to 100 if > 1)
  height?: number;
  gradientColors?: readonly [string, string, ...string[]];
  trackColor?: string;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  gradientColors,
  trackColor = 'rgba(20, 83, 45, 0.08)',
  style,
}) => {
  // Normalize progress to 0..1
  const normalized = Math.min(Math.max(progress > 1 ? progress / 100 : progress, 0), 1);

  const defaultGradient =
    normalized >= 0.95
      ? (['#0284C7', '#38BDF8'] as const) // Ready/Blue
      : normalized >= 0.7
      ? (['#15803D', '#22C55E'] as const) // On Track/Emerald
      : normalized >= 0.4
      ? (['#D97706', '#F59E0B'] as const) // Mid growth/Amber
      : (['#0D9488', '#2DD4BF'] as const); // Starter/Teal

  const colors = gradientColors || defaultGradient;

  return (
    <View
      style={[
        styles.track,
        {
          height,
          backgroundColor: trackColor,
          borderRadius: height / 2,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.fillContainer,
          {
            width: `${Math.min(Math.max(Math.round(normalized * 100), 0), 100)}%` as any,
            borderRadius: height / 2,
          },
        ]}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fillContainer: {
    height: '100%',
    overflow: 'hidden',
  },
});
