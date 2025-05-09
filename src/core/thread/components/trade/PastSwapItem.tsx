import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import {format} from 'date-fns';
import {FontAwesome5} from '@expo/vector-icons';
import { SwapTransaction, TokenMetadata } from '../../../../modules/dataModule/services/swapTransactions';

const {width} = Dimensions.get('window');

interface PastSwapItemProps {
  swap: SwapTransaction;
  onSelect: (swap: SwapTransaction) => void;
  selected: boolean;
  inputTokenLogoURI?: string; // New prop for input token logo
  outputTokenLogoURI?: string; // New prop for output token logo
}

/**
 * Get token image URL from token metadata
 * This handles both the standard 'image' property and any custom 'logoURI' property
 * that might be added during enrichment
 */
function getTokenImageUrl(token: TokenMetadata): string | undefined {
  // Use type assertion to access possible runtime properties
  const tokenAny = token as any;

  // For debugging
  console.log('[PastSwapItem] getTokenImageUrl token:', {
    mint: token.mint,
    symbol: token.symbol,
    image: token.image,
    logoURI: tokenAny.logoURI,
  });

  // Try all possible image sources
  const imageUrl = token.image || tokenAny.logoURI;

  if (imageUrl) {
    console.log('[PastSwapItem] Using image URL:', imageUrl);
  } else {
    console.log('[PastSwapItem] No image found for token:', token.symbol);
  }

  return imageUrl;
}

/**
 * Format token amount with proper decimals
 */
function formatTokenAmount(amount: number, decimals: number): string {
  if (decimals === 0) return amount.toString();
  const divisor = Math.pow(10, decimals);
  const result = amount / divisor;

  if (result < 0.001) {
    return result.toFixed(6);
  } else if (result < 0.01) {
    return result.toFixed(5);
  } else if (result < 1) {
    return result.toFixed(4);
  } else if (result < 1000) {
    return result.toFixed(2);
  }

  return result.toLocaleString(undefined, {maximumFractionDigits: 2});
}

/**
 * Format date for display
 */
function formatDate(timestamp: number): string {
  try {
    // Convert to Date object (support both seconds and milliseconds formats)
    const date = new Date(
      timestamp >= 1000000000000 ? timestamp : timestamp * 1000,
    );

    // Ensure the date is valid
    if (isNaN(date.getTime())) {
      console.error(`Invalid timestamp: ${timestamp}`);
      return 'Invalid date';
    }

    return format(date, 'MMM d, h:mm a');
  } catch (error) {
    console.error(`Error formatting date with timestamp ${timestamp}:`, error);
    return 'Unknown date';
  }
}

/**
 * Component for displaying a past swap transaction item with Jupiter-inspired UI
 */
const PastSwapItem: React.FC<PastSwapItemProps> = ({
  swap,
  onSelect,
  selected,
  inputTokenLogoURI,
  outputTokenLogoURI,
}) => {
  const {inputToken, outputToken, timestamp} = swap;

  // Format the token amounts with proper decimals
  const formattedInputAmount = formatTokenAmount(
    inputToken.amount,
    inputToken.decimals,
  );
  const formattedOutputAmount = formatTokenAmount(
    outputToken.amount,
    outputToken.decimals,
  );

  // Determine image sources with clean fallbacks
  const inputImageSource =
    inputTokenLogoURI || inputToken.logoURI || inputToken.image;
  const outputImageSource =
    outputTokenLogoURI || outputToken.logoURI || outputToken.image;

  // Debug
  console.log('[PastSwapItem] Image sources:', {
    inputImageSource,
    outputImageSource,
    inputToken: `${inputToken.symbol} (${inputToken.mint?.substring(0, 6)}...)`,
    outputToken: `${outputToken.symbol} (${outputToken.mint?.substring(
      0,
      6,
    )}...)`,
  });

  return (
    <TouchableOpacity
      style={[styles.swapItem, selected && styles.selectedSwapItem]}
      onPress={() => onSelect(swap)}
      activeOpacity={0.7}>
      <View style={styles.swapHeader}>
        <Text style={styles.dateText}>{formatDate(timestamp)}</Text>

        {/* Signature badge */}
        <View style={styles.signatureBadge}>
          <Text style={styles.signatureText}>
            {swap.signature.slice(0, 4)}...{swap.signature.slice(-4)}
          </Text>
        </View>
      </View>

      <View style={styles.tokensContainer}>
        {/* Input Token */}
        <View style={styles.tokenSide}>
          <View style={styles.tokenIconContainer}>
            {inputImageSource ? (
              <Image
                source={{uri: inputImageSource}}
                style={styles.tokenIcon}
                resizeMode="contain"
              />
            ) : (
              <View style={[styles.tokenIcon, styles.placeholderIcon]}>
                <Text style={styles.placeholderText}>
                  {inputToken.symbol?.charAt(0) || '?'}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.tokenInfo}>
            <Text
              style={styles.tokenAmount}
              numberOfLines={1}
              ellipsizeMode="tail">
              {formattedInputAmount}
            </Text>
            <Text
              style={styles.tokenSymbol}
              numberOfLines={1}
              ellipsizeMode="tail">
              {inputToken.symbol || 'Unknown'}
            </Text>
          </View>
        </View>

        {/* Arrow */}
        <View style={styles.arrowContainer}>
          <FontAwesome5 name="arrow-right" size={12} color="#3871DD" />
        </View>

        {/* Output Token */}
        <View style={styles.tokenSide}>
          <View style={styles.tokenIconContainer}>
            {outputImageSource ? (
              <Image
                source={{uri: outputImageSource}}
                style={styles.tokenIcon}
                resizeMode="contain"
              />
            ) : (
              <View style={[styles.tokenIcon, styles.placeholderIcon]}>
                <Text style={styles.placeholderText}>
                  {outputToken.symbol?.charAt(0) || '?'}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.tokenInfo}>
            <Text
              style={styles.tokenAmount}
              numberOfLines={1}
              ellipsizeMode="tail">
              {formattedOutputAmount}
            </Text>
            <Text
              style={styles.tokenSymbol}
              numberOfLines={1}
              ellipsizeMode="tail">
              {outputToken.symbol || 'Unknown'}
            </Text>
          </View>
        </View>
      </View>

      {/* Selection indicator */}
      {selected && (
        <View style={styles.selectedIndicator}>
          <FontAwesome5 name="check" size={10} color="#FFFFFF" />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  swapItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginVertical: 6,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.05)',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
    position: 'relative',
  },
  selectedSwapItem: {
    borderWidth: 2,
    borderColor: '#3871DD',
    backgroundColor: '#F0F7FF',
  },
  swapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  signatureBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  signatureText: {
    fontSize: 10,
    color: '#4B5563',
    fontWeight: '500',
  },
  tokensContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tokenSide: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    maxWidth: (width - 100) / 2,
  },
  tokenIconContainer: {
    marginRight: 8,
  },
  tokenIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  placeholderIcon: {
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  tokenInfo: {
    flex: 1,
  },
  tokenAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  tokenSymbol: {
    fontSize: 13,
    color: '#6B7280',
  },
  arrowContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#3871DD',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PastSwapItem;
