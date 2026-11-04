import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../src/constants/theme';
import { useSettingsStore, Currency, UnitSystem, ThemeMode, GradingStandard, AIProviderType } from '../../src/stores/settingsStore';
import { useCollectionStore } from '../../src/stores/collectionStore';
import { jsonBackupService } from '../../src/services/export/jsonBackup';
import { csvExportService } from '../../src/services/export/csvExport';
import { specimenRepository } from '../../src/db/repositories/specimenRepository';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Badge } from '../../src/components/Badge';

export default function ProfileSettingsScreen() {
  const {
    currency,
    setCurrency,
    unitSystem,
    setUnitSystem,
    themeMode,
    setThemeMode,
    defaultGradingSystem,
    setDefaultGradingSystem,
    aiProvider,
    setAIProvider,
    geminiApiKey,
    setGeminiApiKey,
  } = useSettingsStore();

  const loadSpecimens = useCollectionStore((s) => s.loadSpecimens);
  const [apiKeyInput, setApiKeyInput] = useState(geminiApiKey);
  const [isExporting, setIsExporting] = useState(false);

  const currencies: Currency[] = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD', 'CHF'];
  const gradingSystems: Array<{ key: GradingStandard; label: string }> = [
    { key: 'sheldon_70', label: 'Sheldon Scale (1–70)' },
    { key: 'european', label: 'European Descriptive' },
    { key: 'adjectival', label: 'Adjectival (Good to Uncirculated)' },
  ];

  const handleSaveApiKey = () => {
    setGeminiApiKey(apiKeyInput.trim());
    Alert.alert('Settings Updated', 'Gemini API Key saved successfully.');
  };

  const handleExportJson = async () => {
    setIsExporting(true);
    try {
      const backupData = jsonBackupService.createBackup();
      const jsonString = JSON.stringify(backupData, null, 2);
      const filename = `coinvault_backup_${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = `${FileSystem.documentDirectory || ''}${filename}`;

      await FileSystem.writeAsStringAsync(fileUri, jsonString);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export CoinVault Backup',
        });
      } else {
        Alert.alert('Export Ready', `Backup file generated at: ${fileUri}`);
      }
    } catch (err: any) {
      Alert.alert('Export Error', err.message || 'Failed to export collection.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const allSpecimens = specimenRepository.list();
      const csvString = csvExportService.generateCsv(allSpecimens);
      const filename = `coinvault_inventory_${new Date().toISOString().split('T')[0]}.csv`;
      const fileUri = `${FileSystem.documentDirectory || ''}${filename}`;

      await FileSystem.writeAsStringAsync(fileUri, csvString);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Collection CSV',
        });
      } else {
        Alert.alert('Export Ready', `CSV inventory generated at: ${fileUri}`);
      }
    } catch (err: any) {
      Alert.alert('Export Error', err.message || 'Failed to export CSV.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportBackup = async () => {
    try {
      const docResult = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (docResult.canceled || !docResult.assets?.[0]?.uri) return;

      const fileContent = await FileSystem.readAsStringAsync(docResult.assets[0].uri);
      const validation = jsonBackupService.validateBackup(fileContent);

      if (!validation.valid || !validation.data) {
        Alert.alert('Invalid Backup File', validation.error || 'The selected file is not a valid CoinVault backup schema.');
        return;
      }

      Alert.alert(
        'Confirm Collection Restore',
        `This backup contains ${validation.data.specimens.length} specimens and ${validation.data.coin_types.length} coin types. Would you like to merge with or overwrite your current collection?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Merge (Keep Existing)',
            onPress: () => {
              const res = jsonBackupService.restoreBackup(validation.data!, false);
              loadSpecimens();
              Alert.alert('Success', `Restored ${res.specimensRestored} specimens.`);
            },
          },
          {
            text: 'Overwrite All',
            style: 'destructive',
            onPress: () => {
              const res = jsonBackupService.restoreBackup(validation.data!, true);
              loadSpecimens();
              Alert.alert('Success', `Collection overwritten with ${res.specimensRestored} specimens.`);
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Import Error', err.message || 'Failed to read backup file.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <Card style={styles.profileCard} variant="surface">
        <View style={styles.profileRow}>
          <View style={styles.avatarCircle}>
            <Ionicons name="shield-checkmark" size={32} color={Colors.dark.primary} />
          </View>
          <View style={styles.profileText}>
            <Text style={styles.profileName}>Numismatic Curator</Text>
            <Text style={styles.profileRole}>Local-First Private Vault</Text>
          </View>
        </View>
      </Card>

      {/* Currency & Units */}
      <Text style={styles.sectionHeader}>CURRENCY & LOCALIZATION</Text>
      <Card style={styles.settingCard} variant="surface">
        <Text style={styles.subLabel}>PORTFOLIO VALUATION CURRENCY</Text>
        <View style={styles.currencyRow}>
          {currencies.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.currencyChip, currency === c && styles.currencyChipActive]}
              onPress={() => setCurrency(c)}
            >
              <Text style={[styles.currencyChipText, currency === c && styles.currencyChipTextActive]}>
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.divider} />

        <Text style={styles.subLabel}>MEASUREMENT UNITS</Text>
        <View style={styles.rowToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, unitSystem === 'metric' && styles.toggleBtnActive]}
            onPress={() => setUnitSystem('metric')}
          >
            <Text style={[styles.toggleText, unitSystem === 'metric' && styles.toggleTextActive]}>
              Metric (mm, grams)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, unitSystem === 'imperial' && styles.toggleBtnActive]}
            onPress={() => setUnitSystem('imperial')}
          >
            <Text style={[styles.toggleText, unitSystem === 'imperial' && styles.toggleTextActive]}>
              Imperial (inches, troy oz)
            </Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Grading Standard */}
      <Text style={styles.sectionHeader}>DEFAULT GRADING SYSTEM</Text>
      <Card style={styles.settingCard} variant="surface">
        {gradingSystems.map((gs) => {
          const isSelected = defaultGradingSystem === gs.key;
          return (
            <TouchableOpacity
              key={gs.key}
              style={styles.radioRow}
              onPress={() => setDefaultGradingSystem(gs.key)}
            >
              <Ionicons
                name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={isSelected ? Colors.dark.primary : Colors.dark.textMuted}
              />
              <Text style={[styles.radioLabel, isSelected && styles.radioLabelActive]}>
                {gs.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </Card>

      {/* AI Provider Configuration */}
      <Text style={styles.sectionHeader}>AI IDENTIFICATION ENGINE</Text>
      <Card style={styles.settingCard} variant="surface">
        <View style={styles.rowToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, aiProvider === 'mock' && styles.toggleBtnActive]}
            onPress={() => setAIProvider('mock')}
          >
            <Text style={[styles.toggleText, aiProvider === 'mock' && styles.toggleTextActive]}>
              Offline Sandbox
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, aiProvider === 'gemini' && styles.toggleBtnActive]}
            onPress={() => setAIProvider('gemini')}
          >
            <Text style={[styles.toggleText, aiProvider === 'gemini' && styles.toggleTextActive]}>
              Gemini 2.5 Flash
            </Text>
          </TouchableOpacity>
        </View>

        {aiProvider === 'gemini' && (
          <View style={styles.apiKeySection}>
            <Text style={styles.subLabel}>GEMINI MULTIMODAL API KEY</Text>
            <View style={styles.apiKeyInputRow}>
              <TextInput
                style={styles.apiKeyInput}
                value={apiKeyInput}
                onChangeText={setApiKeyInput}
                placeholder="Paste AI Studio API Key..."
                placeholderTextColor={Colors.dark.textMuted}
                secureTextEntry
                autoCapitalize="none"
              />
              <Button
                title="Save"
                size="sm"
                onPress={handleSaveApiKey}
                style={{ marginLeft: 8 }}
              />
            </View>
            <Text style={styles.apiKeyNotice}>
              API keys are stored securely in local device storage and are never transmitted to third parties.
            </Text>
          </View>
        )}
      </Card>

      {/* Data Export & Backup */}
      <Text style={styles.sectionHeader}>COLLECTION BACKUP & EXPORT</Text>
      <Card style={styles.settingCard} variant="surface">
        <TouchableOpacity
          style={styles.menuRow}
          onPress={handleExportJson}
          disabled={isExporting}
        >
          <View style={styles.menuIconWrapper}>
            <Ionicons name="cloud-download-outline" size={20} color={Colors.dark.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>Export Full Collection Backup (JSON)</Text>
            <Text style={styles.menuSub}>Complete relational backup including valuations & history</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.dark.textMuted} />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.menuRow}
          onPress={handleExportCsv}
          disabled={isExporting}
        >
          <View style={styles.menuIconWrapper}>
            <Ionicons name="document-text-outline" size={20} color={Colors.dark.info} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>Export Collection Spreadsheet (CSV)</Text>
            <Text style={styles.menuSub}>Tabular format for Excel or Google Sheets</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.dark.textMuted} />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.menuRow}
          onPress={handleImportBackup}
        >
          <View style={styles.menuIconWrapper}>
            <Ionicons name="cloud-upload-outline" size={20} color={Colors.dark.success} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>Restore Collection from Backup</Text>
            <Text style={styles.menuSub}>Validate and import a previously generated JSON backup</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.dark.textMuted} />
        </TouchableOpacity>
      </Card>

      {/* About CoinVault */}
      <View style={styles.aboutFooter}>
        <Text style={styles.aboutTitle}>CoinVault Numismatics</Text>
        <Text style={styles.aboutVersion}>Version 1.0.0 (Local-First Architecture)</Text>
        <Text style={styles.aboutLegal}>
          Data persists strictly on-device in SQLite. AI attributions and estimated condition assessments are advisory collector aids.
        </Text>
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
  profileCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.dark.elevated,
    borderWidth: 1.5,
    borderColor: Colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileText: {
    marginLeft: Spacing.md,
  },
  profileName: {
    ...Typography.title,
    color: Colors.dark.text,
  },
  profileRole: {
    ...Typography.caption,
    color: Colors.dark.primaryLight,
    marginTop: 2,
  },
  sectionHeader: {
    ...Typography.micro,
    color: Colors.dark.textSecondary,
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
    marginLeft: 4,
  },
  settingCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  subLabel: {
    ...Typography.micro,
    color: Colors.dark.textMuted,
    letterSpacing: 0.6,
    marginBottom: Spacing.xs,
  },
  currencyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  currencyChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.dark.elevated,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  currencyChipActive: {
    backgroundColor: Colors.dark.primaryDark,
    borderColor: Colors.dark.primary,
  },
  currencyChipText: {
    ...Typography.caption,
    color: Colors.dark.text,
    fontWeight: '600',
  },
  currencyChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.dark.border,
    marginVertical: Spacing.md,
  },
  rowToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.elevated,
    borderRadius: BorderRadius.md,
    padding: 3,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  toggleBtnActive: {
    backgroundColor: Colors.dark.primaryDark,
  },
  toggleText: {
    ...Typography.caption,
    color: Colors.dark.textMuted,
  },
  toggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  radioLabel: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    marginLeft: Spacing.sm,
  },
  radioLabelActive: {
    color: Colors.dark.text,
    fontWeight: '600',
  },
  apiKeySection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  apiKeyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  apiKeyInput: {
    flex: 1,
    backgroundColor: Colors.dark.elevated,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    color: Colors.dark.text,
    fontSize: 14,
  },
  apiKeyNotice: {
    ...Typography.micro,
    color: Colors.dark.textMuted,
    marginTop: 4,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  menuIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  menuTitle: {
    ...Typography.caption,
    color: Colors.dark.text,
    fontWeight: '600',
  },
  menuSub: {
    ...Typography.micro,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  aboutFooter: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  aboutTitle: {
    ...Typography.subtitle,
    color: Colors.dark.primaryLight,
  },
  aboutVersion: {
    ...Typography.micro,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  aboutLegal: {
    ...Typography.micro,
    color: Colors.dark.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.xl,
    lineHeight: 14,
  },
});
