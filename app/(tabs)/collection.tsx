import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../src/constants/theme';
import { useCollectionStore } from '../../src/stores/collectionStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { SearchBar } from '../../src/components/SearchBar';
import { Card } from '../../src/components/Card';
import { CoinAvatar } from '../../src/components/CoinAvatar';
import { Badge } from '../../src/components/Badge';
import { Button } from '../../src/components/Button';
import { Specimen } from '../../src/db/schema';

const GridCoinCard = memo(function GridCoinCard({
  item,
  isSelected,
  isMultiSelectMode,
  formatPrice,
  onPress,
  onLongPress,
  onToggleFavorite,
}: {
  item: Specimen;
  isSelected: boolean;
  isMultiSelectMode: boolean;
  formatPrice: (amount: number | null | undefined) => string;
  onPress: () => void;
  onLongPress: () => void;
  onToggleFavorite: () => void;
}) {
  const ct = item.coin_type;
  const val = item.latest_valuation;

  return (
    <TouchableOpacity
      style={[
        styles.gridCard,
        isSelected && styles.selectedBorder,
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
    >
      {isMultiSelectMode && (
        <View style={styles.checkboxContainer}>
          <Ionicons
            name={isSelected ? 'checkbox' : 'square-outline'}
            size={20}
            color={isSelected ? Colors.dark.primary : Colors.dark.textMuted}
          />
        </View>
      )}

      <TouchableOpacity
        style={styles.favIconWrapper}
        onPress={onToggleFavorite}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name={item.is_favorite === 1 ? 'heart' : 'heart-outline'}
          size={18}
          color={item.is_favorite === 1 ? '#E74C3C' : Colors.dark.textMuted}
        />
      </TouchableOpacity>

      <CoinAvatar
        obverseUri={item.obverse_image_path}
        reverseUri={item.reverse_image_path}
        metal={ct?.metal}
        denomination={ct?.denomination}
        year={ct?.year_start}
        size={76}
        style={styles.avatarMargin}
      />

      <Text style={styles.gridDenom} numberOfLines={1}>
        {ct?.denomination || 'Coin Specimen'}
      </Text>
      <Text style={styles.gridCountry} numberOfLines={1}>
        {ct?.country || 'Unknown'} {ct?.year_start ? `• ${ct.year_start > 0 ? ct.year_start : `${Math.abs(ct.year_start)} BCE`}` : ''}
      </Text>

      <View style={styles.gridBadgeRow}>
        {item.user_grade ? (
          <Badge label={item.user_grade} variant="success" size="sm" />
        ) : null}
        {ct?.metal ? (
          <Badge
            label={ct.metal.split(' ')[0]}
            variant={
              ct.metal.toLowerCase().includes('gold')
                ? 'gold'
                : ct.metal.toLowerCase().includes('silver')
                ? 'silver'
                : 'default'
            }
            size="sm"
          />
        ) : null}
      </View>

      <Text style={styles.gridValuation}>
        {val
          ? formatPrice(val.estimated_value_max)
          : item.acquisition_price
          ? formatPrice(item.acquisition_price)
          : '—'}
      </Text>
    </TouchableOpacity>
  );
});

const ListCoinCard = memo(function ListCoinCard({
  item,
  isSelected,
  isMultiSelectMode,
  formatPrice,
  onPress,
  onLongPress,
  onToggleFavorite,
}: {
  item: Specimen;
  isSelected: boolean;
  isMultiSelectMode: boolean;
  formatPrice: (amount: number | null | undefined) => string;
  onPress: () => void;
  onLongPress: () => void;
  onToggleFavorite: () => void;
}) {
  const ct = item.coin_type;
  const val = item.latest_valuation;

  return (
    <TouchableOpacity
      style={[
        styles.listCard,
        isSelected && styles.selectedBorder,
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
    >
      {isMultiSelectMode && (
        <View style={{ marginRight: 10 }}>
          <Ionicons
            name={isSelected ? 'checkbox' : 'square-outline'}
            size={22}
            color={isSelected ? Colors.dark.primary : Colors.dark.textMuted}
          />
        </View>
      )}

      <CoinAvatar
        obverseUri={item.obverse_image_path}
        reverseUri={item.reverse_image_path}
        metal={ct?.metal}
        denomination={ct?.denomination}
        year={ct?.year_start}
        size={56}
      />

      <View style={styles.listDetails}>
        <View style={styles.listHeaderRow}>
          <Text style={styles.listTitle} numberOfLines={1}>
            {item.custom_name || `${ct?.country} ${ct?.denomination}`}
          </Text>
          <TouchableOpacity
            onPress={onToggleFavorite}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={item.is_favorite === 1 ? 'heart' : 'heart-outline'}
              size={18}
              color={item.is_favorite === 1 ? '#E74C3C' : Colors.dark.textMuted}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.listSubtitle}>
          {ct?.country} • {ct?.year_start ? (ct.year_start > 0 ? ct.year_start : `${Math.abs(ct.year_start)} BCE`) : 'Undated'} {ct?.mint ? `• Mint: ${ct.mint}` : ''}
        </Text>

        <View style={styles.listBadges}>
          {item.user_grade ? (
            <Badge label={item.user_grade} variant="success" size="sm" style={{ marginRight: 6 }} />
          ) : null}
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
          {item.grading_service && item.grading_service !== 'Raw' ? (
            <Badge label={item.grading_service} variant="warning" size="sm" />
          ) : null}
        </View>
      </View>

      <View style={styles.listPriceCol}>
        <Text style={styles.listPriceText}>
          {val
            ? formatPrice(val.estimated_value_max)
            : item.acquisition_price
            ? formatPrice(item.acquisition_price)
            : '—'}
        </Text>
        <Text style={styles.listPriceLabel}>
          {val ? 'EST. VALUE' : 'COST'}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

export default function CollectionScreen() {
  const router = useRouter();
  const {
    specimens,
    tags,
    loadSpecimens,
    loadTags,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    isMultiSelectMode,
    selectedSpecimenIds,
    toggleMultiSelectMode,
    toggleSelectSpecimenId,
    selectAllSpecimens,
    clearSelectedSpecimens,
    deleteSelectedSpecimens,
    toggleFavorite,
    isFavoriteFilter,
    selectedMetal,
    selectedCountry,
    sortBy,
    sortOrder,
    setFilters,
    resetFilters,
  } = useCollectionStore();

  const formatPrice = useSettingsStore((s) => s.formatPrice);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  useEffect(() => {
    loadSpecimens();
    loadTags();
  }, []);

  const handleBulkDelete = () => {
    Alert.alert(
      'Delete Selected Specimens',
      `Are you sure you want to delete ${selectedSpecimenIds.length} physical specimen(s)? Associated coin types will be preserved in the catalog.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const count = deleteSelectedSpecimens();
            Alert.alert('Deleted', `Removed ${count} specimen(s) from collection.`);
          },
        },
      ]
    );
  };

  const renderGridItem = useCallback(
    ({ item }: { item: Specimen }) => (
      <GridCoinCard
        item={item}
        isSelected={selectedSpecimenIds.includes(item.id)}
        isMultiSelectMode={isMultiSelectMode}
        formatPrice={formatPrice}
        onPress={() => {
          if (isMultiSelectMode) {
            toggleSelectSpecimenId(item.id);
          } else {
            router.push(`/specimen/${item.id}`);
          }
        }}
        onLongPress={() => {
          if (!isMultiSelectMode) {
            toggleMultiSelectMode(true);
            toggleSelectSpecimenId(item.id);
          }
        }}
        onToggleFavorite={() => toggleFavorite(item.id)}
      />
    ),
    [
      selectedSpecimenIds,
      isMultiSelectMode,
      formatPrice,
      toggleSelectSpecimenId,
      toggleMultiSelectMode,
      toggleFavorite,
      router,
    ]
  );

  const renderListItem = useCallback(
    ({ item }: { item: Specimen }) => (
      <ListCoinCard
        item={item}
        isSelected={selectedSpecimenIds.includes(item.id)}
        isMultiSelectMode={isMultiSelectMode}
        formatPrice={formatPrice}
        onPress={() => {
          if (isMultiSelectMode) {
            toggleSelectSpecimenId(item.id);
          } else {
            router.push(`/specimen/${item.id}`);
          }
        }}
        onLongPress={() => {
          if (!isMultiSelectMode) {
            toggleMultiSelectMode(true);
            toggleSelectSpecimenId(item.id);
          }
        }}
        onToggleFavorite={() => toggleFavorite(item.id)}
      />
    ),
    [
      selectedSpecimenIds,
      isMultiSelectMode,
      formatPrice,
      toggleSelectSpecimenId,
      toggleMultiSelectMode,
      toggleFavorite,
      router,
    ]
  );

  return (
    <View style={styles.container}>
      {/* Search and View Controls */}
      <View style={styles.controlsBar}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search country, ruler, mint, metal..."
          style={{ flex: 1 }}
        />
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons
            name="filter"
            size={18}
            color={
              selectedCountry || selectedMetal || isFavoriteFilter
                ? Colors.dark.primary
                : Colors.dark.textSecondary
            }
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
        >
          <Ionicons
            name={viewMode === 'grid' ? 'list' : 'grid-outline'}
            size={18}
            color={Colors.dark.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Multi-Selection Control Banner */}
      {isMultiSelectMode ? (
        <View style={styles.multiSelectBanner}>
          <Text style={styles.selectedCountText}>
            {selectedSpecimenIds.length} Selected
          </Text>
          <View style={styles.multiSelectActions}>
            <TouchableOpacity onPress={selectAllSpecimens} style={styles.bannerBtn}>
              <Text style={styles.bannerBtnText}>Select All</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={clearSelectedSpecimens} style={styles.bannerBtn}>
              <Text style={styles.bannerBtnText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleBulkDelete}
              style={[styles.bannerBtn, { backgroundColor: Colors.dark.dangerMuted }]}
              disabled={selectedSpecimenIds.length === 0}
            >
              <Ionicons name="trash-outline" size={16} color={Colors.dark.danger} />
              <Text style={[styles.bannerBtnText, { color: Colors.dark.danger, marginLeft: 4 }]}>
                Delete
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => toggleMultiSelectMode(false)}
              style={styles.bannerBtn}
            >
              <Text style={styles.bannerBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* Active Filter Chips */}
      {(selectedCountry || selectedMetal || isFavoriteFilter) && (
        <View style={styles.activeChipsRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {selectedCountry && (
              <Badge
                label={`Country: ${selectedCountry}`}
                style={styles.chip}
                variant="gold"
              />
            )}
            {selectedMetal && (
              <Badge
                label={`Metal: ${selectedMetal}`}
                style={styles.chip}
                variant="silver"
              />
            )}
            {isFavoriteFilter && (
              <Badge
                label="Favorites Only"
                style={styles.chip}
                variant="warning"
              />
            )}
            <TouchableOpacity onPress={resetFilters} style={styles.clearChip}>
              <Text style={styles.clearChipText}>Clear All</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Main Specimen List / Grid */}
      <FlatList
        data={specimens}
        key={viewMode}
        numColumns={viewMode === 'grid' ? 2 : 1}
        renderItem={viewMode === 'grid' ? renderGridItem : renderListItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onRefresh={loadSpecimens}
        refreshing={false}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews={true}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="albums-outline" size={56} color={Colors.dark.textMuted} />
            <Text style={styles.emptyTitle}>No Specimens Found</Text>
            <Text style={styles.emptySub}>
              {searchQuery || selectedCountry || selectedMetal
                ? 'Try adjusting your search criteria or clearing filters.'
                : 'Your collection is empty. Scan physical coins or add them manually to build your inventory.'}
            </Text>
            <View style={styles.emptyButtonRow}>
              <Button
                title="Scan Coin"
                icon={<Ionicons name="scan" size={18} color="#101214" />}
                onPress={() => router.push('/(tabs)/scan')}
                style={{ marginRight: Spacing.sm }}
              />
              <Button
                title="Add Manually"
                variant="outline"
                onPress={() => router.push('/specimen/new')}
              />
            </View>
          </View>
        }
      />

      {/* Filter and Sort Modal */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter & Sort Collection</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.dark.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Sort By Section */}
              <Text style={styles.modalSectionTitle}>SORT ORDER</Text>
              <View style={styles.filterOptionsGrid}>
                {[
                  { label: 'Recently Added', field: 'created_at', order: 'desc' },
                  { label: 'Oldest Added', field: 'created_at', order: 'asc' },
                  { label: 'Year (Newest First)', field: 'year', order: 'desc' },
                  { label: 'Year (Oldest First)', field: 'year', order: 'asc' },
                  { label: 'Estimated Value', field: 'value', order: 'desc' },
                  { label: 'Country (A-Z)', field: 'country', order: 'asc' },
                  { label: 'Denomination', field: 'denomination', order: 'asc' },
                ].map((s, idx) => {
                  const isActive = sortBy === s.field && sortOrder === s.order;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.filterChip, isActive && styles.filterChipActive]}
                      onPress={() => {
                        setFilters({ sortBy: s.field as any, sortOrder: s.order as any });
                      }}
                    >
                      <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Favorites Filter */}
              <Text style={styles.modalSectionTitle}>FAVORITES</Text>
              <TouchableOpacity
                style={[styles.filterChip, isFavoriteFilter && styles.filterChipActive]}
                onPress={() => setFilters({ isFavorite: !isFavoriteFilter })}
              >
                <Ionicons
                  name={isFavoriteFilter ? 'heart' : 'heart-outline'}
                  size={16}
                  color={isFavoriteFilter ? '#FFFFFF' : Colors.dark.textSecondary}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.filterChipText, isFavoriteFilter && styles.filterChipTextActive]}>
                  Favorites Only
                </Text>
              </TouchableOpacity>

              {/* Metal Filter */}
              <Text style={styles.modalSectionTitle}>METAL COMPOSITION</Text>
              <View style={styles.filterOptionsGrid}>
                {['Gold', 'Silver', 'Bronze', 'Copper', 'Nickel'].map((metal) => {
                  const isActive = selectedMetal === metal;
                  return (
                    <TouchableOpacity
                      key={metal}
                      style={[styles.filterChip, isActive && styles.filterChipActive]}
                      onPress={() => {
                        setFilters({ metal: isActive ? undefined : metal });
                      }}
                    >
                      <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                        {metal}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Reset Filters"
                variant="outline"
                onPress={() => {
                  resetFilters();
                  setFilterModalVisible(false);
                }}
                style={{ flex: 1, marginRight: Spacing.sm }}
              />
              <Button
                title="Apply"
                onPress={() => setFilterModalVisible(false)}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  multiSelectBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.primaryDark,
  },
  selectedCountText: {
    ...Typography.caption,
    color: Colors.dark.primaryLight,
    fontWeight: '700',
  },
  multiSelectActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bannerBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.dark.elevated,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerBtnText: {
    ...Typography.micro,
    color: Colors.dark.text,
  },
  activeChipsRow: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  chip: {
    marginRight: 8,
  },
  clearChip: {
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  clearChipText: {
    ...Typography.micro,
    color: Colors.dark.primary,
    fontWeight: '700',
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  gridCard: {
    flex: 1,
    margin: Spacing.xs,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: Spacing.sm,
    alignItems: 'center',
    position: 'relative',
  },
  selectedBorder: {
    borderColor: Colors.dark.primary,
    backgroundColor: '#C5A15A15',
  },
  checkboxContainer: {
    position: 'absolute',
    top: 6,
    left: 6,
    zIndex: 10,
  },
  favIconWrapper: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 10,
  },
  avatarMargin: {
    marginVertical: Spacing.xs,
  },
  gridDenom: {
    ...Typography.caption,
    color: Colors.dark.text,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  gridCountry: {
    ...Typography.micro,
    color: Colors.dark.textSecondary,
    marginTop: 1,
    textAlign: 'center',
  },
  gridBadgeRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
    marginBottom: 4,
  },
  gridValuation: {
    ...Typography.caption,
    color: Colors.dark.primaryLight,
    fontWeight: '700',
    marginTop: 2,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: Spacing.sm + 2,
    marginBottom: Spacing.sm,
  },
  listDetails: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listTitle: {
    ...Typography.subtitle,
    color: Colors.dark.text,
    fontSize: 15,
    flex: 1,
    marginRight: 6,
  },
  listSubtitle: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  listBadges: {
    flexDirection: 'row',
    marginTop: 6,
  },
  listPriceCol: {
    alignItems: 'flex-end',
    marginLeft: Spacing.sm,
  },
  listPriceText: {
    ...Typography.subtitle,
    color: Colors.dark.primaryLight,
    fontWeight: '700',
  },
  listPriceLabel: {
    ...Typography.micro,
    color: Colors.dark.textMuted,
    marginTop: 1,
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
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  emptyButtonRow: {
    flexDirection: 'row',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000099',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.dark.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.dark.borderLight,
    maxHeight: '80%',
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    ...Typography.title,
    color: Colors.dark.primaryLight,
  },
  modalBody: {
    marginBottom: Spacing.md,
  },
  modalSectionTitle: {
    ...Typography.micro,
    color: Colors.dark.textMuted,
    letterSpacing: 0.8,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  filterOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.dark.elevated,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: Colors.dark.primaryDark,
    borderColor: Colors.dark.primary,
  },
  filterChipText: {
    ...Typography.caption,
    color: Colors.dark.text,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
});
