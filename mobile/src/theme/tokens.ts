/**
 * Hex values for props that cannot take a className -- ActivityIndicator color,
 * react-native-svg fill/stroke, StatusBar, bottom-sheet handle styles.
 *
 * These mirror the Tailwind palette the web app actually uses (see
 * frontend/src/index.css); they are not a second source of truth for anything
 * that can be expressed as a class.
 */
export const tokens = {
  indigo50: '#EEF2FF',
  indigo100: '#E0E7FF',
  indigo600: '#4F46E5',
  indigo700: '#4338CA',
  indigo800: '#3730A3',

  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',

  gray800: '#1F2937',
  white: '#FFFFFF',

  amber50: '#FFFBEB',
  amber200: '#FDE68A',
  amber500: '#F59E0B',
  amber700: '#B45309',

  green600: '#16A34A',
  red600: '#DC2626',
} as const;
