import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors, BorderRadius, Typography } from '../constants/theme';

export interface BadgeProps {
  label: string;
  variant?: 'gold' | 'silver' | 'bronze' | 'copper' | 'nickel' | 'default' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  size = 'md',
  style,
}) => {
  const getColors = () => {
    switch (variant) {
      case 'gold':
        return { bg: '#332A15', border: Colors.dark.primary, text: Colors.dark.primaryLight };
      case 'silver':
        return { bg: '#25292D', border: Colors.dark.silver, text: '#E2E4E6' };
      case 'bronze':
        return { bg: '#332215', border: Colors.dark.bronze, text: '#E5A570' };
      case 'copper':
        return { bg: '#331F15', border: Colors.dark.copper, text: '#DF8D5B' };
      case 'nickel':
        return { bg: '#23282C', border: Colors.dark.nickel, text: '#C7C9CD' };
      case 'success':
        return { bg: Colors.dark.successMuted, border: Colors.dark.success, text: Colors.dark.success };
      case 'warning':
        return { bg: Colors.dark.warningMuted, border: Colors.dark.warning, text: Colors.dark.warning };
      case 'danger':
        return { bg: Colors.dark.dangerMuted, border: Colors.dark.danger, text: Colors.dark.danger };
      default:
        return { bg: Colors.dark.elevated, border: Colors.dark.border, text: Colors.dark.textSecondary };
    }
  };

  const colors = getColors();
  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          paddingVertical: isSm ? 2 : 4,
          paddingHorizontal: isSm ? 6 : 10,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: colors.text,
            fontSize: isSm ? 10 : 12,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
