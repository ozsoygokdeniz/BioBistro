export const theme = {
  colors: {
    background: '#F9FAFB',
    glassBg: '#FFFFFF',
    glassBorder: '#E5E7EB',
    primary: '#5DBB63',         // Vibrant green
    primaryLight: '#A8DFA9',    // Light green for subtle accents
    primaryHover: '#4AA350',    // Darker green on press
    primaryBg: '#F0FBF0',       // Very light green background
    secondary: '#F59E0B',       // Amber - star rating
    secondaryBg: '#FEF9EC',
    accent: '#10B981',          // Teal-green accent
    text: '#111827',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    danger: '#EF4444',
    dangerBg: '#FEE2E2',
    successBg: '#DCFCE7',
    cardBg: '#FFFFFF',
    divider: '#F3F4F6',
    overlay: 'rgba(0,0,0,0.5)',
  },
  gradients: {
    primary: ['#5DBB63', '#3DA344'],
    card: ['#FFFFFF', '#F9FAFB'],
    hero: ['#F0FBF0', '#DCFCE7'],
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    s: 8,
    m: 16,
    l: 24,
    xl: 36,
    full: 999,
  },
  typography: {
    h1: { fontSize: 36, fontWeight: '700', lineHeight: 44 },
    h2: { fontSize: 28, fontWeight: '700', lineHeight: 36 },
    h3: { fontSize: 22, fontWeight: '700', lineHeight: 30 },
    h4: { fontSize: 18, fontWeight: '600', lineHeight: 26 },
    body: { fontSize: 15, fontWeight: '400', lineHeight: 22 },
    bodyBold: { fontSize: 15, fontWeight: '600', lineHeight: 22 },
    caption: { fontSize: 12, fontWeight: '500', lineHeight: 16 },
    label: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  },
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.10,
      shadowRadius: 14,
      elevation: 5,
    },
    large: {
      shadowColor: '#5DBB63',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.20,
      shadowRadius: 20,
      elevation: 8,
    },
  },
};
