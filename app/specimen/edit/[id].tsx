import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius } from '../../../src/constants/theme';
import { useCollectionStore } from '../../../src/stores/collectionStore';
import { useSettingsStore } from '../../../src/stores/settingsStore';
import { Card } from '../../../src/components/Card';
import { Button } from '../../../src/components/Button';
import { Specimen } from '../../../src/db/schema';

export default function EditSpecimenScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const getSpecimenById = useCollectionStore((s) => s.getSpecimenById);
  const updateSpecimenDetails = useCollectionStore((s) => s.updateSpecimenDetails);
  const currencySymbol = useSettingsStore((s) => s.currencySymbol);

  const [specimen, setSpecimen] = useState<Specimen | null>(null);
  const [customName, setCustomName] = useState('');
  const [grade, setGrade] = useState('');
  const [service, setService] = useState('');
  const [certNum, setCertNum] = useState('');
  const [price, setPrice] = useState('');
  const [source, setSource] = useState('');
  const [seller, setSeller] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    const s = getSpecimenById(id);
    if (s) {
      setSpecimen(s);
      setCustomName(s.custom_name || '');
      setGrade(s.user_grade || '');
      setService(s.grading_service || 'Raw');
      setCertNum(s.certification_number || '');
      setPrice(s.acquisition_price ? String(s.acquisition_price) : '');
      setSource(s.acquisition_source || '');
      setSeller(s.seller || '');
      setNotes(s.notes || '');
    }
  }, [id]);

  if (!specimen) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Specimen not found.</Text>
      </View>
    );
  }

  const handleSave = () => {
    setIsSaving(true);
    try {
      const priceNum = price.trim() ? parseFloat(price.trim()) : null;

      updateSpecimenDetails(specimen.id, {
        custom_name: customName.trim() || null,
        user_grade: grade.trim() || null,
        grading_service: service.trim() || 'Raw',
        certification_number: certNum.trim() || null,
        acquisition_price: priceNum,
        acquisition_source: source.trim() || null,
        seller: seller.trim() || null,
        notes: notes.trim() || null,
      });

      Alert.alert('Updated', 'Specimen record updated successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update specimen.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.formCard} variant="surface">
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>CUSTOM SPECIMEN NAME</Text>
          <TextInput
            style={styles.input}
            value={customName}
            onChangeText={setCustomName}
            placeholder="Specimen title"
            placeholderTextColor={Colors.dark.textMuted}
          />
        </View>

        <View style={styles.rowInputs}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: Spacing.sm }]}>
            <Text style={styles.inputLabel}>USER GRADE</Text>
            <TextInput
              style={styles.input}
              value={grade}
              onChangeText={setGrade}
              placeholder="e.g. AU55, MS63"
              placeholderTextColor={Colors.dark.textMuted}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>GRADING SERVICE</Text>
            <TextInput
              style={styles.input}
              value={service}
              onChangeText={setService}
              placeholder="Raw, PCGS, NGC"
              placeholderTextColor={Colors.dark.textMuted}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>CERTIFICATION SLAB NUMBER</Text>
          <TextInput
            style={styles.input}
            value={certNum}
            onChangeText={setCertNum}
            placeholder="e.g. 1234567-001"
            placeholderTextColor={Colors.dark.textMuted}
          />
        </View>

        <View style={styles.rowInputs}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: Spacing.sm }]}>
            <Text style={styles.inputLabel}>PURCHASE PRICE ({currencySymbol})</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="0.00"
              placeholderTextColor={Colors.dark.textMuted}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>ACQUISITION SOURCE</Text>
            <TextInput
              style={styles.input}
              value={source}
              onChangeText={setSource}
              placeholder="e.g. Auction, Dealer"
              placeholderTextColor={Colors.dark.textMuted}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>SELLER / AUCTION HOUSE</Text>
          <TextInput
            style={styles.input}
            value={seller}
            onChangeText={setSeller}
            placeholder="e.g. Heritage, Stacks Bowers"
            placeholderTextColor={Colors.dark.textMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>NOTES & PROVENANCE</Text>
          <TextInput
            style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Notes..."
            placeholderTextColor={Colors.dark.textMuted}
            multiline
          />
        </View>
      </Card>

      <Button
        title={isSaving ? 'Saving Changes...' : 'Save Changes'}
        onPress={handleSave}
        disabled={isSaving}
        loading={isSaving}
        size="lg"
      />
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
});
