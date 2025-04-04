import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import ActionDetailModal from './ActionDetailModal';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Action,
  formatSolAmount,
  formatTokenAmount,
  truncateAddress,
  getTimeAgo,
  extractAmountFromDescription,
  getTransactionTypeInfo
} from '../../services/profileActions';
import { ActionsPageProps } from '../../types';

interface RawTokenAmount {
  tokenAmount: string;
  decimals: number;
}

interface TokenTransfer {
  fromUserAccount: string;
  toUserAccount: string;
  fromTokenAccount: string;
  toTokenAccount: string;
  tokenAmount: number;
  mint: string;
  tokenName?: string;
  symbol?: string;
}

interface NativeTransfer {
  fromUserAccount: string;
  toUserAccount: string;
  amount: number;
}

interface TokenDetail {
  userAccount: string;
  tokenAccount: string;
  mint: string;
  rawTokenAmount: RawTokenAmount;
}

interface SwapEvent {
  tokenInputs?: TokenDetail[];
  tokenOutputs?: TokenDetail[];
  tokenFees?: TokenDetail[];
  nativeInput?: { account: string; amount: string | number };
  nativeOutput?: { account: string; amount: string | number };
  nativeFees?: Array<{ account: string; amount: string | number }>;
  innerSwaps?: any[];
}

interface TransactionEvents {
  nft?: any;
  swap?: SwapEvent;
  compressed?: any;
  distributeCompressionRewards?: { amount: number };
  setAuthority?: any;
}

/**
 * Parse transaction details to get direction and amount
 */
