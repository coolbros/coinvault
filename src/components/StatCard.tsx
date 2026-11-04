import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing, Typography } from '../constants/theme';
import { Card } from './Card';

export interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  accentColor?: string;
  style?: ViewStyle;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtitle,
  icon,
  accentColor,
  style,
}) => {
  return (
    <Card
      style={[styles.container, style]}
      variant="surface"
    >
      <View style={styles.headerRow}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        {icon && (
          <View
            style={[
              styles.iconWrapper,
              accentColor ? { backgroundColor: `${accentColor}1A`, borderColor: `${accentColor}44` } : null,
            ]}
          >
            {icon}
          </View>
        )}
      </View>

      <Text
        style={[
          styles.value,
          accentColor ? { color: accentColor } : { color: Colors.dark.primaryLight },
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>

      {subtitle ? (
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    minWidth: 140,
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  label: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
    flex: 1,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.dark.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  value: {
    ...Typography.header,
    fontWeight: '700',
    marginVertical: 2,
  },
  subtitle: {
    ...Typography.micro,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
});
