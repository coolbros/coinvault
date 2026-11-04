import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../src/constants/theme';
import { useCollectionStore } from '../../src/stores/collectionStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { StatCard } from '../../src/components/StatCard';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { CoinAvatar } from '../../src/components/CoinAvatar';
import { Badge } from '../../src/components/Badge';

export default function HomeScreen() {
  const router = useRouter();
  const { specimens, statistics, loadSpecimens, isLoading } = useCollectionStore();
  const formatPrice = useSettingsStore((s) => s.formatPrice);

  useEffect(() => {
    loadSpecimens();
  }, []);

  const totalSpecimens = statistics?.totalSpecimens ?? 0;
  const uniqueCoinTypes = statistics?.uniqueCoinTypes ?? 0;
  const totalValuation = statistics?.totalEstimatedValue ?? 0;
  const totalCountries = statistics?.countriesRepresented ?? 0;
  const recentCoins = specimens.slice(0, 5);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={loadSpecimens}
          tintColor={Colors.dark.primary}
        />
      }
    >
      {/* Welcome Banner */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Cabinet of Coins</Text>
          <Text style={styles.headerSubtitle}>
            Numismatic Vault & Archival Record
          </Text>
        </View>
        <TouchableOpacity
          style={styles.analyticsButton}
          onPress={() => router.push('/analytics')}
        >
          <Ionicons name="bar-chart-outline" size={20} color={Colors.dark.primaryLight} />
        </TouchableOpacity>
      </View>

      {/* Primary Collection Statistics (Real SQLite Data) */}
      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <StatCard
            label="Coins Owned"
            value={totalSpecimens}
            subtitle={totalSpecimens === 1 ? '1 physical specimen' : `${totalSpecimens} physical specimens`}
            icon={<Ionicons name="layers" size={16} color={Colors.dark.primary} />}
          />
          <StatCard
            label="Unique Types"
            value={uniqueCoinTypes}
            subtitle={uniqueCoinTypes === 1 ? '1 classification' : `${uniqueCoinTypes} classifications`}
            icon={<Ionicons name="ribbon-outline" size={16} color={Colors.dark.info} />}
            accentColor={Colors.dark.info}
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard
            label="Portfolio Value"
            value={formatPrice(totalValuation)}
            subtitle="Estimated market value"
            icon={<Ionicons name="trending-up" size={16} color={Colors.dark.success} />}
            accentColor={Colors.dark.success}
          />
          <StatCard
            label="Countries"
            value={totalCountries}
            subtitle="Origins represented"
            icon={<Ionicons name="globe-outline" size={16} color={Colors.dark.primaryLight} />}
          />
        </View>
      </View>

      {/* Quick Actions Row */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
      </View>
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(tabs)/scan')}
          activeOpacity={0.75}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#332712' }]}>
            <Ionicons name="camera" size={22} color={Colors.dark.primary} />
          </View>
          <Text style={styles.actionText}>Scan Coin</Text>
          <Text style={styles.actionSubtext}>AI Vision Attribution</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/specimen/new')}
          activeOpacity={0.75}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#1A2938' }]}>
            <Ionicons name="add-circle-outline" size={22} color={Colors.dark.info} />
          </View>
          <Text style={styles.actionText}>Add Manual</Text>
          <Text style={styles.actionSubtext}>Direct Specimen Entry</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/analytics')}
          activeOpacity={0.75}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#163323' }]}>
            <Ionicons name="pie-chart-outline" size={22} color={Colors.dark.success} />
          </View>
          <Text style={styles.actionText}>Analytics</Text>
          <Text style={styles.actionSubtext}>Deep Breakdown</Text>
        </TouchableOpacity>
      </View>

      {/* Empty State for New Collector */}
      {totalSpecimens === 0 ? (
        <Card style={styles.emptyCard} variant="goldAccent">
          <Ionicons name="shield-checkmark-outline" size={48} color={Colors.dark.primary} />
          <Text style={styles.emptyTitle}>Your Numismatic Journey Begins Here</Text>
          <Text style={styles.emptyDesc}>
            Photograph a physical coin with the scanner to identify its denomination, issuing ruler, mint, and metal composition using computer vision.
          </Text>
          <View style={styles.emptyActions}>
            <Button
              title="Scan Your First Coin"
              icon={<Ionicons name="scan" size={18} color="#101214" />}
              onPress={() => router.push('/(tabs)/scan')}
              style={{ flex: 1, marginRight: Spacing.sm }}
            />
            <Button
              title="Add Manually"
              variant="outline"
              onPress={() => router.push('/specimen/new')}
              style={{ flex: 1 }}
            />
          </View>
        </Card>
      ) : (
        <>
          {/* Collection Insights */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Collection Insights</Text>
          </View>
          <Card style={styles.insightCard} variant="surface">
            <View style={styles.insightRow}>
              <View style={styles.insightItem}>
                <Text style={styles.insightLabel}>TOP COUNTRY</Text>
                <Text style={styles.insightValue}>
                  {statistics?.mostRepresentedCountry || 'None'}
                </Text>
              </View>
              <View style={styles.insightDivider} />
              <View style={styles.insightItem}>
                <Text style={styles.insightLabel}>COMMON DENOMINATION</Text>
                <Text style={styles.insightValue}>
                  {statistics?.mostCommonDenomination || 'None'}
                </Text>
              </View>
            </View>

            {/* Distribution bars */}
            {statistics?.metalDistribution && statistics.metalDistribution.length > 0 && (
              <View style={styles.distributionContainer}>
                <Text style={styles.distributionHeader}>Metal Composition</Text>
                <View style={styles.barWrapper}>
                  {statistics.metalDistribution.slice(0, 4).map((m, idx) => (
                    <View key={idx} style={styles.barItem}>
                      <View style={styles.barInfo}>
                        <Text style={styles.barLabel}>{m.metal}</Text>
                        <Text style={styles.barPercent}>{m.percentage}% ({m.count})</Text>
                      </View>
                      <View style={styles.barBackground}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              width: `${Math.max(5, m.percentage)}%`,
                              backgroundColor:
                                idx === 0
                                  ? Colors.dark.gold
                                  : idx === 1
                                  ? Colors.dark.silver
                                  : idx === 2
                                  ? Colors.dark.copper
                                  : Colors.dark.info,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </Card>

          {/* Recently Added Coins */}
          <View style={[styles.sectionHeader, { marginTop: Spacing.lg }]}>
            <Text style={styles.sectionTitle}>Recently Added Specimens</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/collection')}>
              <Text style={styles.seeAllText}>View All ({totalSpecimens})</Text>
            </TouchableOpacity>
          </View>

          {recentCoins.map((specimen) => {
            const ct = specimen.coin_type;
            const val = specimen.latest_valuation;
            return (
              <Card
                key={specimen.id}
                style={styles.recentItem}
                onPress={() => router.push(`/specimen/${specimen.id}`)}
              >
                <CoinAvatar
                  obverseUri={specimen.obverse_image_path}
                  reverseUri={specimen.reverse_image_path}
                  metal={ct?.metal}
                  denomination={ct?.denomination}
                  year={ct?.year_start}
                  size={58}
                />
                <View style={styles.recentDetails}>
                  <Text style={styles.recentTitle} numberOfLines={1}>
                    {specimen.custom_name || `${ct?.country} ${ct?.denomination}`}
                  </Text>
                  <Text style={styles.recentMeta}>
                    {ct?.country} • {ct?.year_start ? (ct.year_start > 0 ? ct.year_start : `${Math.abs(ct.year_start)} BCE`) : 'Undated'}
                  </Text>
                  <View style={styles.recentBadges}>
                    {ct?.metal ? (
                      <Badge
                        label={ct.metal}
                        variant={
                          ct.metal.toLowerCase().includes('gold')
                            ? 'gold'
                            : ct.metal.toLowerCase().includes('silver')
                            ? 'silver'
                            : 'default'
                        }
                        size="sm"
                        style={{ marginRight: 6 }}
                      />
                    ) : null}
                    {specimen.user_grade ? (
                      <Badge label={specimen.user_grade} variant="success" size="sm" />
                    ) : null}
                  </View>
                </View>
                <View style={styles.recentValuation}>
                  <Text style={styles.recentValText}>
                    {val
                      ? formatPrice(val.estimated_value_max)
                      : specimen.acquisition_price
                      ? formatPrice(specimen.acquisition_price)
                      : '—'}
                  </Text>
                  <Text style={styles.recentValLabel}>
                    {val ? 'EST. VALUE' : 'COST'}
                  </Text>
                </View>
              </Card>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  contentContainer: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    ...Typography.header,
    color: Colors.dark.text,
  },
  headerSubtitle: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  analyticsButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.subtitle,
    color: Colors.dark.text,
    fontWeight: '700',
  },
  seeAllText: {
    ...Typography.caption,
    color: Colors.dark.primary,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: Spacing.sm + 2,
    alignItems: 'center',
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  actionText: {
    ...Typography.caption,
    color: Colors.dark.text,
    fontWeight: '700',
  },
  actionSubtext: {
    ...Typography.micro,
    color: Colors.dark.textMuted,
    marginTop: 1,
    textAlign: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    marginTop: Spacing.sm,
  },
  emptyTitle: {
    ...Typography.title,
    color: Colors.dark.text,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  emptyDesc: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  emptyActions: {
    flexDirection: 'row',
    width: '100%',
  },
  insightCard: {
    padding: Spacing.md,
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: Spacing.sm,
  },
  insightItem: {
    flex: 1,
    alignItems: 'center',
  },
  insightLabel: {
    ...Typography.micro,
    color: Colors.dark.textMuted,
    letterSpacing: 0.6,
  },
  insightValue: {
    ...Typography.subtitle,
    color: Colors.dark.primaryLight,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  insightDivider: {
    width: 1,
    height: '100%',
    backgroundColor: Colors.dark.border,
  },
  distributionContainer: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  distributionHeader: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  barWrapper: {
    gap: 6,
  },
  barItem: {
    marginVertical: 2,
  },
  barInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  barLabel: {
    ...Typography.caption,
    color: Colors.dark.text,
  },
  barPercent: {
    ...Typography.micro,
    color: Colors.dark.textMuted,
  },
  barBackground: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.dark.surfaceHighlight,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    padding: Spacing.sm + 2,
  },
  recentDetails: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  recentTitle: {
    ...Typography.subtitle,
    color: Colors.dark.text,
    fontSize: 15,
  },
  recentMeta: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: 1,
  },
  recentBadges: {
    flexDirection: 'row',
    marginTop: 4,
  },
  recentValuation: {
    alignItems: 'flex-end',
    marginLeft: Spacing.sm,
  },
  recentValText: {
    ...Typography.subtitle,
    color: Colors.dark.primaryLight,
    fontWeight: '700',
  },
  recentValLabel: {
    ...Typography.micro,
    color: Colors.dark.textMuted,
    marginTop: 1,
  },
});