function getTransactionDetails(
  action: Action,
  walletAddress?: string,
): {
  direction: 'in' | 'out' | 'neutral';
  amount: number;
  symbol: string;
  counterparty?: string;
  rawData?: any;
} {
  if (!walletAddress) {
    return { direction: 'neutral', amount: 0, symbol: 'SOL' };
  }

  // First try to extract from description
  const descriptionAmount = extractAmountFromDescription(action.description);

  // For native transfers (SOL)
  if (action.nativeTransfers && action.nativeTransfers.length > 0) {
    const transfer = action.nativeTransfers[0];

    // Debug the native transfer amount
    console.log('Native transfer amount:', transfer.amount, 'lamports');

    if (transfer.fromUserAccount === walletAddress) {
      return {
        direction: 'out',
        amount: transfer.amount,
        symbol: 'SOL',
        counterparty: truncateAddress(transfer.toUserAccount),
        rawData: transfer,
      };
    }

    if (transfer.toUserAccount === walletAddress) {
      return {
        direction: 'in',
        amount: transfer.amount,
        symbol: 'SOL',
        counterparty: truncateAddress(transfer.fromUserAccount),
        rawData: transfer,
      };
    }

    // If this wallet is not directly involved but we have a description amount
    if (descriptionAmount && descriptionAmount.symbol.toUpperCase() === 'SOL') {
      return {
        direction: transfer.fromUserAccount === action.feePayer ? 'out' : 'in',
        amount: descriptionAmount.amount * 1_000_000_000, // Convert to lamports
        symbol: 'SOL',
        counterparty: truncateAddress(
          transfer.fromUserAccount === action.feePayer
            ? transfer.toUserAccount
            : transfer.fromUserAccount,
        ),
        rawData: transfer,
      };
    }

    // For any wallet, just show the transfer - make sure we use the amount directly
    return {
      direction: 'neutral',
      amount: transfer.amount,
      symbol: 'SOL',
      counterparty: `${truncateAddress(
        transfer.fromUserAccount,
      )} → ${truncateAddress(transfer.toUserAccount)}`,
      rawData: transfer,
    };
  }

  // For token transfers
  if (action.tokenTransfers && action.tokenTransfers.length > 0) {
    const transfer = action.tokenTransfers[0];
    const symbol = transfer.symbol || truncateAddress(transfer.mint);

    if (transfer.fromUserAccount === walletAddress) {
      return {
        direction: 'out',
        amount: transfer.tokenAmount,
        symbol,
        counterparty: truncateAddress(transfer.toUserAccount),
        rawData: transfer,
      };
    }

    if (transfer.toUserAccount === walletAddress) {
      return {
        direction: 'in',
        amount: transfer.tokenAmount,
        symbol,
        counterparty: truncateAddress(transfer.fromUserAccount),
        rawData: transfer,
      };
    }

    // For any wallet, just show the transfer
    return {
      direction: 'neutral',
      amount: transfer.tokenAmount,
      symbol,
      counterparty: `${truncateAddress(
        transfer.fromUserAccount,
      )} → ${truncateAddress(transfer.toUserAccount)}`,
      rawData: transfer,
    };
  }

  // Check account data changes for balance changes
  if (action.accountData && action.accountData.length > 0) {
    const walletData = action.accountData.find(
      data => data.account === walletAddress,
    );
    if (walletData) {
      if (walletData.nativeBalanceChange && walletData.nativeBalanceChange > 0) {
        return {
          direction: 'in',
          amount: walletData.nativeBalanceChange,
          symbol: 'SOL',
          rawData: walletData,
        };
      }

      if (walletData.nativeBalanceChange && walletData.nativeBalanceChange < 0) {
        // Exclude fee payments as direction indicator
        if (
          action.fee !== undefined &&
          walletData.nativeBalanceChange === -action.fee
        ) {
          return { direction: 'neutral', amount: 0, symbol: 'SOL' };
        }

        return {
          direction: 'out',
          amount: Math.abs(walletData.nativeBalanceChange),
          symbol: 'SOL',
          rawData: walletData,
        };
      }
    }

    // If this wallet isn't in accountData but we have a description amount
    if (descriptionAmount && descriptionAmount.symbol.toUpperCase() === 'SOL') {
      const isOutgoing = action.feePayer === walletAddress;

      return {
        direction: isOutgoing ? 'out' : 'in',
        amount: descriptionAmount.amount * 1_000_000_000, // Convert to lamports
        symbol: 'SOL',
      };
    }
  }

  // For swap events
  if (action.events?.swap) {
    const swap = action.events.swap;

    // Check for SOL involved in swap
    if (swap.nativeInput && swap.nativeInput.account === walletAddress) {
      const amount =
        typeof swap.nativeInput.amount === 'string'
          ? parseInt(swap.nativeInput.amount, 10)
          : swap.nativeInput.amount;

      const outputSymbol =
        swap.tokenOutputs && swap.tokenOutputs.length > 0
          ? swap.tokenOutputs[0].rawTokenAmount.tokenAmount
            ? `${formatTokenAmount(
              parseFloat(swap.tokenOutputs[0].rawTokenAmount.tokenAmount),
              parseInt(
                String(swap.tokenOutputs[0].rawTokenAmount.decimals),
                10,
              ),
            )} ${truncateAddress(swap.tokenOutputs[0].mint)}`
            : truncateAddress(swap.tokenOutputs[0].mint)
          : 'tokens';

      return {
        direction: 'out',
        amount,
        symbol: 'SOL',
        counterparty: outputSymbol,
        rawData: swap,
      };
    }

    if (swap.nativeOutput && swap.nativeOutput.account === walletAddress) {
      const amount =
        typeof swap.nativeOutput.amount === 'string'
          ? parseInt(swap.nativeOutput.amount, 10)
          : swap.nativeOutput.amount;

      const inputSymbol =
        swap.tokenInputs && swap.tokenInputs.length > 0
          ? swap.tokenInputs[0].rawTokenAmount.tokenAmount
            ? `${formatTokenAmount(
              parseFloat(swap.tokenInputs[0].rawTokenAmount.tokenAmount),
              parseInt(
                String(swap.tokenInputs[0].rawTokenAmount.decimals),
                10,
              ),
            )} ${truncateAddress(swap.tokenInputs[0].mint)}`
            : truncateAddress(swap.tokenInputs[0].mint)
          : 'tokens';

      return {
        direction: 'in',
        amount,
        symbol: 'SOL',
        counterparty: inputSymbol,
        rawData: swap,
      };
    }

    // Check for tokens involved in swap
    if (swap.tokenInputs && swap.tokenInputs.length > 0) {
      const input = swap.tokenInputs[0];
      if (input.userAccount === walletAddress) {
        const outputSymbol =
          swap.tokenOutputs && swap.tokenOutputs.length > 0
            ? swap.tokenOutputs[0].rawTokenAmount.tokenAmount
              ? `${formatTokenAmount(
                parseFloat(swap.tokenOutputs[0].rawTokenAmount.tokenAmount),
                parseInt(
                  String(swap.tokenOutputs[0].rawTokenAmount.decimals),
                  10,
                ),
              )} ${truncateAddress(swap.tokenOutputs[0].mint)}`
              : truncateAddress(swap.tokenOutputs[0].mint)
            : 'tokens';

        return {
          direction: 'out',
          amount: parseFloat(input.rawTokenAmount.tokenAmount),
          symbol: truncateAddress(input.mint),
          counterparty: outputSymbol,
          rawData: {
            input,
            decimals: parseInt(String(input.rawTokenAmount.decimals), 10),
          },
        };
      }
    }

    if (swap.tokenOutputs && swap.tokenOutputs.length > 0) {
      const output = swap.tokenOutputs[0];
      if (output.userAccount === walletAddress) {
        const inputSymbol =
          swap.tokenInputs && swap.tokenInputs.length > 0
            ? swap.tokenInputs[0].rawTokenAmount.tokenAmount
              ? `${formatTokenAmount(
                parseFloat(swap.tokenInputs[0].rawTokenAmount.tokenAmount),
                parseInt(
                  String(swap.tokenInputs[0].rawTokenAmount.decimals),
                  10,
                ),
              )} ${truncateAddress(swap.tokenInputs[0].mint)}`
              : truncateAddress(swap.tokenInputs[0].mint)
            : 'tokens';

        return {
          direction: 'in',
          amount: parseFloat(output.rawTokenAmount.tokenAmount),
          symbol: truncateAddress(output.mint),
          counterparty: inputSymbol,
          rawData: {
            output,
            decimals: parseInt(String(output.rawTokenAmount.decimals), 10),
          },
        };
      }
    }

    // If we have a swap but couldn't determine direction
    if (descriptionAmount) {
      return {
        direction: 'neutral',
        amount: descriptionAmount.amount,
        symbol: descriptionAmount.symbol,
        rawData: swap,
      };
    }

    return { direction: 'neutral', amount: 0, symbol: 'SWAP', rawData: swap };
  }

  // Try to extract from description as last resort
  if (descriptionAmount) {
    return {
      direction: 'neutral',
      amount:
        descriptionAmount.symbol.toUpperCase() === 'SOL'
          ? descriptionAmount.amount * 1_000_000_000 // Convert to lamports
          : descriptionAmount.amount,
      symbol: descriptionAmount.symbol,
    };
  }

  // Default case
  return { direction: 'neutral', amount: 0, symbol: 'SOL' };
}

