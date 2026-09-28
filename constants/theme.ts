/**
 * The Project Huku - Design System & Theme
 * Modern agricultural / poultry farm aesthetics with glassmorphism tokens
 */

import { Platform, ViewStyle } from 'react-native';

export const FarmTheme = {
  colors: {
    // Farm Forest Greens (Primary Brand)
    forestDeep: '#082312',
    forestDark: '#0D351B',
    forest: '#14532D',
    forestMedium: '#166534',
    forestLight: '#15803D',
    emerald: '#22C55E',
    emeraldLight: '#86EFAC',
    emeraldSoft: 'rgba(34, 197, 94, 0.12)',
    mint: '#DCFCE7',
    mintSoft: '#d6f6e0ff',

    // Harvest / Golden / Amber (Feed, Eggs, Revenue highlights)
    goldDark: '#92400E',
    gold: '#B45309',
    amber: '#D97706',
    amberLight: '#e1930bff',
    amberSoft: 'rgba(245, 158, 11, 0.12)',
    amberPale: '#FEF3C7',
    wheat: '#FDE68A',

    // Terracotta / Earth Accents
    earthDark: '#78350F',
    earth: '#A16207',
    earthLight: '#CA8A04',

    // Alert & Mortality (Crimson / Coral)
    roseDark: '#991B1B',
    rose: '#DC2626',
    roseLight: '#EF4444',
    roseSoft: 'rgba(239, 68, 68, 0.10)',
    roseBorder: 'rgba(239, 68, 68, 0.25)',
    rosePale: '#FEF2F2',

    // Sky / Fresh Water / Info
    skyDark: '#0369A1',
    sky: '#0284C7',
    skyLight: '#38BDF8',
    skySoft: 'rgba(2, 132, 199, 0.12)',
    skyPale: '#F0F9FF',

    // Purple / Treatment / Medicine
    purple: '#7C3AED',
    purpleSoft: 'rgba(124, 58, 237, 0.12)',
    purplePale: '#F5F3FF',

    // App Surfaces & Neutrals
    background: '#F3F7F3', // Soft organic pasture tint
    backgroundDark: '#0A180E',
    surface: '#FFFFFF',
    surfaceSecondary: '#F8FAF8',
    surfaceSubtle: '#EFF4EF',

    // Typography
    textPrimary: '#0C2013',
    textSecondary: '#3F5346',
    textMuted: '#6E8375',
    textInverse: '#FFFFFF',
    textOnGlass: '#0F2417',

    // Dividers & Borders
    borderSubtle: 'rgba(20, 83, 45, 0.08)',
    borderMedium: 'rgba(20, 83, 45, 0.16)',
    borderStrong: 'rgba(20, 83, 45, 0.28)',

    // Glassmorphism Surfaces
    glassBg: 'rgba(255, 255, 255, 0.82)',
    glassBgHeavy: 'rgba(255, 255, 255, 0.92)',
    glassBgLight: 'rgba(255, 255, 255, 0.65)',
    glassBgTint: 'rgba(240, 253, 244, 0.80)',
    glassBorder: 'rgba(255, 255, 255, 0.70)',
    glassBorderDark: 'rgba(255, 255, 255, 0.15)',
    glassBorderGreen: 'rgba(34, 197, 94, 0.25)',
    glassBorderAmber: 'rgba(245, 158, 11, 0.25)',
    glassBorderRose: 'rgba(239, 68, 68, 0.25)',
  },

  gradients: {
    // Rich canopy / hero banner gradient
    forestHero: ['#0A2A16', '#124823', '#166534'] as const,
    forestButton: ['#166534', '#15803D'] as const,
    forestSoft: ['#F0FDF4', '#DCFCE7'] as const,
    harvestCard: ['rgba(254, 243, 199, 0.85)', 'rgba(253, 230, 138, 0.65)'] as const,
    harvestButton: ['#D97706', '#B45309'] as const,
    emeraldCard: ['rgba(236, 253, 245, 0.85)', 'rgba(209, 250, 229, 0.65)'] as const,
    roseCard: ['rgba(254, 242, 242, 0.85)', 'rgba(254, 226, 226, 0.65)'] as const,
    glassCard: ['rgba(255, 255, 255, 0.88)', 'rgba(255, 255, 255, 0.68)'] as const,
    glassInput: ['rgba(255, 255, 255, 0.95)', 'rgba(248, 250, 248, 0.90)'] as const,
  },

  radius: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 22,
    xl: 28,
    full: 9999,
  },

  shadows: {
    soft: {
      shadowColor: '#0B2915',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    } as ViewStyle,
    glass: {
      shadowColor: '#0B2915',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 4,
    } as ViewStyle,
    medium: {
      shadowColor: '#0B2915',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 4,
    } as ViewStyle,
    elevated: {
      shadowColor: '#0B2915',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 7,
    } as ViewStyle,
    glowGreen: {
      shadowColor: '#22C55E',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.28,
      shadowRadius: 12,
      elevation: 4,
    } as ViewStyle,
  },
};

// Backward compatibility with default Expo Colors object
export const Colors = {
  light: {
    text: FarmTheme.colors.textPrimary,
    background: FarmTheme.colors.background,
    tint: FarmTheme.colors.forest,
    icon: FarmTheme.colors.textMuted,
    tabIconDefault: FarmTheme.colors.textMuted,
    tabIconSelected: FarmTheme.colors.forest,
  },
  dark: {
    text: '#ECEDEE',
    background: FarmTheme.colors.backgroundDark,
    tint: FarmTheme.colors.emeraldLight,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: FarmTheme.colors.emeraldLight,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    serif: 'ui-serif',
    rounded: 'System',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
