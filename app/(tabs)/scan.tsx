import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../src/constants/theme';
import { useScanStore } from '../../src/stores/scanStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { QualityIndicator } from '../../src/components/QualityIndicator';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';

export default function ScanScreen() {
  const router = useRouter();
  const {
    obverseImageUri,
    reverseImageUri,
    qualityAssessment,
    isAnalyzing,
    errorMessage,
    setObverseImage,
    setReverseImage,
    clearScan,
    runIdentification,
    saveAsUnidentifiedSpecimen,
  } = useScanStore();

  const aiProvider = useSettingsStore((s) => s.aiProvider);
  const geminiApiKey = useSettingsStore((s) => s.geminiApiKey);

  const [activeSide, setActiveSide] = useState<'obverse' | 'reverse'>('obverse');
  const [showHints, setShowHints] = useState(false);
  const [countryHint, setCountryHint] = useState('');
  const [yearHint, setYearHint] = useState('');

  const pickImage = async (side: 'obverse' | 'reverse', useCamera: boolean) => {
    try {
      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Needed', 'Camera access is required to photograph physical coins.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.9,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.9,
        });
      }

      if (!result.canceled && result.assets?.[0]?.uri) {
        const uri = result.assets[0].uri;
        if (side === 'obverse') {
          await setObverseImage(uri);
          setActiveSide('reverse'); // Auto-advance prompt to reverse
        } else {
          await setReverseImage(uri);
        }
      }
    } catch (err: any) {
      console.error('Error selecting coin photo:', err);
      Alert.alert('Image Error', err.message || 'Could not load photograph.');
    }
  };

  const handleRunIdentification = async () => {
    if (!obverseImageUri) {
      Alert.alert('Missing Photo', 'Please photograph or select at least the obverse side of the coin.');
      return;
    }

    const hints = {
      countryHint: countryHint.trim() || undefined,
      yearHint: yearHint.trim() ? parseInt(yearHint.trim(), 10) : undefined,
    };

    const result = await runIdentification(hints);
    if (result) {
      router.push('/scan/confirm');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Banner explaining Scanner */}
      <View style={styles.topInfo}>
        <View style={styles.badgeRow}>
          <View style={styles.providerBadge}>
            <Ionicons
              name={aiProvider === 'gemini' ? 'flash' : 'cube-outline'}
              size={12}
              color={Colors.dark.primary}
            />
            <Text style={styles.providerBadgeText}>
              {aiProvider === 'gemini'
                ? geminiApiKey
                  ? 'Gemini 2.5 Flash Vision'
                  : 'Gemini (No Key Set)'
                : 'Numismatic Offline Engine'}
            </Text>
          </View>
        </View>
        <Text style={styles.bannerTitle}>Numismatic Dual-Side Scanner</Text>
        <Text style={styles.bannerSubtitle}>
          Photograph obverse (heads) and reverse (tails) for maximum attribution confidence.
        </Text>
      </View>

      {/* Dual Coin Photography Target Cards */}
      <View style={styles.photoDualRow}>
        {/* Obverse Box */}
        <View style={styles.photoCol}>
          <Text style={styles.sideLabel}>1. OBVERSE (HEADS)</Text>
          <TouchableOpacity
            style={[
              styles.coinFrame,
              obverseImageUri ? styles.coinFrameFilled : null,
              activeSide === 'obverse' ? styles.coinFrameActive : null,
            ]}
            onPress={() => {
              setActiveSide('obverse');
              Alert.alert('Obverse Photograph', 'Choose capture source:', [
                { text: 'Take Photo', onPress: () => pickImage('obverse', true) },
                { text: 'Choose from Gallery', onPress: () => pickImage('obverse', false) },
                { text: 'Cancel', style: 'cancel' },
              ]);
            }}
            activeOpacity={0.8}
          >
            {obverseImageUri ? (
              <Image source={{ uri: obverseImageUri }} style={styles.coinImage} resizeMode="cover" />
            ) : (
              <View style={styles.emptyPhotoTarget}>
                <View style={styles.targetRing}>
                  <Ionicons name="camera" size={28} color={Colors.dark.primary} />
                </View>
                <Text style={styles.tapToCaptureText}>Tap to Capture</Text>
                <Text style={styles.tapSub}>Align coin in circle</Text>
              </View>
            )}

            {obverseImageUri && (
              <View style={styles.retakePill}>
                <Ionicons name="camera-reverse" size={12} color="#FFFFFF" />
                <Text style={styles.retakeText}>Retake</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Reverse Box */}
        <View style={styles.photoCol}>
          <Text style={styles.sideLabel}>2. REVERSE (TAILS)</Text>
          <TouchableOpacity
            style={[
              styles.coinFrame,
              reverseImageUri ? styles.coinFrameFilled : null,
              activeSide === 'reverse' ? styles.coinFrameActive : null,
            ]}
            onPress={() => {
              setActiveSide('reverse');
              Alert.alert('Reverse Photograph', 'Choose capture source:', [
                { text: 'Take Photo', onPress: () => pickImage('reverse', true) },
                { text: 'Choose from Gallery', onPress: () => pickImage('reverse', false) },
                { text: 'Cancel', style: 'cancel' },
              ]);
            }}
            activeOpacity={0.8}
          >
            {reverseImageUri ? (
              <Image source={{ uri: reverseImageUri }} style={styles.coinImage} resizeMode="cover" />
            ) : (
              <View style={styles.emptyPhotoTarget}>
                <View style={[styles.targetRing, { borderColor: Colors.dark.borderLight }]}>
                  <Ionicons name="camera-outline" size={28} color={Colors.dark.textSecondary} />
                </View>
                <Text style={styles.tapToCaptureText}>Tap to Capture</Text>
                <Text style={styles.tapSub}>Recommended</Text>
              </View>
            )}

            {reverseImageUri && (
              <View style={styles.retakePill}>
                <Ionicons name="camera-reverse" size={12} color="#FFFFFF" />
                <Text style={styles.retakeText}>Retake</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Image Quality Analysis Feedback */}
      {qualityAssessment && (
        <QualityIndicator assessment={qualityAssessment} style={{ marginVertical: Spacing.sm }} />
      )}

      {/* Single-side warning if obverse exists but reverse is missing */}
      {obverseImageUri && !reverseImageUri && (
        <Card style={styles.singleSideWarning} variant="elevated">
          <Ionicons name="information-circle" size={18} color={Colors.dark.info} />
          <Text style={styles.singleSideText}>
            Single-image mode: Year or mint mark on the reverse may have reduced certainty. Capturing both sides is strongly recommended.
          </Text>
        </Card>
      )}

      {/* Optional Hints Dropdown */}
      <TouchableOpacity
        style={styles.hintsToggle}
        onPress={() => setShowHints(!showHints)}
      >
        <Ionicons
          name={showHints ? 'chevron-down' : 'chevron-forward'}
          size={16}
          color={Colors.dark.primary}
        />
        <Text style={styles.hintsToggleText}>
          {showHints ? 'Hide Collector Hints' : 'Add Optional Hints (Country / Year)'}
        </Text>
      </TouchableOpacity>

      {showHints && (
        <Card style={styles.hintsCard} variant="surface">
          <Text style={styles.hintInputLabel}>KNOWN COUNTRY / REGION</Text>
          <TextInput
            style={styles.hintInput}
            value={countryHint}
            onChangeText={setCountryHint}
            placeholder="e.g. India, United States, Great Britain, Rome"
            placeholderTextColor={Colors.dark.textMuted}
          />
          <Text style={[styles.hintInputLabel, { marginTop: Spacing.sm }]}>KNOWN YEAR OR ERA</Text>
          <TextInput
            style={styles.hintInput}
            value={yearHint}
            onChangeText={setYearHint}
            placeholder="e.g. 1947, 1881, or ancient era"
            placeholderTextColor={Colors.dark.textMuted}
            keyboardType="numeric"
          />
        </Card>
      )}

      {/* Error Message banner */}
      {errorMessage && (
        <Card style={styles.errorCard} variant="elevated">
          <Ionicons name="warning" size={20} color={Colors.dark.danger} />
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Button
            title="Save as Unidentified Specimen"
            variant="outline"
            size="sm"
            onPress={async () => {
              const spec = await saveAsUnidentifiedSpecimen();
              if (spec) {
                Alert.alert('Saved', 'Saved as unidentified specimen in collection.');
                router.push(`/specimen/${spec.id}`);
              }
            }}
            style={{ marginTop: Spacing.sm }}
          />
        </Card>
      )}

      {/* Scan Action Buttons */}
      <View style={styles.buttonGroup}>
        <Button
          title={isAnalyzing ? 'Analyzing Coin Characteristics...' : 'Identify with AI'}
          icon={
            isAnalyzing ? (
              <ActivityIndicator size="small" color="#101214" />
            ) : (
              <Ionicons name="sparkles" size={18} color="#101214" />
            )
          }
          onPress={handleRunIdentification}
          disabled={!obverseImageUri || isAnalyzing}
          loading={isAnalyzing}
          size="lg"
          style={styles.primaryScanBtn}
        />

        {obverseImageUri && (
          <Button
            title="Clear & Start Over"
            variant="ghost"
            onPress={clearScan}
            disabled={isAnalyzing}
            style={{ marginTop: Spacing.xs }}
          />
        )}
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
  topInfo: {
    marginBottom: Spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  providerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.dark.primaryDark,
    gap: 4,
  },
  providerBadgeText: {
    ...Typography.micro,
    color: Colors.dark.primaryLight,
    fontWeight: '700',
  },
  bannerTitle: {
    ...Typography.header,
    color: Colors.dark.text,
  },
  bannerSubtitle: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  photoDualRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  photoCol: {
    flex: 1,
  },
  sideLabel: {
    ...Typography.micro,
    color: Colors.dark.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  coinFrame: {
    aspectRatio: 1,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.dark.surface,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.dark.border,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  coinFrameFilled: {
    borderStyle: 'solid',
    borderColor: Colors.dark.primaryDark,
  },
  coinFrameActive: {
    borderColor: Colors.dark.primary,
  },
  coinImage: {
    width: '100%',
    height: '100%',
  },
  emptyPhotoTarget: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
  },
  targetRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: Colors.dark.primaryDark,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  tapToCaptureText: {
    ...Typography.caption,
    color: Colors.dark.text,
    fontWeight: '600',
  },
  tapSub: {
    ...Typography.micro,
    color: Colors.dark.textMuted,
    marginTop: 1,
  },
  retakePill: {
    position: 'absolute',
    bottom: 8,
    backgroundColor: '#000000B3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 0.5,
    borderColor: Colors.dark.primary,
  },
  retakeText: {
    ...Typography.micro,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  singleSideWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    marginVertical: Spacing.xs,
    gap: Spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: Colors.dark.info,
  },
  singleSideText: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    flex: 1,
  },
  hintsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: 4,
  },
  hintsToggleText: {
    ...Typography.caption,
    color: Colors.dark.primary,
    fontWeight: '600',
  },
  hintsCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  hintInputLabel: {
    ...Typography.micro,
    color: Colors.dark.textMuted,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  hintInput: {
    backgroundColor: Colors.dark.elevated,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.dark.text,
    fontSize: 14,
  },
  errorCard: {
    padding: Spacing.md,
    marginVertical: Spacing.sm,
    borderColor: Colors.dark.danger,
    borderWidth: 1,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.dark.danger,
    marginTop: 4,
  },
  buttonGroup: {
    marginTop: Spacing.md,
  },
  primaryScanBtn: {
    height: 52,
  },
});
