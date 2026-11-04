import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, BorderRadius, Spacing, Typography } from '../constants/theme';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  hapticFeedback?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
  hapticFeedback = true,
}) => {
  const handlePress = () => {
    if (disabled || loading) return;
    if (hapticFeedback) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    onPress();
  };

  const getContainerStyles = (): ViewStyle => {
    let bg = Colors.dark.primary;
    let border = Colors.dark.primary;

    switch (variant) {
      case 'secondary':
        bg = Colors.dark.elevated;
        border = Colors.dark.borderLight;
        break;
      case 'outline':
        bg = 'transparent';
        border = Colors.dark.primary;
        break;
      case 'danger':
        bg = Colors.dark.danger;
        border = Colors.dark.danger;
        break;
      case 'ghost':
        bg = 'transparent';
        border = 'transparent';
        break;
      case 'primary':
      default:
        bg = Colors.dark.primary;
        border = Colors.dark.primary;
        break;
    }

    let paddingVertical = Spacing.sm + 4;
    let paddingHorizontal = Spacing.md;

    if (size === 'sm') {
      paddingVertical = Spacing.xs + 2;
      paddingHorizontal = Spacing.sm;
    } else if (size === 'lg') {
      paddingVertical = Spacing.md;
      paddingHorizontal = Spacing.lg;
    }

    return {
      backgroundColor: disabled ? Colors.dark.surfaceHighlight : bg,
      borderColor: disabled ? Colors.dark.border : border,
      borderWidth: variant === 'outline' || variant === 'secondary' ? 1 : 0,
      paddingVertical,
      paddingHorizontal,
      opacity: disabled ? 0.5 : 1,
    };
  };

  const getTextStyles = (): TextStyle => {
    let color = Colors.dark.textInverse;

    switch (variant) {
      case 'secondary':
        color = Colors.dark.text;
        break;
      case 'outline':
      case 'ghost':
        color = Colors.dark.primary;
        break;
      case 'danger':
        color = '#FFFFFF';
        break;
      case 'primary':
      default:
        color = '#101214'; // dark on gold
        break;
    }

    return {
      color: disabled ? Colors.dark.textMuted : color,
      fontSize: size === 'sm' ? 12 : size === 'lg' ? 16 : 14,
      fontWeight: '600',
      letterSpacing: 0.3,
    };
  };

  return (
    <TouchableOpacity
      style={[styles.base, getContainerStyles(), style]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? Colors.dark.textInverse : Colors.dark.primary}
        />
      ) : (
        <>
          {icon}
          <Text style={[getTextStyles(), icon ? { marginLeft: 8 } : null, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
