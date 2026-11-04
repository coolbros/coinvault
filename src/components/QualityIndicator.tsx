import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing, Typography } from '../constants/theme';

export interface QualityAssessment {
  blurScore: number;       // 0 to 1 (1 = razor sharp)
  lightingScore: number;   // 0 to 1 (1 = balanced lighting)
  framingScore: number;    // 0 to 1 (1 = well centered)
  isAcceptable: boolean;
  issues: string[];
}

export interface QualityIndicatorProps {
  assessment: QualityAssessment | null;
  style?: ViewStyle;
}

export const QualityIndicator: React.FC<QualityIndicatorProps> = ({
  assessment,
  style,
}) => {
  if (!assessment) return null;

  const isGood = assessment.isAcceptable && assessment.issues.length === 0;

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: isGood ? Colors.dark.success : Colors.dark.warning,
          backgroundColor: isGood ? Colors.dark.successMuted : Colors.dark.warningMuted,
        },
        style,
      ]}
    >
      <View style={styles.headerRow}>
        <Ionicons
          name={isGood ? 'checkmark-circle' : 'alert-circle'}
          size={18}
          color={isGood ? Colors.dark.success : Colors.dark.warning}
          style={styles.icon}
        />
        <Text
          style={[
            styles.title,
            { color: isGood ? Colors.dark.success : Colors.dark.warning },
          ]}
        >
          {isGood ? 'Image Quality: Optimal for Numismatic AI' : 'Image Quality Warning'}
        </Text>
      </View>

      {assessment.issues.length > 0 ? (
        <View style={styles.issuesList}>
          {assessment.issues.map((issue, idx) => (
            <View key={idx} style={styles.issueItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.issueText}>{issue}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Focus</Text>
          <Text style={styles.metricValue}>{Math.round(assessment.blurScore * 100)}%</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Lighting</Text>
          <Text style={styles.metricValue}>{Math.round(assessment.lightingScore * 100)}%</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Framing</Text>
          <Text style={styles.metricValue}>{Math.round(assessment.framingScore * 100)}%</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.sm + 4,
    marginVertical: Spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: Spacing.xs,
  },
  title: {
    ...Typography.caption,
    fontWeight: '700',
  },
  issuesList: {
    marginTop: Spacing.xs,
    paddingLeft: Spacing.xs,
  },
  issueItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 1,
  },
  bullet: {
    color: Colors.dark.warning,
    marginRight: 6,
    fontSize: 12,
  },
  issueText: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    flex: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
    borderTopWidth: 0.5,
    borderTopColor: '#FFFFFF15',
  },
  metric: {
    alignItems: 'center',
  },
  metricLabel: {
    ...Typography.micro,
    color: Colors.dark.textMuted,
    textTransform: 'uppercase',
  },
  metricValue: {
    ...Typography.caption,
    color: Colors.dark.text,
    fontWeight: '700',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#FFFFFF15',
  },
});