/**
 * Get a simple description for the transaction
 */
function getSimpleDescription(action: Action): string {
  // Check for enriched data first
  if (action.enrichedData) {
    const { direction, counterparty } = action.enrichedData;

    // For swap transactions
    if (action.enrichedType === 'SWAP') {
      const { swapType, inputSymbol, outputSymbol } = action.enrichedData;

      if (swapType === 'TOKEN_TO_TOKEN') {
        return `Swapped ${inputSymbol} → ${outputSymbol}`;
      } else if (swapType === 'SOL_TO_TOKEN') {
        return `Swapped SOL → ${outputSymbol}`;
      } else if (swapType === 'TOKEN_TO_SOL') {
        return `Swapped ${inputSymbol} → SOL`;
      }

      return 'Token Swap';
    }

    // For transfer transactions
    if (
      action.enrichedType === 'TRANSFER' ||
      action.enrichedType === 'TOKEN_TRANSFER'
    ) {
      if (direction === 'IN') {
        return counterparty ? `Received from ${counterparty}` : 'Received';
      }

      if (direction === 'OUT') {
        return counterparty ? `Sent to ${counterparty}` : 'Sent';
      }
    }
  }

  // Fall back to previous logic if enriched data not available
  if (action.description) {
    const desc = action.description.toLowerCase();
    if (desc.includes('transfer')) return 'Transfer';
    if (desc.includes('swap')) return 'Swap';
    if (desc.includes('buy')) return 'Buy';
    if (desc.includes('sell')) return 'Sell';
    if (desc.includes('stake')) return 'Stake';
  }

  return 'Transaction';
}

/**
 * Format amount to display with proper units
 */
