import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../src/constants/theme';
import { useCollectionStore } from '../src/stores/collectionStore';
import { useSettingsStore } from '../src/stores/settingsStore';
import { Card } from '../src/components/Card';
import { StatCard } from '../src/components/StatCard';

export default function AnalyticsScreen() {
  const { statistics, refreshStatistics, loadSpecimens, isLoading } = useCollectionStore();
  const formatPrice = useSettingsStore((s) => s.formatPrice);

  useEffect(() => {
    loadSpecimens();
    refreshStatistics();
  }, []);

  const totalCost = statistics?.totalAcquisitionCost ?? 0;
  const totalVal = statistics?.totalEstimatedValue ?? 0;
  const gainAmount = totalVal - totalCost;
  const gainPercent = totalCost > 0 ? Math.round((gainAmount / totalCost) * 100) : 0;
  const isGainPositive = gainAmount >= 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={() => {
            loadSpecimens();
            refreshStatistics();
          }}
          tintColor={Colors.dark.primary}
        />
      }
    >
      {/* Financial Portfolio Summary */}
      <Text style={styles.sectionTitle}>FINANCIAL VALUATION & APPRECIATION</Text>
      <View style={styles.statsRow}>
        <StatCard
          label="Estimated Value"
          value={formatPrice(totalVal)}
          subtitle="Fair market aggregate"
          icon={<Ionicons name="trending-up" size={16} color={Colors.dark.success} />}
          accentColor={Colors.dark.success}
        />
        <StatCard
          label="Acquisition Cost"
          value={formatPrice(totalCost)}
          subtitle="Total invested capital"
          icon={<Ionicons name="wallet-outline" size={16} color={Colors.dark.primaryLight} />}
        />
      </View>

      <Card style={styles.roiCard} variant="surface">
        <View style={styles.roiRow}>
          <View>
            <Text style={styles.roiLabel}>UNREALIZED CAPITAL GAIN</Text>
            <Text
              style={[
                styles.roiAmount,
                { color: isGainPositive ? Colors.dark.success : Colors.dark.danger },
              ]}
            >
              {isGainPositive ? '+' : ''}{formatPrice(gainAmount)} ({isGainPositive ? '+' : ''}{gainPercent}%)
            </Text>
          </View>
          <View
            style={[
              styles.roiBadge,
              { backgroundColor: isGainPositive ? Colors.dark.successMuted : Colors.dark.dangerMuted },
            ]}
          >
            <Ionicons
              name={isGainPositive ? 'arrow-up' : 'arrow-down'}
              size={20}
              color={isGainPositive ? Colors.dark.success : Colors.dark.danger}
            />
          </View>
        </View>
      </Card>

      {/* Geographic Distribution */}
      <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>
        GEOGRAPHIC COLLECTION COVERAGE
      </Text>
      <Card style={styles.sectionCard} variant="surface">
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardHeaderText}>
            {statistics?.countriesRepresented || 0} Sovereign Origins Represented
          </Text>
        </View>

        {statistics?.countryDistribution && statistics.countryDistribution.length > 0 ? (
          <View style={styles.barsList}>
            {statistics.countryDistribution.map((item, idx) => (
              <View key={idx} style={styles.barItem}>
                <View style={styles.barHeader}>
                  <Text style={styles.barTitle}>{item.country}</Text>
                  <Text style={styles.barValue}>{item.percentage}% ({item.count})</Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.max(4, item.percentage)}%`,
                        backgroundColor: idx === 0 ? Colors.dark.primary : Colors.dark.secondary,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No country data available.</Text>
        )}
      </Card>

      {/* Metal Composition Breakdown */}
      <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>
        METALLURGIC COMPOSITION
      </Text>
      <Card style={styles.sectionCard} variant="surface">
        {statistics?.metalDistribution && statistics.metalDistribution.length > 0 ? (
          <View style={styles.barsList}>
            {statistics.metalDistribution.map((item, idx) => {
              const m = item.metal.toLowerCase();
              const color = m.includes('gold')
                ? Colors.dark.gold
                : m.includes('silver')
                ? Colors.dark.silver
                : m.includes('bronze')
                ? Colors.dark.bronze
                : m.includes('copper')
                ? Colors.dark.copper
                : Colors.dark.nickel;

              return (
                <View key={idx} style={styles.barItem}>
                  <View style={styles.barHeader}>
                    <Text style={styles.barTitle}>{item.metal}</Text>
                    <Text style={styles.barValue}>{item.percentage}% ({item.count})</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${Math.max(4, item.percentage)}%`,
                          backgroundColor: color,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.emptyText}>No metal data available.</Text>
        )}
      </Card>

      {/* Historical Era Distribution */}
      <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>
        HISTORICAL EPOCHS & PERIODS
      </Text>
      <Card style={styles.sectionCard} variant="surface">
        {statistics?.periodDistribution && statistics.periodDistribution.length > 0 ? (
          <View style={styles.barsList}>
            {statistics.periodDistribution.map((item, idx) => (
              <View key={idx} style={styles.barItem}>
                <View style={styles.barHeader}>
                  <Text style={styles.barTitle}>{item.period}</Text>
                  <Text style={styles.barValue}>{item.percentage}% ({item.count})</Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.max(4, item.percentage)}%`,
                        backgroundColor: Colors.dark.info,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No historical period data available.</Text>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  sectionTitle: {
    ...Typography.micro,
    color: Colors.dark.textSecondary,
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  roiCard: {
    padding: Spacing.md,
    borderColor: Colors.dark.primaryDark,
  },
  roiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roiLabel: {
    ...Typography.micro,
    color: Colors.dark.textMuted,
    letterSpacing: 0.6,
  },
  roiAmount: {
    ...Typography.title,
    fontWeight: '700',
    marginTop: 4,
  },
  roiBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  cardHeaderRow: {
    marginBottom: Spacing.sm,
  },
  cardHeaderText: {
    ...Typography.caption,
    color: Colors.dark.primaryLight,
    fontWeight: '600',
  },
  barsList: {
    gap: Spacing.sm,
  },
  barItem: {
    marginVertical: 2,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  barTitle: {
    ...Typography.caption,
    color: Colors.dark.text,
  },
  barValue: {
    ...Typography.micro,
    color: Colors.dark.textSecondary,
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.elevated,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  emptyText: {
    ...Typography.caption,
    color: Colors.dark.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
});
