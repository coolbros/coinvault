import React, { useState } from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius } from '../constants/theme';

export interface CoinAvatarProps {
  obverseUri?: string | null;
  reverseUri?: string | null;
  metal?: string | null;
  denomination?: string | null;
  year?: number | null;
  size?: number;
  allowToggleSide?: boolean;
  style?: ViewStyle;
}

export const CoinAvatar: React.FC<CoinAvatarProps> = ({
  obverseUri,
  reverseUri,
  metal,
  denomination,
  year,
  size = 72,
  allowToggleSide = true,
  style,
}) => {
  const [showReverse, setShowReverse] = useState(false);

  const activeUri = showReverse ? (reverseUri || obverseUri) : (obverseUri || reverseUri);
  const canToggle = allowToggleSide && !!obverseUri && !!reverseUri;

  const getMetalTheme = () => {
    const m = (metal || '').toLowerCase();
    if (m.includes('gold')) {
      return { border: Colors.dark.gold, bg: '#2B2312', rim: '#D4AF3788' };
    }
    if (m.includes('silver')) {
      return { border: Colors.dark.silver, bg: '#222629', rim: '#C0C0C088' };
    }
    if (m.includes('bronze')) {
      return { border: Colors.dark.bronze, bg: '#2A1E14', rim: '#CD7F3288' };
    }
    if (m.includes('copper')) {
      return { border: Colors.dark.copper, bg: '#2C1B12', rim: '#B8733388' };
    }
    return { border: Colors.dark.primaryDark, bg: Colors.dark.elevated, rim: '#C5A15A44' };
  };

  const theme = getMetalTheme();

  const handleToggle = () => {
    if (canToggle) {
      setShowReverse(!showReverse);
    }
  };

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: 2,
    borderColor: theme.border,
    backgroundColor: theme.bg,
  };

  return (
    <TouchableOpacity
      activeOpacity={canToggle ? 0.75 : 1}
      onPress={handleToggle}
      disabled={!canToggle}
      style={[styles.container, containerStyle, style]}
    >
      {activeUri ? (
        <Image
          source={{ uri: activeUri }}
          style={{
            width: size - 6,
            height: size - 6,
            borderRadius: (size - 6) / 2,
          }}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.placeholder, { borderRadius: (size - 6) / 2 }]}>
          <Ionicons name="disc-outline" size={size * 0.42} color={theme.border} />
          {denomination ? (
            <Text
              style={[styles.denomText, { fontSize: Math.max(9, Math.floor(size * 0.14)) }]}
              numberOfLines={1}
            >
              {denomination}
            </Text>
          ) : null}
          {year ? (
            <Text
              style={[styles.yearText, { fontSize: Math.max(8, Math.floor(size * 0.12)) }]}
              numberOfLines={1}
            >
              {year > 0 ? year : `${Math.abs(year)} BCE`}
            </Text>
          ) : null}
        </View>
      )}

      {canToggle && (
        <View style={styles.sideBadge}>
          <Text style={styles.sideBadgeText}>{showReverse ? 'REV' : 'OBV'}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  placeholder: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  denomText: {
    color: Colors.dark.text,
    fontWeight: '700',
    marginTop: 1,
  },
  yearText: {
    color: Colors.dark.textSecondary,
    fontWeight: '500',
  },
  sideBadge: {
    position: 'absolute',
    bottom: 2,
    backgroundColor: '#000000AA',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: Colors.dark.primary,
  },
  sideBadgeText: {
    color: Colors.dark.primaryLight,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