function displayAmount(action: Action): {
  amount: string;
  symbol: string;
  color: string;
} {
  // Default values
  let amount = '0';
  let symbol = 'SOL';
  let color = '#333'; // Neutral color

  // Check for enriched data
  if (action.enrichedData) {
    const { direction } = action.enrichedData;

    // Set color based on direction
    color =
      direction === 'IN' ? '#14F195' : direction === 'OUT' ? '#F43860' : '#333';

    // For swap transactions
    if (action.enrichedType === 'SWAP') {
      const { swapType, inputAmount, outputAmount, inputSymbol, outputSymbol } =
        action.enrichedData;

      // Display relevant amount based on direction (what user gained or lost)
      if (direction === 'IN') {
        amount = outputAmount ? outputAmount.toFixed(4) : '?';
        symbol = outputSymbol || 'tokens';
      } else {
        amount = inputAmount ? inputAmount.toFixed(4) : '?';
        symbol = inputSymbol || 'tokens';
      }
    }

    // For transfer transactions
    else if (
      action.enrichedType === 'TRANSFER' ||
      action.enrichedType === 'TOKEN_TRANSFER'
    ) {
      const {
        transferType,
        amount: txAmount,
        tokenSymbol,
        decimals,
      } = action.enrichedData;

      if (transferType === 'SOL') {
        // Format SOL amount
        amount = txAmount ? txAmount.toFixed(4) : '?';
        symbol = 'SOL';
      } else {
        // Format token amount
        amount = txAmount ? txAmount.toString() : '?';
        symbol = tokenSymbol || 'tokens';
      }
    }
  }
  // Fall back to previous logic if enriched data not available
  else if (action.nativeTransfers && action.nativeTransfers.length > 0) {
    const transfer = action.nativeTransfers[0];
    amount = formatSolAmount(transfer.amount);
    symbol = 'SOL';
  } else if (action.tokenTransfers && action.tokenTransfers.length > 0) {
    const transfer = action.tokenTransfers[0];
    amount = transfer.tokenAmount.toString();
    symbol = transfer.symbol || truncateAddress(transfer.mint);
  }

  return { amount, symbol, color };
}

const ActionItem: React.FC<{
  action: Action;
  onPress: () => void;
  walletAddress?: string;
}> = ({ action, onPress, walletAddress }) => {
  // Get transaction type and icon
  const type =
    action.enrichedType ||
    action.type ||
    action.transactionType ||
    'TRANSACTION';
  const { icon, color } = getTransactionTypeInfo(type);

  // Get simplified description
  const description = getSimpleDescription(action);

  // Get formatted amount
  const { amount, symbol, color: amountColor } = displayAmount(action);

  // Time ago
  const timeAgo = action.timestamp ? getTimeAgo(action.timestamp) : '';

  // Direction prefix
  const direction = action.enrichedData?.direction;
  const directionPrefix =
    direction === 'IN' ? '+ ' : direction === 'OUT' ? '- ' : '';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.card}>
      <View style={styles.cardContent}>
        {/* Left - Icon */}
        <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
          <FontAwesome5 name={icon} size={16} color={color} />
        </View>

        {/* Middle - Transaction Info */}
        <View style={styles.txInfo}>
          <Text style={styles.description}>{description}</Text>
          <Text style={styles.timeAgo}>{timeAgo}</Text>
        </View>

        {/* Right - Amount */}
        <View style={styles.amountContainer}>
          <Text style={[styles.amount, { color: amountColor }]}>
            {directionPrefix}
            {amount}
          </Text>
          <Text style={styles.symbol}>{symbol}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const ActionsPage: React.FC<ActionsPageProps> = ({
  myActions,
  loadingActions,
  fetchActionsError,
  walletAddress,
}) => {
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);

  if (loadingActions) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3871DD" />
        <Text style={styles.emptyText}>Loading transactions...</Text>
      </View>
    );
  }

  if (fetchActionsError) {
    return (
      <View style={styles.centered}>
        <FontAwesome5 name="exclamation-circle" size={32} color="#F43860" />
        <Text style={styles.errorText}>{fetchActionsError}</Text>
      </View>
    );
  }

  if (!myActions || myActions.length === 0) {
    return (
      <View style={styles.centered}>
        <View style={styles.emptyStateIcon}>
          <FontAwesome5 name="history" size={26} color="#FFF" />
        </View>
        <Text style={styles.emptyText}>No transactions yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={myActions}
        keyExtractor={(item, index) => item.signature || `action-${index}`}
        renderItem={({ item }) => (
          <ActionItem
            action={item}
            onPress={() => setSelectedAction(item)}
            walletAddress={walletAddress}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <ActionDetailModal
        visible={selectedAction !== null}
        action={selectedAction}
        onClose={() => setSelectedAction(null)}
        walletAddress={walletAddress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F9FC',
  },
  emptyStateIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#9945FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#9945FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  emptyText: {
    marginTop: 8,
    fontSize: 16,
    color: '#6E7191',
    fontWeight: '500',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#F43860',
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginVertical: 6,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.05)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  txInfo: {
    flex: 1,
    marginRight: 8,
  },
  description: {
    fontSize: 15,
    fontWeight: '600',
    color: '#14142B',
    marginBottom: 4,
  },
  timeAgo: {
    fontSize: 13,
    color: '#6E7191',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
  },
  symbol: {
    fontSize: 13,
    color: '#6E7191',
    marginTop: 2,
  },
});

export default ActionsPage;
