export const Colors = {
  dark: {
    background: '#101214',
    surface: '#191D20',
    elevated: '#22272B',
    surfaceHighlight: '#2A3036',
    border: '#2C3237',
    borderLight: '#394046',
    
    // Luxury Numismatic Gold Accents
    primary: '#C5A15A',       // Antique gold
    primaryLight: '#DFC287',
    primaryDark: '#9C7E3A',
    primaryMuted: '#C5A15A22',
    secondary: '#A9A18E',     // Warm champagne
    
    // Text colors
    text: '#F2F0E9',
    textSecondary: '#92999D',
    textMuted: '#687076',
    textInverse: '#101214',
    
    // Status colors
    success: '#4E9F6E',
    successMuted: '#4E9F6E22',
    warning: '#D48A37',
    warningMuted: '#D48A3722',
    danger: '#D9534F',
    dangerMuted: '#D9534F22',
    info: '#4A88BA',
    infoMuted: '#4A88BA22',
    
    // Metallic / Numismatic Badges
    gold: '#D4AF37',
    silver: '#C0C0C0',
    bronze: '#CD7F32',
    copper: '#B87333',
    nickel: '#A8A9AD',
  },
  light: {
    background: '#F7F6F2',
    surface: '#FFFFFF',
    elevated: '#F0EFEA',
    surfaceHighlight: '#E8E6DF',
    border: '#E0DDD5',
    borderLight: '#CAC5B8',
    
    primary: '#9C7E3A',
    primaryLight: '#B89A4E',
    primaryDark: '#755E29',
    primaryMuted: '#9C7E3A1A',
    secondary: '#736D61',
    
    text: '#191D20',
    textSecondary: '#5E666C',
    textMuted: '#8D969D',
    textInverse: '#F2F0E9',
    
    success: '#2E7D4E',
    successMuted: '#2E7D4E1A',
    warning: '#B86B1E',
    warningMuted: '#B86B1E1A',
    danger: '#C0392B',
    dangerMuted: '#C0392B1A',
    info: '#296DA0',
    infoMuted: '#296DA01A',
    
    gold: '#B89228',
    silver: '#8E9194',
    bronze: '#A65D1A',
    copper: '#9E5B22',
    nickel: '#797B80',
  }
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Typography = {
  header: {
    fontSize: 26,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 20,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    letterSpacing: 0.2,
  },
  micro: {
    fontSize: 10,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
  serif: {
    fontFamily: 'serif',
  }
};

export type ThemeColors = typeof Colors.dark;
