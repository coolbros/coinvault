import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../src/constants/theme';
import { coinTypeRepository } from '../../src/db/repositories/coinTypeRepository';
import { CoinType } from '../../src/db/schema';
import { SearchBar } from '../../src/components/SearchBar';
import { Card } from '../../src/components/Card';
import { Badge } from '../../src/components/Badge';
import { CoinAvatar } from '../../src/components/CoinAvatar';

export default function DiscoverScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [selectedMetal, setSelectedMetal] = useState<string | null>(null);
  const [coinTypes, setCoinTypes] = useState<CoinType[]>([]);

  const periods = [
    'All Eras',
    'Classical Antiquity',
    'Roman Empire',
    'Mughal Golden Age',
    'Victorian Era',
    'Gilded Age / Modern',
    'Colonial',
  ];

  const metals = ['All Metals', 'Gold', 'Silver', 'Nickel', 'Copper'];

  const loadReferenceCatalog = () => {
    let list: CoinType[] = [];
    if (searchQuery.trim()) {
      list = coinTypeRepository.search(searchQuery.trim());
    } else {
      list = coinTypeRepository.listAll({ isReferenceOnly: true });
    }

    if (selectedPeriod && selectedPeriod !== 'All Eras') {
      list = list.filter((c) =>
        (c.historical_period || '').toLowerCase().includes(selectedPeriod.toLowerCase())
      );
    }

    if (selectedMetal && selectedMetal !== 'All Metals') {
      list = list.filter((c) =>
        (c.metal || '').toLowerCase().includes(selectedMetal.toLowerCase())
      );
    }

    setCoinTypes(list);
  };

  useEffect(() => {
    loadReferenceCatalog();
  }, [searchQuery, selectedPeriod, selectedMetal]);

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Explore Greek, Roman, British, Indian, US coinage..."
        />
      </View>

      {/* Filter Horizontal Ribbons */}
      <View style={styles.filtersRibbon}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ribbonContent}>
          {periods.map((p) => {
            const isSelected = (selectedPeriod === null && p === 'All Eras') || selectedPeriod === p;
            return (
              <TouchableOpacity
                key={p}
                style={[styles.filterPill, isSelected && styles.filterPillActive]}
                onPress={() => setSelectedPeriod(p === 'All Eras' ? null : p)}
              >
                <Text style={[styles.filterPillText, isSelected && styles.filterPillTextActive]}>
                  {p}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={[styles.filtersRibbon, { paddingTop: 0 }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ribbonContent}>
          {metals.map((m) => {
            const isSelected = (selectedMetal === null && m === 'All Metals') || selectedMetal === m;
            return (
              <TouchableOpacity
                key={m}
                style={[styles.filterPill, isSelected && styles.filterPillActive]}
                onPress={() => setSelectedMetal(m === 'All Metals' ? null : m)}
              >
                <Text style={[styles.filterPillText, isSelected && styles.filterPillTextActive]}>
                  {m}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Catalog List */}
      <FlatList
        data={coinTypes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.catalogList}
        renderItem={({ item }) => (
          <Card
            style={styles.catalogCard}
            variant="surface"
            onPress={() => router.push(`/coin-type/${item.id}`)}
          >
            <CoinAvatar
              metal={item.metal}
              denomination={item.denomination}
              year={item.year_start}
              size={60}
            />

            <View style={styles.catalogDetails}>
              <View style={styles.catalogTitleRow}>
                <Text style={styles.catalogDenom} numberOfLines={1}>
                  {item.denomination}
                </Text>
                <Badge
                  label={item.metal || 'Coin'}
                  variant={
                    item.metal?.toLowerCase().includes('gold')
                      ? 'gold'
                      : item.metal?.toLowerCase().includes('silver')
                      ? 'silver'
                      : 'default'
                  }
                  size="sm"
                />
              </View>

              <Text style={styles.catalogCountryEra}>
                {item.country} • {item.year_start ? (item.year_start > 0 ? item.year_start : `${Math.abs(item.year_start)} BCE`) : 'Undated'}
              </Text>

              <Text style={styles.catalogSeries} numberOfLines={1}>
                {item.coin_series || item.historical_period || 'World Numismatic Reference'}
              </Text>

              {item.catalog_references && item.catalog_references.length > 0 && (
                <View style={styles.refRow}>
                  {item.catalog_references.slice(0, 2).map((ref, idx) => (
                    <Text key={idx} style={styles.catalogRefTag}>
                      {ref}
                    </Text>
                  ))}
                </View>
              )}
            </View>

            <Ionicons name="chevron-forward" size={18} color={Colors.dark.primary} />
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={48} color={Colors.dark.textMuted} />
            <Text style={styles.emptyTitle}>No Coin Types Found</Text>
            <Text style={styles.emptySub}>
              Try searching with a different country, era, or metal composition.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  searchHeader: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  filtersRibbon: {
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  ribbonContent: {
    paddingHorizontal: Spacing.md,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  filterPillActive: {
    backgroundColor: Colors.dark.primaryDark,
    borderColor: Colors.dark.primary,
  },
  filterPillText: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  catalogList: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  catalogCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm + 2,
    marginBottom: Spacing.sm,
  },
  catalogDetails: {
    flex: 1,
    marginLeft: Spacing.md,
    marginRight: Spacing.xs,
  },
  catalogTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catalogDenom: {
    ...Typography.subtitle,
    color: Colors.dark.text,
    fontWeight: '700',
    flex: 1,
    marginRight: 6,
  },
  catalogCountryEra: {
    ...Typography.caption,
    color: Colors.dark.primaryLight,
    marginTop: 2,
  },
  catalogSeries: {
    ...Typography.micro,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  refRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  catalogRefTag: {
    ...Typography.micro,
    color: Colors.dark.textMuted,
    backgroundColor: Colors.dark.elevated,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyTitle: {
    ...Typography.title,
    color: Colors.dark.text,
    marginTop: Spacing.md,
  },
  emptySub: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});
