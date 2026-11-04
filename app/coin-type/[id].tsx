import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../src/constants/theme';
import { coinTypeRepository } from '../../src/db/repositories/coinTypeRepository';
import { specimenRepository } from '../../src/db/repositories/specimenRepository';
import { CoinType, Specimen } from '../../src/db/schema';
import { useCollectionStore } from '../../src/stores/collectionStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Badge } from '../../src/components/Badge';
import { CoinAvatar } from '../../src/components/CoinAvatar';

export default function CoinTypeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [coinType, setCoinType] = useState<CoinType | null>(null);
  const [ownedSpecimens, setOwnedSpecimens] = useState<Specimen[]>([]);

  const loadSpecimens = useCollectionStore((s) => s.loadSpecimens);
  const currency = useSettingsStore((s) => s.currency);
  const formatPrice = useSettingsStore((s) => s.formatPrice);

  useEffect(() => {
    if (!id) return;
    const ct = coinTypeRepository.getById(id);
    setCoinType(ct);

    // Fetch owned specimens of this type
    const specimens = specimenRepository.list().filter((s) => s.coin_type_id === id);
    setOwnedSpecimens(specimens);
  }, [id]);

  if (!coinType) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Coin classification not found.</Text>
      </View>
    );
  }

  const handleAddSpecimenOfThisType = () => {
    Alert.prompt
      ? Alert.prompt(
          'Add Specimen',
          `Add an owned specimen of ${coinType.country} ${coinType.denomination}? Enter grade (e.g. AU55):`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Add',
              onPress: (grade) => {
                const spec = specimenRepository.create({
                  coin_type_id: coinType.id,
                  custom_name: `${coinType.country} ${coinType.denomination} (${coinType.year_start || ''})`,
                  user_grade: grade || 'VF30',
                  acquisition_date: new Date().toISOString().split('T')[0],
                  acquisition_currency: currency,
                  acquisition_source: 'Added from Reference Catalog',
                });
                loadSpecimens();
                router.push(`/specimen/${spec.id}`);
              },
            },
          ]
        )
      : (() => {
          // Fallback if prompt is not supported on platform
          const spec = specimenRepository.create({
            coin_type_id: coinType.id,
            custom_name: `${coinType.country} ${coinType.denomination} (${coinType.year_start || ''})`,
            user_grade: 'AU50',
            acquisition_date: new Date().toISOString().split('T')[0],
            acquisition_currency: currency,
            acquisition_source: 'Added from Reference Catalog',
          });
          loadSpecimens();
          router.push(`/specimen/${spec.id}`);
        })();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Card */}
      <Card style={styles.headerCard} variant="surface">
        <View style={styles.avatarRow}>
          <CoinAvatar
            metal={coinType.metal}
            denomination={coinType.denomination}
            year={coinType.year_start}
            size={88}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.titleText}>{coinType.denomination}</Text>
            <Text style={styles.subtitleText}>
              {coinType.country} • {coinType.year_start ? (coinType.year_start > 0 ? coinType.year_start : `${Math.abs(coinType.year_start)} BCE`) : 'Undated'}
            </Text>
            <View style={styles.badgeRow}>
              {coinType.metal ? (
                <Badge
                  label={coinType.metal}
                  variant={
                    coinType.metal.toLowerCase().includes('gold')
                      ? 'gold'
                      : coinType.metal.toLowerCase().includes('silver')
                      ? 'silver'
                      : 'default'
                  }
                  size="sm"
                  style={{ marginRight: 6 }}
                />
              ) : null}
              <Badge
                label={coinType.is_reference_type === 1 ? 'Reference Standard' : 'Custom Classification'}
                variant="default"
                size="sm"
              />
            </View>
          </View>
        </View>

        {/* Action Button: Add Specimen of this Type */}
        <Button
          title="Add Physical Specimen to My Collection"
          icon={<Ionicons name="add" size={18} color="#101214" />}
          onPress={handleAddSpecimenOfThisType}
          style={{ marginTop: Spacing.md }}
        />
      </Card>

      {/* Specifications */}
      <Card style={styles.sectionCard} variant="surface">
        <Text style={styles.sectionTitle}>TECHNICAL SPECIFICATIONS</Text>
        <View style={styles.specGrid}>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Series</Text>
            <Text style={styles.specVal}>{coinType.coin_series || 'Standard Issue'}</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Historical Period</Text>
            <Text style={styles.specVal}>{coinType.historical_period || 'Historical'}</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Issuing Ruler / Authority</Text>
            <Text style={styles.specVal}>{coinType.ruler || 'Sovereign Authority'}</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Mint</Text>
            <Text style={styles.specVal}>{coinType.mint || 'Imperial / State Mint'}</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Standard Weight</Text>
            <Text style={styles.specVal}>{coinType.weight_g ? `${coinType.weight_g} g` : 'Variable'}</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Standard Diameter</Text>
            <Text style={styles.specVal}>{coinType.diameter_mm ? `${coinType.diameter_mm} mm` : 'Variable'}</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Edge Characteristics</Text>
            <Text style={styles.specVal}>{coinType.edge_type || 'Reeded / Lettered'}</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Shape</Text>
            <Text style={styles.specVal}>{coinType.shape || 'Round'}</Text>
          </View>
        </View>

        {coinType.catalog_references && coinType.catalog_references.length > 0 && (
          <View style={styles.catalogBox}>
            <Text style={styles.specLabel}>Catalog References</Text>
            <View style={styles.chipsRow}>
              {coinType.catalog_references.map((c, idx) => (
                <Badge key={idx} label={c} variant="gold" size="sm" style={{ marginRight: 6 }} />
              ))}
            </View>
          </View>
        )}
      </Card>

      {/* Design Motifs */}
      <Card style={styles.sectionCard} variant="surface">
        <Text style={styles.sectionTitle}>DESIGN MOTIFS & INSCRIPTIONS</Text>
        <View style={styles.motifItem}>
          <Text style={styles.motifHeader}>OBVERSE DESIGN</Text>
          <Text style={styles.motifBody}>
            {coinType.obverse_description || 'Design features central portrait or state emblem with surrounding titular legend.'}
          </Text>
        </View>

        <View style={[styles.motifItem, { marginTop: Spacing.sm }]}>
          <Text style={styles.motifHeader}>REVERSE DESIGN</Text>
          <Text style={styles.motifBody}>
            {coinType.reverse_description || 'Design features denomination value, issuing heraldry or wildlife motif, and mint date.'}
          </Text>
        </View>
      </Card>

      {/* Owned Physical Specimens of this Type */}
      <View style={styles.ownedHeaderRow}>
        <Text style={styles.ownedTitle}>
          Physical Specimens in Your Cabinet ({ownedSpecimens.length})
        </Text>
      </View>

      {ownedSpecimens.length > 0 ? (
        ownedSpecimens.map((s) => (
          <Card
            key={s.id}
            style={styles.specimenCard}
            onPress={() => router.push(`/specimen/${s.id}`)}
          >
            <CoinAvatar
              obverseUri={s.obverse_image_path}
              reverseUri={s.reverse_image_path}
              metal={coinType.metal}
              denomination={coinType.denomination}
              year={coinType.year_start}
              size={50}
            />
            <View style={styles.specimenDetails}>
              <Text style={styles.specimenName}>{s.custom_name || 'Specimen'}</Text>
              <Text style={styles.specimenGrade}>
                Grade: {s.user_grade || 'Unassessed'} • {s.acquisition_source || 'Collection'}
              </Text>
            </View>
            <Text style={styles.specimenPrice}>
              {s.latest_valuation
                ? formatPrice(s.latest_valuation.estimated_value_max)
                : s.acquisition_price
                ? formatPrice(s.acquisition_price)
                : '—'}
            </Text>
          </Card>
        ))
      ) : (
        <Card style={styles.emptyOwnedCard} variant="elevated">
          <Ionicons name="file-tray-outline" size={28} color={Colors.dark.textMuted} />
          <Text style={styles.emptyOwnedText}>
            You do not currently own any physical specimens of this coin type.
          </Text>
        </Card>
      )}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
  },
  loadingText: {
    ...Typography.subtitle,
    color: Colors.dark.textSecondary,
  },
  headerCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  titleText: {
    ...Typography.title,
    color: Colors.dark.text,
  },
  subtitleText: {
    ...Typography.body,
    color: Colors.dark.primaryLight,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: Spacing.xs,
  },
  sectionCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.micro,
    color: Colors.dark.textMuted,
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  specItem: {
    width: '50%',
    marginBottom: Spacing.sm,
  },
  specLabel: {
    ...Typography.micro,
    color: Colors.dark.textMuted,
  },
  specVal: {
    ...Typography.caption,
    color: Colors.dark.text,
    fontWeight: '600',
    marginTop: 2,
  },
  catalogBox: {
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 0.5,
    borderTopColor: Colors.dark.border,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  motifItem: {
    backgroundColor: Colors.dark.elevated,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  motifHeader: {
    ...Typography.micro,
    color: Colors.dark.primary,
    letterSpacing: 0.6,
  },
  motifBody: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  ownedHeaderRow: {
    marginVertical: Spacing.xs,
    marginLeft: 4,
  },
  ownedTitle: {
    ...Typography.subtitle,
    color: Colors.dark.text,
    fontSize: 15,
  },
  specimenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  specimenDetails: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  specimenName: {
    ...Typography.caption,
    color: Colors.dark.text,
    fontWeight: '700',
  },
  specimenGrade: {
    ...Typography.micro,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  specimenPrice: {
    ...Typography.caption,
    color: Colors.dark.primaryLight,
    fontWeight: '700',
  },
  emptyOwnedCard: {
    alignItems: 'center',
    padding: Spacing.md,
    marginVertical: Spacing.xs,
  },
  emptyOwnedText: {
    ...Typography.caption,
    color: Colors.dark.textMuted,
    textAlign: 'center',
    marginTop: 6,
  },
});
