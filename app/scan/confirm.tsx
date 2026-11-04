import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../src/constants/theme';
import { useScanStore } from '../../src/stores/scanStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { useCollectionStore } from '../../src/stores/collectionStore';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Badge } from '../../src/components/Badge';

export default function ScanConfirmScreen() {
  const router = useRouter();
  const {
    obverseImageUri,
    reverseImageUri,
    identificationResult,
    editableAttributes,
    updateEditableAttribute,
    selectAlternative,
    confirmAndSaveSpecimen,
    saveAsUnidentifiedSpecimen,
    clearScan,
  } = useScanStore();

  const loadSpecimens = useCollectionStore((s) => s.loadSpecimens);
  const currencySymbol = useSettingsStore((s) => s.currencySymbol);

  const [userGrade, setUserGrade] = useState('AU50');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [collectorNotes, setCollectorNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!identificationResult || !obverseImageUri) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No identification result found.</Text>
        <Button title="Back to Scanner" onPress={() => router.replace('/(tabs)/scan')} />
      </View>
    );
  }

  const confidence = identificationResult.confidence;
  const overallConfidencePct = Math.round(confidence.overall * 100);

  const handleConfirm = async () => {
    setIsSaving(true);
    try {
      const priceNum = purchasePrice.trim() ? parseFloat(purchasePrice.trim()) : undefined;
      const specimen = await confirmAndSaveSpecimen(
        userGrade.trim() || undefined,
        priceNum,
        collectorNotes.trim() || undefined
      );

      if (specimen) {
        loadSpecimens();
        Alert.alert(
          'Specimen Preserved',
          `${editableAttributes.country} ${editableAttributes.denomination} has been preserved in your numismatic inventory.`,
          [
            {
              text: 'View Specimen',
              onPress: () => router.replace(`/specimen/${specimen.id}`),
            },
            {
              text: 'Go to Collection',
              onPress: () => router.replace('/(tabs)/collection'),
            },
          ]
        );
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save specimen.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Photo Previews */}
      <View style={styles.photoRow}>
        <View style={styles.photoCard}>
          <Image source={{ uri: obverseImageUri }} style={styles.previewImage} resizeMode="cover" />
          <View style={styles.sideBadge}><Text style={styles.sideBadgeText}>OBVERSE</Text></View>
        </View>

        {reverseImageUri ? (
          <View style={styles.photoCard}>
            <Image source={{ uri: reverseImageUri }} style={styles.previewImage} resizeMode="cover" />
            <View style={styles.sideBadge}><Text style={styles.sideBadgeText}>REVERSE</Text></View>
          </View>
        ) : (
          <View style={[styles.photoCard, styles.missingPhotoCard]}>
            <Ionicons name="image-outline" size={32} color={Colors.dark.textMuted} />
            <Text style={styles.missingPhotoText}>No Reverse</Text>
          </View>
        )}
      </View>

      {/* Confidence Header Card */}
      <Card style={styles.confidenceCard} variant="surface">
        <View style={styles.confidenceRow}>
          <View>
            <Text style={styles.attributionTitle}>AI Numismatic Attribution</Text>
            <Text style={styles.attributionSub}>
              Review model inference and edit any attributes before preserving.
            </Text>
          </View>
          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceScore}>{overallConfidencePct}%</Text>
            <Text style={styles.confidenceLabel}>CONFIDENCE</Text>
          </View>
        </View>

        {/* Detailed attribute confidence chips */}
        <View style={styles.confChipRow}>
          <Badge
            label={`Country: ${Math.round((confidence.country || 0.9) * 100)}%`}
            variant="default"
            size="sm"
          />
          <Badge
            label={`Denom: ${Math.round((confidence.denomination || 0.9) * 100)}%`}
            variant="default"
            size="sm"
          />
          <Badge
            label={`Year: ${Math.round((confidence.year || 0.8) * 100)}%`}
            variant="default"
            size="sm"
          />
          {confidence.mint !== undefined && (
            <Badge
              label={`Mint: ${Math.round(confidence.mint * 100)}%`}
              variant="default"
              size="sm"
            />
          )}
        </View>
      </Card>

      {/* Alternative Candidates if available */}
      {identificationResult.alternative_identifications.length > 0 && (
        <Card style={styles.altCard} variant="elevated">
          <Text style={styles.altHeader}>ALTERNATIVE CANDIDATES</Text>
          {identificationResult.alternative_identifications.map((alt, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.altItem}
              onPress={() => selectAlternative(idx)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.altTitle}>{alt.coin_type}</Text>
                <Text style={styles.altMeta}>{alt.distinguishing_features}</Text>
              </View>
              <Badge label="Select" variant="gold" size="sm" />
            </TouchableOpacity>
          ))}
        </Card>
      )}

      {/* Editable Attributes Form */}
      <Text style={styles.formSectionHeader}>VERIFIED NUMISMATIC ATTRIBUTES</Text>
      <Card style={styles.formCard} variant="surface">
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>COUNTRY OF ORIGIN</Text>
          <TextInput
            style={styles.input}
            value={editableAttributes.country || ''}
            onChangeText={(t) => updateEditableAttribute('country', t)}
          />
        </View>

        <View style={styles.rowInputs}>
          <View style={[styles.inputGroup, { flex: 2, marginRight: Spacing.sm }]}>
            <Text style={styles.inputLabel}>DENOMINATION</Text>
            <TextInput
              style={styles.input}
              value={editableAttributes.denomination || ''}
              onChangeText={(t) => updateEditableAttribute('denomination', t)}
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>MINT YEAR</Text>
            <TextInput
              style={styles.input}
              value={editableAttributes.year ? String(editableAttributes.year) : ''}
              onChangeText={(t) =>
                updateEditableAttribute('year', t ? parseInt(t, 10) : null)
              }
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>CLASSIFICATION / COIN TYPE</Text>
          <TextInput
            style={styles.input}
            value={editableAttributes.coin_type || ''}
            onChangeText={(t) => updateEditableAttribute('coin_type', t)}
          />
        </View>

        <View style={styles.rowInputs}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: Spacing.sm }]}>
            <Text style={styles.inputLabel}>METAL COMPOSITION</Text>
            <TextInput
              style={styles.input}
              value={editableAttributes.metal || ''}
              onChangeText={(t) => updateEditableAttribute('metal', t)}
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>MINT / MINT MARK</Text>
            <TextInput
              style={styles.input}
              value={editableAttributes.mint || ''}
              onChangeText={(t) => updateEditableAttribute('mint', t)}
              placeholder="e.g. Bombay, Phila, Rome"
              placeholderTextColor={Colors.dark.textMuted}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>RULER / ISSUING AUTHORITY</Text>
          <TextInput
            style={styles.input}
            value={editableAttributes.ruler || ''}
            onChangeText={(t) => updateEditableAttribute('ruler', t)}
            placeholder="e.g. King George VI, Republic, Augustus"
            placeholderTextColor={Colors.dark.textMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>CATALOG REFERENCES</Text>
          <TextInput
            style={styles.input}
            value={editableAttributes.catalog_references?.join(', ') || ''}
            onChangeText={(t) =>
              updateEditableAttribute(
                'catalog_references',
                t.split(',').map((x) => x.trim()).filter(Boolean)
              )
            }
            placeholder="e.g. KM# 559, RIC I 207"
            placeholderTextColor={Colors.dark.textMuted}
          />
        </View>
      </Card>

      {/* Collector Physical Specimen Details */}
      <Text style={styles.formSectionHeader}>SPECIMEN OWNERSHIP & CONDITION</Text>
      <Card style={styles.formCard} variant="surface">
        <View style={styles.rowInputs}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: Spacing.sm }]}>
            <Text style={styles.inputLabel}>COLLECTOR GRADE</Text>
            <TextInput
              style={styles.input}
              value={userGrade}
              onChangeText={setUserGrade}
              placeholder="e.g. VF30, XF45, AU55, MS63"
              placeholderTextColor={Colors.dark.textMuted}
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>PURCHASE PRICE ({currencySymbol})</Text>
            <TextInput
              style={styles.input}
              value={purchasePrice}
              onChangeText={setPurchasePrice}
              placeholder="0.00"
              placeholderTextColor={Colors.dark.textMuted}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>PERSONAL NOTES / PROVENANCE</Text>
          <TextInput
            style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
            value={collectorNotes}
            onChangeText={setCollectorNotes}
            placeholder="Provenance, seller, auction lot, or personal observations..."
            placeholderTextColor={Colors.dark.textMuted}
            multiline
          />
        </View>
      </Card>

      {/* Confirmation Actions */}
      <View style={styles.actionGroup}>
        <Button
          title={isSaving ? 'Preserving to Vault...' : 'Confirm & Add to Collection'}
          icon={<Ionicons name="checkmark-circle" size={18} color="#101214" />}
          onPress={handleConfirm}
          disabled={isSaving}
          loading={isSaving}
          size="lg"
          style={styles.confirmBtn}
        />

        <Button
          title="Save as Unidentified Specimen"
          variant="outline"
          onPress={async () => {
            const spec = await saveAsUnidentifiedSpecimen();
            if (spec) {
              loadSpecimens();
              router.replace(`/specimen/${spec.id}`);
            }
          }}
          disabled={isSaving}
          style={{ marginTop: Spacing.sm }}
        />

        <Button
          title="Discard & Rescan"
          variant="ghost"
          onPress={() => {
            clearScan();
            router.replace('/(tabs)/scan');
          }}
          disabled={isSaving}
          style={{ marginTop: Spacing.xs }}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.dark.background,
  },
  emptyText: {
    ...Typography.subtitle,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.md,
  },
  photoRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  photoCard: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.dark.borderLight,
    position: 'relative',
    backgroundColor: Colors.dark.surface,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  missingPhotoCard: {
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  missingPhotoText: {
    ...Typography.caption,
    color: Colors.dark.textMuted,
    marginTop: 4,
  },
  sideBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: '#000000B3',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    borderWidth: 0.5,
    borderColor: Colors.dark.primary,
  },
  sideBadgeText: {
    color: Colors.dark.primaryLight,
    fontSize: 9,
    fontWeight: '700',
  },
  confidenceCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  confidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attributionTitle: {
    ...Typography.subtitle,
    color: Colors.dark.primaryLight,
  },
  attributionSub: {
    ...Typography.micro,
    color: Colors.dark.textSecondary,
    marginTop: 2,
    maxWidth: 220,
  },
  confidenceBadge: {
    backgroundColor: Colors.dark.elevated,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.primaryDark,
  },
  confidenceScore: {
    ...Typography.title,
    color: Colors.dark.primaryLight,
    fontWeight: '700',
  },
  confidenceLabel: {
    ...Typography.micro,
    color: Colors.dark.textMuted,
    fontSize: 8,
  },
  confChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  altCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderColor: Colors.dark.primaryDark,
    borderWidth: 1,
  },
  altHeader: {
    ...Typography.micro,
    color: Colors.dark.primary,
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
  },
  altItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.dark.border,
  },
  altTitle: {
    ...Typography.caption,
    color: Colors.dark.text,
    fontWeight: '600',
  },
  altMeta: {
    ...Typography.micro,
    color: Colors.dark.textMuted,
    marginTop: 1,
  },
  formSectionHeader: {
    ...Typography.micro,
    color: Colors.dark.textSecondary,
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
    marginLeft: 4,
  },
  formCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  inputGroup: {
    marginBottom: Spacing.sm,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  inputLabel: {
    ...Typography.micro,
    color: Colors.dark.textMuted,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  input: {
    backgroundColor: Colors.dark.elevated,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    color: Colors.dark.text,
    fontSize: 14,
  },
  actionGroup: {
    marginTop: Spacing.sm,
  },
  confirmBtn: {
    height: 52,
  },
});
