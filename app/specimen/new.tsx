import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../src/constants/theme';
import { useCollectionStore } from '../../src/stores/collectionStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { coinTypeRepository } from '../../src/db/repositories/coinTypeRepository';
import { specimenRepository } from '../../src/db/repositories/specimenRepository';
import { valuationRepository } from '../../src/db/repositories/valuationRepository';
import { conditionRepository } from '../../src/db/repositories/conditionRepository';
import { imageStorage } from '../../src/services/storage/imageStorage';
import { valuationEngine } from '../../src/services/valuation/valuationEngine';
import { coinGradingService } from '../../src/services/ai/gradingProvider';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';

export default function NewSpecimenScreen() {
  const router = useRouter();
  const loadSpecimens = useCollectionStore((s) => s.loadSpecimens);
  const currency = useSettingsStore((s) => s.currency);
  const currencySymbol = useSettingsStore((s) => s.currencySymbol);

  const [country, setCountry] = useState('');
  const [denomination, setDenomination] = useState('');
  const [year, setYear] = useState('');
  const [metal, setMetal] = useState('Silver');
  const [mint, setMint] = useState('');
  const [ruler, setRuler] = useState('');
  const [series, setSeries] = useState('');
  const [grade, setGrade] = useState('AU50');
  const [price, setPrice] = useState('');
  const [source, setSource] = useState('Dealer');
  const [notes, setNotes] = useState('');

  const [obverseUri, setObverseUri] = useState<string | null>(null);
  const [reverseUri, setReverseUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handlePickPhoto = async (side: 'obverse' | 'reverse') => {
    Alert.alert('Coin Photograph', `Choose source for ${side}:`, [
      {
        text: 'Take Photo',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') return;
          const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.9 });
          if (!res.canceled && res.assets?.[0]?.uri) {
            side === 'obverse' ? setObverseUri(res.assets[0].uri) : setReverseUri(res.assets[0].uri);
          }
        },
      },
      {
        text: 'Choose from Gallery',
        onPress: async () => {
          const res = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.9 });
          if (!res.canceled && res.assets?.[0]?.uri) {
            side === 'obverse' ? setObverseUri(res.assets[0].uri) : setReverseUri(res.assets[0].uri);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    if (!country.trim() || !denomination.trim()) {
      Alert.alert('Required Fields', 'Please enter at least the Country and Denomination.');
      return;
    }

    setIsSaving(true);
    try {
      const yearNum = year.trim() ? parseInt(year.trim(), 10) : null;
      const priceNum = price.trim() ? parseFloat(price.trim()) : null;

      // 1. Persist photos
      let persistedObv: string | null = null;
      let persistedRev: string | null = null;
      if (obverseUri) persistedObv = await imageStorage.persistImage(obverseUri, 'obverse');
      if (reverseUri) persistedRev = await imageStorage.persistImage(reverseUri, 'reverse');

      // 2. Find or create CoinType
      const coinType = coinTypeRepository.findOrCreate({
        country: country.trim(),
        denomination: denomination.trim(),
        year_start: yearNum,
        year_end: yearNum,
        metal: metal.trim() || null,
        mint: mint.trim() || null,
        ruler: ruler.trim() || null,
        coin_series: series.trim() || null,
        is_reference_type: 0,
      });

      // 3. Create Specimen
      const specimen = specimenRepository.create({
        coin_type_id: coinType.id,
        custom_name: `${coinType.country} ${coinType.denomination} (${yearNum || 'Undated'})`,
        obverse_image_path: persistedObv,
        reverse_image_path: persistedRev,
        acquisition_date: new Date().toISOString().split('T')[0],
        acquisition_price: priceNum,
        acquisition_currency: currency,
        acquisition_source: source.trim() || 'Manual Entry',
        user_grade: grade.trim() || 'VF20',
        notes: notes.trim() || null,
      });

      // 4. Run automated condition & valuation
      const valRes = await valuationEngine.estimate({
        coinType: coinType.denomination,
        country: coinType.country,
        denomination: coinType.denomination,
        year: yearNum,
        metal: coinType.metal,
        grade: specimen.user_grade,
        currency,
      });

      valuationRepository.create({
        specimen_id: specimen.id,
        estimated_value_min: valRes.estimatedValueMin,
        estimated_value_max: valRes.estimatedValueMax,
        currency: valRes.currency,
        valuation_type: valRes.valuationType,
        source: valRes.source,
        comparable_sales: valRes.comparableSales,
        confidence: valRes.confidence,
        valuation_date: valRes.valuationDate,
        notes: valRes.caveats[0],
      });

      const condRes = await coinGradingService.assess({
        obverseImageUri: persistedObv || '',
        reverseImageUri: persistedRev || '',
        coinType: coinType.denomination,
        year: yearNum,
        metal: coinType.metal,
      });

      conditionRepository.create({
        specimen_id: specimen.id,
        grading_system: condRes.gradingSystem,
        estimated_grade: specimen.user_grade || condRes.estimatedGrade,
        estimated_grade_min: condRes.estimatedGradeMin,
        estimated_grade_max: condRes.estimatedGradeMax,
        numerical_grade_min: condRes.numericalGradeMin,
        numerical_grade_max: condRes.numericalGradeMax,
        observations: condRes.observations,
        confidence: condRes.confidence,
        assessment_provider: condRes.explanation,
        explanation: condRes.explanation,
      });

      loadSpecimens();
      Alert.alert('Saved', 'Physical specimen added to collection.', [
        { text: 'View Specimen', onPress: () => router.replace(`/specimen/${specimen.id}`) },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save specimen.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Photograph Pickers */}
      <Text style={styles.sectionHeader}>SPECIMEN PHOTOGRAPHS</Text>
      <View style={styles.photoRow}>
        <TouchableOpacity
          style={styles.photoBox}
          onPress={() => handlePickPhoto('obverse')}
          activeOpacity={0.8}
        >
          {obverseUri ? (
            <Image source={{ uri: obverseUri }} style={styles.photoImg} resizeMode="cover" />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera" size={26} color={Colors.dark.primary} />
              <Text style={styles.photoLabel}>Add Obverse</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.photoBox}
          onPress={() => handlePickPhoto('reverse')}
          activeOpacity={0.8}
        >
          {reverseUri ? (
            <Image source={{ uri: reverseUri }} style={styles.photoImg} resizeMode="cover" />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera-outline" size={26} color={Colors.dark.textSecondary} />
              <Text style={styles.photoLabel}>Add Reverse</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Coin Type Details */}
      <Text style={styles.sectionHeader}>COIN CLASSIFICATION</Text>
      <Card style={styles.formCard} variant="surface">
        <View style={styles.rowInputs}>
          <View style={[styles.inputGroup, { flex: 2, marginRight: Spacing.sm }]}>
            <Text style={styles.inputLabel}>COUNTRY *</Text>
            <TextInput
              style={styles.input}
              value={country}
              onChangeText={setCountry}
              placeholder="e.g. India, United States"
              placeholderTextColor={Colors.dark.textMuted}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>YEAR</Text>
            <TextInput
              style={styles.input}
              value={year}
              onChangeText={setYear}
              placeholder="1947"
              placeholderTextColor={Colors.dark.textMuted}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>DENOMINATION *</Text>
          <TextInput
            style={styles.input}
            value={denomination}
            onChangeText={setDenomination}
            placeholder="e.g. 1 Rupee, 1 Dollar, Tetradrachm"
            placeholderTextColor={Colors.dark.textMuted}
          />
        </View>

        <View style={styles.rowInputs}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: Spacing.sm }]}>
            <Text style={styles.inputLabel}>METAL</Text>
            <TextInput
              style={styles.input}
              value={metal}
              onChangeText={setMetal}
              placeholder="Silver, Gold, Copper, Nickel"
              placeholderTextColor={Colors.dark.textMuted}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>MINT</Text>
            <TextInput
              style={styles.input}
              value={mint}
              onChangeText={setMint}
              placeholder="e.g. Bombay, Philadelphia"
              placeholderTextColor={Colors.dark.textMuted}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>RULER / AUTHORITY</Text>
          <TextInput
            style={styles.input}
            value={ruler}
            onChangeText={setRuler}
            placeholder="e.g. King George VI, Queen Victoria"
            placeholderTextColor={Colors.dark.textMuted}
          />
        </View>
      </Card>

      {/* Ownership & Grade */}
      <Text style={styles.sectionHeader}>OWNERSHIP & CONDITION</Text>
      <Card style={styles.formCard} variant="surface">
        <View style={styles.rowInputs}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: Spacing.sm }]}>
            <Text style={styles.inputLabel}>CONDITION / GRADE</Text>
            <TextInput
              style={styles.input}
              value={grade}
              onChangeText={setGrade}
              placeholder="e.g. VF30, AU55, MS64"
              placeholderTextColor={Colors.dark.textMuted}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
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
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>ACQUISITION SOURCE</Text>
          <TextInput
            style={styles.input}
            value={source}
            onChangeText={setSource}
            placeholder="e.g. Auction, Coin Dealer, Inherited, Flea Market"
            placeholderTextColor={Colors.dark.textMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>COLLECTOR NOTES</Text>
          <TextInput
            style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Provenance, pedigree, special strike attributes..."
            placeholderTextColor={Colors.dark.textMuted}
            multiline
          />
        </View>
      </Card>

      {/* Submit Button */}
      <Button
        title={isSaving ? 'Preserving...' : 'Save Specimen to Vault'}
        icon={<Ionicons name="checkmark-circle" size={18} color="#101214" />}
        onPress={handleSave}
        disabled={isSaving}
        loading={isSaving}
        size="lg"
        style={{ marginTop: Spacing.sm }}
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
  sectionHeader: {
    ...Typography.micro,
    color: Colors.dark.textSecondary,
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
    marginLeft: 4,
  },
  photoRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  photoBox: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.dark.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    alignItems: 'center',
  },
  photoLabel: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: 4,
    fontWeight: '600',
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
