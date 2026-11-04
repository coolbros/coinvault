import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, TouchableOpacity } from 'react-native';
import { Colors, BorderRadius, Spacing } from '../constants/theme';

export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'surface' | 'elevated' | 'goldAccent';
  onPress?: () => void;
  activeOpacity?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'surface',
  onPress,
  activeOpacity = 0.75,
}) => {
  const getCardStyle = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: Colors.dark.elevated,
          borderColor: Colors.dark.borderLight,
        };
      case 'goldAccent':
        return {
          backgroundColor: Colors.dark.surface,
          borderColor: Colors.dark.primaryDark,
          borderWidth: 1.2,
        };
      case 'surface':
      default:
        return {
          backgroundColor: Colors.dark.surface,
          borderColor: Colors.dark.border,
        };
    }
  };

  const containerStyle = [styles.base, getCardStyle(), style];

  if (onPress) {
    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={onPress}
        activeOpacity={activeOpacity}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    overflow: 'hidden',
  },
});
