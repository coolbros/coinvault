import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../src/constants/theme';
import { useCollectionStore } from '../../src/stores/collectionStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { specimenRepository } from '../../src/db/repositories/specimenRepository';
import { valuationRepository } from '../../src/db/repositories/valuationRepository';
import { conditionRepository } from '../../src/db/repositories/conditionRepository';
import { Specimen, ValuationRecord, ConditionAssessment } from '../../src/db/schema';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Badge } from '../../src/components/Badge';

export default function SpecimenDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [specimen, setSpecimen] = useState<Specimen | null>(null);
  const [activeSide, setActiveSide] = useState<'obverse' | 'reverse'>('obverse');
  const [activeTab, setActiveTab] = useState<'details' | 'condition' | 'valuation'>('details');
  const [valuationHistory, setValuationHistory] = useState<ValuationRecord[]>([]);
  const [conditionHistory, setConditionHistory] = useState<ConditionAssessment[]>([]);

  const formatPrice = useSettingsStore((s) => s.formatPrice);
  const toggleFavorite = useCollectionStore((s) => s.toggleFavorite);
  const deleteSpecimen = useCollectionStore((s) => s.deleteSpecimen);
  const duplicateSpecimen = useCollectionStore((s) => s.duplicateSpecimen);

  const loadData = () => {
    if (!id) return;
    const s = specimenRepository.getById(id);
    setSpecimen(s);
    if (s) {
      setValuationHistory(valuationRepository.getHistoryForSpecimen(s.id));
      setConditionHistory(conditionRepository.getHistoryForSpecimen(s.id));
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (!specimen) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Specimen not found.</Text>
        <Button title="Back to Collection" onPress={() => router.replace('/(tabs)/collection')} />
      </View>
    );
  }

  const ct = specimen.coin_type;
  const latestVal = specimen.latest_valuation;
  const latestCond = specimen.latest_condition;
  const displayImageUri =
    activeSide === 'obverse'
      ? specimen.obverse_image_path || specimen.reverse_image_path
      : specimen.reverse_image_path || specimen.obverse_image_path;

  const handleToggleFavorite = () => {
    toggleFavorite(specimen.id);
    loadData();
  };

  const handleDuplicate = () => {
    const copy = duplicateSpecimen(specimen.id);
    if (copy) {
      Alert.alert('Duplicated', 'Physical specimen record duplicated.', [
        { text: 'View Duplicate', onPress: () => router.push(`/specimen/${copy.id}`) },
        { text: 'OK' },
      ]);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Physical Specimen',
      `Delete "${specimen.custom_name || 'this specimen'}"? Associated Coin Type (${ct?.country} ${ct?.denomination}) will remain preserved in the numismatic catalog.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteSpecimen(specimen.id);
            router.replace('/(tabs)/collection');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Primary Coin Photography Hero */}
      <View style={styles.heroCard}>
        <View style={styles.photoContainer}>
          {displayImageUri ? (
            <Image source={{ uri: displayImageUri }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Ionicons name="disc-outline" size={80} color={Colors.dark.primaryDark} />
              <Text style={styles.heroPlaceholderText}>No Photograph Available</Text>
            </View>
          )}

          {/* Obverse/Reverse Switcher */}
          <View style={styles.sideSwitcher}>
            <TouchableOpacity
              style={[styles.sideSwitchBtn, activeSide === 'obverse' && styles.sideSwitchBtnActive]}
              onPress={() => setActiveSide('obverse')}
            >
              <Text style={[styles.sideSwitchText, activeSide === 'obverse' && styles.sideSwitchTextActive]}>
                OBVERSE
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sideSwitchBtn, activeSide === 'reverse' && styles.sideSwitchBtnActive]}
              onPress={() => setActiveSide('reverse')}
            >
              <Text style={[styles.sideSwitchText, activeSide === 'reverse' && styles.sideSwitchTextActive]}>
                REVERSE
              </Text>
            </TouchableOpacity>
          </View>

          {/* Favorite Heart Button */}
          <TouchableOpacity
            style={styles.heroFavBtn}
            onPress={handleToggleFavorite}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={specimen.is_favorite === 1 ? 'heart' : 'heart-outline'}
              size={22}
              color={specimen.is_favorite === 1 ? '#E74C3C' : '#FFFFFF'}
            />
          </TouchableOpacity>
        </View>

        {/* Coin Title & Overview Header */}
        <View style={styles.titleContainer}>
          <Text style={styles.specimenName}>
            {specimen.custom_name || `${ct?.country} ${ct?.denomination}`}
          </Text>
          <Text style={styles.specimenCountryEra}>
            {ct?.country} • {ct?.year_start ? (ct.year_start > 0 ? ct.year_start : `${Math.abs(ct.year_start)} BCE`) : 'Undated'} {ct?.ruler ? `• ${ct.ruler}` : ''}
          </Text>

          {/* Badges */}
          <View style={styles.badgeRow}>
            {specimen.user_grade && (
              <Badge label={`Grade: ${specimen.user_grade}`} variant="success" style={{ marginRight: 6 }} />
            )}
            {ct?.metal && (
              <Badge
                label={ct.metal}
                variant={
                  ct.metal.toLowerCase().includes('gold')
                    ? 'gold'
                    : ct.metal.toLowerCase().includes('silver')
                    ? 'silver'
                    : 'default'
                }
                style={{ marginRight: 6 }}
              />
            )}
            {specimen.grading_service && specimen.grading_service !== 'Raw' && (
              <Badge label={`Slab: ${specimen.grading_service}`} variant="warning" />
            )}
          </View>
        </View>
      </View>

      {/* Tabs Selector: Details | Condition | Valuation */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'details' && styles.tabBtnActive]}
          onPress={() => setActiveTab('details')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'details' && styles.tabBtnTextActive]}>
            Specimen Info
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'condition' && styles.tabBtnActive]}
          onPress={() => setActiveTab('condition')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'condition' && styles.tabBtnTextActive]}>
            Condition & Grade
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'valuation' && styles.tabBtnActive]}
          onPress={() => setActiveTab('valuation')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'valuation' && styles.tabBtnTextActive]}>
            Valuation
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB 1: SPECIMEN & NUMISMATIC DETAILS */}
      {activeTab === 'details' && (
        <View style={styles.tabContent}>
          {/* Classification Link */}
          <Card
            style={styles.classificationCard}
            variant="surface"
            onPress={() => ct?.id && router.push(`/coin-type/${ct.id}`)}
          >
            <View style={styles.classInfo}>
              <Text style={styles.classLabel}>NUMISMATIC CLASSIFICATION</Text>
              <Text style={styles.classTitle}>{ct?.coin_series || `${ct?.country} ${ct?.denomination}`}</Text>
              <Text style={styles.classSub}>
                Period: {ct?.historical_period || 'Historical Coinage'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.dark.primary} />
          </Card>

          {/* Physical Specifications */}
          <Card style={styles.infoCard} variant="surface">
            <Text style={styles.cardHeader}>PHYSICAL SPECIFICATIONS</Text>
            <View style={styles.specGrid}>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Mint</Text>
                <Text style={styles.specVal}>{ct?.mint || 'Unspecified'}</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Metal</Text>
                <Text style={styles.specVal}>{ct?.metal || 'Unknown'}</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Diameter</Text>
                <Text style={styles.specVal}>{ct?.diameter_mm ? `${ct.diameter_mm} mm` : '—'}</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Weight</Text>
                <Text style={styles.specVal}>{ct?.weight_g ? `${ct.weight_g} g` : '—'}</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Shape</Text>
                <Text style={styles.specVal}>{ct?.shape || 'Round'}</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Edge</Text>
                <Text style={styles.specVal}>{ct?.edge_type || 'Reeded'}</Text>
              </View>
            </View>

            {ct?.catalog_references && ct.catalog_references.length > 0 && (
              <View style={styles.catalogRefRow}>
                <Text style={styles.specLabel}>Catalog References</Text>
                <View style={styles.catalogChips}>
                  {ct.catalog_references.map((ref, idx) => (
                    <Badge key={idx} label={ref} variant="gold" size="sm" style={{ marginRight: 4 }} />
                  ))}
                </View>
              </View>
            )}
          </Card>

          {/* Acquisition Provenance */}
          <Card style={styles.infoCard} variant="surface">
            <Text style={styles.cardHeader}>ACQUISITION & PROVENANCE</Text>
            <View style={styles.specGrid}>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Acquisition Date</Text>
                <Text style={styles.specVal}>{specimen.acquisition_date || 'Not recorded'}</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Purchase Price</Text>
                <Text style={[styles.specVal, { color: Colors.dark.primaryLight }]}>
                  {specimen.acquisition_price ? formatPrice(specimen.acquisition_price) : '—'}
                </Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Source</Text>
                <Text style={styles.specVal}>{specimen.acquisition_source || 'Unknown'}</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Seller</Text>
                <Text style={styles.specVal}>{specimen.seller || 'Private'}</Text>
              </View>
            </View>

            {specimen.notes ? (
              <View style={styles.notesSection}>
                <Text style={styles.specLabel}>Collector Notes</Text>
                <Text style={styles.notesBody}>{specimen.notes}</Text>
              </View>
            ) : null}
          </Card>
        </View>
      )}

      {/* TAB 2: CONDITION & AI-ASSISTED GRADING */}
      {activeTab === 'condition' && (
        <View style={styles.tabContent}>
          {/* Important Numismatic Grading Notice */}
          <Card style={styles.noticeCard} variant="elevated">
            <Ionicons name="shield-outline" size={18} color={Colors.dark.primary} />
            <Text style={styles.noticeText}>
              Numismatic Disclaimer: AI-assisted condition estimation is an automated observational aid and does not constitute certified third-party encapsulation (PCGS / NGC).
            </Text>
          </Card>

          <Card style={styles.infoCard} variant="surface">
            <View style={styles.gradeHeaderRow}>
              <View>
                <Text style={styles.cardHeader}>ASSESSED CONDITION</Text>
                <Text style={styles.gradeTitle}>
                  {latestCond?.estimated_grade || specimen.user_grade || 'Unassessed'}
                </Text>
                <Text style={styles.gradeSub}>
                  System: {latestCond?.grading_system === 'sheldon_70' ? 'Sheldon Scale (1–70)' : 'Standard European'}
                </Text>
              </View>
              <View style={styles.gradeScoreCircle}>
                <Text style={styles.gradeNumText}>
                  {latestCond?.numerical_grade_min || 50}
                </Text>
                <Text style={styles.gradeScaleLabel}>/ 70</Text>
              </View>
            </View>

            {latestCond?.explanation && (
              <Text style={styles.gradeExplanation}>{latestCond.explanation}</Text>
            )}

            {/* Observations List */}
            {latestCond?.observations && latestCond.observations.length > 0 && (
              <View style={styles.obsList}>
                <Text style={[styles.specLabel, { marginBottom: 6 }]}>SURFACE OBSERVATIONS</Text>
                {latestCond.observations.map((obs, idx) => (
                  <View key={idx} style={styles.obsItem}>
                    <Badge label={obs.category.toUpperCase()} variant="default" size="sm" style={{ marginRight: 8 }} />
                    <Text style={styles.obsText}>{obs.observation}</Text>
                  </View>
                ))}
              </View>
            )}
          </Card>
        </View>
      )}

      {/* TAB 3: EXTENSIBLE VALUATION SUBSYSTEM */}
      {activeTab === 'valuation' && (
        <View style={styles.tabContent}>
          <Card style={styles.valSummaryCard} variant="surface">
            <Text style={styles.cardHeader}>ESTIMATED FAIR MARKET VALUE</Text>
            <Text style={styles.valAmount}>
              {latestVal
                ? `${formatPrice(latestVal.estimated_value_min)} – ${formatPrice(latestVal.estimated_value_max)}`
                : 'Not Yet Valued'}
            </Text>
            <Text style={styles.valDateText}>
              Valuation Date: {latestVal?.valuation_date || 'N/A'} • Confidence: {latestVal ? Math.round(latestVal.confidence * 100) : 0}%
            </Text>

            <View style={styles.valMetricsRow}>
              <View style={styles.valMetric}>
                <Text style={styles.valMetricLabel}>INTRINSIC MELT</Text>
                <Text style={styles.valMetricVal}>
                  {ct?.metal?.toLowerCase().includes('gold') || ct?.metal?.toLowerCase().includes('silver')
                    ? formatPrice(latestVal ? Math.round(latestVal.estimated_value_min * 0.4) : 0)
                    : 'Base Metal'}
                </Text>
              </View>
              <View style={styles.valDivider} />
              <View style={styles.valMetric}>
                <Text style={styles.valMetricLabel}>NUMISMATIC PREMIUM</Text>
                <Text style={[styles.valMetricVal, { color: Colors.dark.primaryLight }]}>
                  {latestVal ? formatPrice(Math.round(latestVal.estimated_value_min * 0.6)) : '—'}
                </Text>
              </View>
              <View style={styles.valDivider} />
              <View style={styles.valMetric}>
                <Text style={styles.valMetricLabel}>TYPE</Text>
                <Text style={styles.valMetricVal}>Retail Ask</Text>
              </View>
            </View>
          </Card>

          {/* Comparable Sales */}
          {latestVal?.comparable_sales && latestVal.comparable_sales.length > 0 && (
            <Card style={styles.infoCard} variant="surface">
              <Text style={styles.cardHeader}>VERIFIED AUCTION COMPARABLES</Text>
              {latestVal.comparable_sales.map((sale, idx) => (
                <View key={idx} style={styles.saleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.saleVenue}>{sale.venue}</Text>
                    <Text style={styles.saleMeta}>
                      Date: {sale.date} • Grade: {sale.grade}
                    </Text>
                  </View>
                  <Text style={styles.salePrice}>{formatPrice(sale.price)}</Text>
                </View>
              ))}
            </Card>
          )}

          <Card style={styles.noticeCard} variant="elevated">
            <Ionicons name="information-circle-outline" size={18} color={Colors.dark.textSecondary} />
            <Text style={styles.noticeText}>
              Valuations reflect aggregated historical hammer results and current bullion spot pricing. Dealer offers are typically 20-30% below retail guide prices.
            </Text>
          </Card>
        </View>
      )}

      {/* Action Buttons Row */}
      <View style={styles.bottomActions}>
        <Button
          title="Edit Details"
          variant="secondary"
          icon={<Ionicons name="create-outline" size={16} color={Colors.dark.text} />}
          onPress={() => router.push(`/specimen/edit/${specimen.id}`)}
          style={{ flex: 1, marginRight: Spacing.sm }}
        />
        <Button
          title="Duplicate"
          variant="outline"
          icon={<Ionicons name="copy-outline" size={16} color={Colors.dark.primary} />}
          onPress={handleDuplicate}
          style={{ flex: 1, marginRight: Spacing.sm }}
        />
        <Button
          title="Delete"
          variant="danger"
          icon={<Ionicons name="trash-outline" size={16} color="#FFFFFF" />}
          onPress={handleDelete}
        />
      </View>
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
    padding: Spacing.xl,
    backgroundColor: Colors.dark.background,
  },
  loadingText: {
    ...Typography.subtitle,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.md,
  },
  heroCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.dark.borderLight,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  photoContainer: {
    aspectRatio: 1.15,
    backgroundColor: '#0A0C0D',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  heroImage: {
    width: '90%',
    height: '90%',
    borderRadius: 200,
  },
  heroPlaceholder: {
    alignItems: 'center',
  },
  heroPlaceholderText: {
    ...Typography.caption,
    color: Colors.dark.textMuted,
    marginTop: Spacing.xs,
  },
  sideSwitcher: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    backgroundColor: '#000000B3',
    borderRadius: BorderRadius.full,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  sideSwitchBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  sideSwitchBtnActive: {
    backgroundColor: Colors.dark.primary,
  },
  sideSwitchText: {
    ...Typography.micro,
    color: Colors.dark.textSecondary,
    fontWeight: '700',
  },
  sideSwitchTextActive: {
    color: '#101214',
  },
  heroFavBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#00000088',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF22',
  },
  titleContainer: {
    padding: Spacing.md,
  },
  specimenName: {
    ...Typography.title,
    color: Colors.dark.text,
  },
  specimenCountryEra: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  tabBtnActive: {
    backgroundColor: Colors.dark.elevated,
  },
  tabBtnText: {
    ...Typography.caption,
    color: Colors.dark.textMuted,
    fontWeight: '600',
  },
  tabBtnTextActive: {
    color: Colors.dark.primaryLight,
    fontWeight: '700',
  },
  tabContent: {
    marginBottom: Spacing.md,
  },
  classificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderColor: Colors.dark.primaryDark,
  },
  classInfo: {
    flex: 1,
  },
  classLabel: {
    ...Typography.micro,
    color: Colors.dark.primary,
    letterSpacing: 0.8,
  },
  classTitle: {
    ...Typography.subtitle,
    color: Colors.dark.text,
    marginTop: 2,
  },
  classSub: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: 1,
  },
  infoCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardHeader: {
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
    ...Typography.body,
    color: Colors.dark.text,
    fontWeight: '600',
    marginTop: 2,
  },
  catalogRefRow: {
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 0.5,
    borderTopColor: Colors.dark.border,
  },
  catalogChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  notesSection: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 0.5,
    borderTopColor: Colors.dark.border,
  },
  notesBody: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm + 2,
    marginBottom: Spacing.md,
    gap: Spacing.xs + 2,
    borderLeftWidth: 3,
    borderLeftColor: Colors.dark.primary,
  },
  noticeText: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  gradeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gradeTitle: {
    ...Typography.header,
    color: Colors.dark.primaryLight,
  },
  gradeSub: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: 1,
  },
  gradeScoreCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.dark.elevated,
    borderWidth: 2,
    borderColor: Colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradeNumText: {
    ...Typography.title,
    color: Colors.dark.primaryLight,
    fontWeight: '700',
  },
  gradeScaleLabel: {
    ...Typography.micro,
    color: Colors.dark.textMuted,
  },
  gradeExplanation: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  obsList: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  obsItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
  },
  obsText: {
    ...Typography.caption,
    color: Colors.dark.text,
    flex: 1,
    lineHeight: 18,
  },
  valSummaryCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderColor: Colors.dark.primaryDark,
  },
  valAmount: {
    ...Typography.header,
    color: Colors.dark.primaryLight,
    fontSize: 24,
    fontWeight: '700',
    marginVertical: 4,
  },
  valDateText: {
    ...Typography.caption,
    color: Colors.dark.textMuted,
  },
  valMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  valMetric: {
    alignItems: 'center',
  },
  valMetricLabel: {
    ...Typography.micro,
    color: Colors.dark.textMuted,
  },
  valMetricVal: {
    ...Typography.caption,
    color: Colors.dark.text,
    fontWeight: '700',
    marginTop: 2,
  },
  valDivider: {
    width: 1,
    height: '100%',
    backgroundColor: Colors.dark.border,
  },
  saleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.dark.border,
  },
  saleVenue: {
    ...Typography.caption,
    color: Colors.dark.text,
    fontWeight: '600',
  },
  saleMeta: {
    ...Typography.micro,
    color: Colors.dark.textSecondary,
    marginTop: 1,
  },
  salePrice: {
    ...Typography.caption,
    color: Colors.dark.primaryLight,
    fontWeight: '700',
  },
  bottomActions: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
  },
});
