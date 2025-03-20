import React, {useState} from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Pressable,
} from 'react-native';
import ActionDetailModal from './ActionDetailModal';

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
  // Optional name or symbol field if provided by your API
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
  nativeInput?: {account: string; amount: string};
  nativeOutput?: {account: string; amount: string};
  nativeFees?: Array<{account: string; amount: string}>;
  innerSwaps?: any[];
}

interface TransactionEvents {
  nft?: any;
  swap?: SwapEvent;
  compressed?: any;
  distributeCompressionRewards?: {amount: number};
  setAuthority?: any;
}

export interface Action {
  signature?: string;
  slot?: number | string;
  transactionType?: string;
  type?: string;
  instructions?: any[];
  description?: string;
  fee?: number;
  timestamp?: number; // in seconds
  feePayer?: string;
  source?: string;
  events?: TransactionEvents;
  amount?: number;
  tokenTransfers?: TokenTransfer[];
  nativeTransfers?: NativeTransfer[];
}

interface ActionsPageProps {
  myActions: Action[];
  loadingActions?: boolean;
  fetchActionsError?: string | null;
}

/** Get color for the action label. */
function getActionColor(label: string): string {
  const lower = label.toLowerCase();
  if (lower.includes('transfer')) return '#1d9bf0';
  if (lower.includes('swap')) return '#9c27b0';
  if (lower.includes('buy')) return '#4caf50';
  if (lower.includes('sell')) return '#f44336';
  return '#607d8b';
}

/** Positive => green, negative => red, else default. */
function getAmountColor(amount: number): string {
  if (amount > 0) return '#4caf50';
  if (amount < 0) return '#f44336';
  return '#333';
}

/** Format lamports as SOL. */
function formatSolAmount(lamports: number): string {
  return (lamports / 1_000_000_000).toFixed(4);
}

/** Format token amounts. */
function formatTokenAmount(amount: number, decimals: number = 0): string {
  if (decimals === 0) {
    return amount.toString();
  }
  const divisor = Math.pow(10, decimals);
  return (amount / divisor).toFixed(Math.min(decimals, 4));
}

/** Truncate addresses: abcd...wxyz. */
function truncateAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return address.slice(0, 4) + '...' + address.slice(-4);
}

/** Time-ago formatting. */
function getTimeAgo(timestampSeconds: number): string {
  const nowMs = Date.now();
  const txMs = timestampSeconds * 1000;
  const diff = nowMs - txMs;
  if (diff < 0) return 'just now';

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds} sec ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mo ago`;
  const years = Math.floor(months / 12);
  return `${years} yr ago`;
}

/**
 * Find best "amount" data from multiple fields.
 * Also tries to find a "token name" from tokenTransfers.
 */
function getDisplayAmount(action: Action) {
  let amount = 0;
  let decimals = 9; // default for SOL
  let fallbackMintOrSymbol = 'SOL';
  let tokenNameOrSymbol = '';

  // 1) If top-level amount is set
  if (typeof action.amount === 'number') {
    amount = action.amount;
  }
  // 2) events.nft.amount
  else if (action.events?.nft?.amount) {
    amount = action.events.nft.amount;
  }
  // 3) events.swap.nativeInput?.amount
  else if (action.events?.swap?.nativeInput?.amount) {
    const parsed = parseInt(action.events.swap.nativeInput.amount, 10);
    if (!isNaN(parsed)) amount = parsed;
  }
  // 4) events.distributeCompressionRewards.amount
  else if (action.events?.distributeCompressionRewards?.amount) {
    amount = action.events.distributeCompressionRewards.amount;
  }
  // 5) tokenTransfers
  else if (action.tokenTransfers && action.tokenTransfers.length > 0) {
    amount = action.tokenTransfers[0].tokenAmount;
    decimals = 0; // you may want to refine if your tokens have known decimals
    fallbackMintOrSymbol = truncateAddress(action.tokenTransfers[0].mint);

    // If the API provides a tokenName or symbol
    if (action.tokenTransfers[0].tokenName) {
      tokenNameOrSymbol = action.tokenTransfers[0].tokenName;
    } else if (action.tokenTransfers[0].symbol) {
      tokenNameOrSymbol = action.tokenTransfers[0].symbol;
    }
  }
  // 6) nativeTransfers
  else if (action.nativeTransfers && action.nativeTransfers.length > 0) {
    amount = action.nativeTransfers[0].amount;
  }

  // Decide if it's SOL or a token
  const isSol = amount !== 0 && decimals === 9 && !tokenNameOrSymbol;
  const name = isSol ? 'SOL' : tokenNameOrSymbol || fallbackMintOrSymbol;

  return {amount, decimals, tokenNameOrSymbol: name};
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 15,
    color: '#888',
  },
  errorText: {
    marginTop: 8,
    fontSize: 15,
    color: '#c00',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginVertical: 6,
    marginHorizontal: 2,
    borderLeftWidth: 4,
    // We'll dynamically set border color
    // Minimal shadow
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  timeAgo: {
    fontSize: 12,
    color: '#999',
  },
  signature: {
    marginTop: 4,
    fontSize: 12,
    color: '#aaa',
  },
  amountContainer: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

const ActionItem: React.FC<{
  action: Action;
  onPress: () => void;
}> = ({action, onPress}) => {
  // Determine action label
  let actionLabel = action.transactionType || action.type || 'Unknown Action';
  if (
    (!actionLabel || actionLabel === 'Unknown Action') &&
    action.instructions?.length
  ) {
    const first = action.instructions[0];
    if (first.program === 'system' && first.parsed?.type === 'transfer') {
      actionLabel = 'Transfer';
    } else if (first.program === 'token-mill' && first.parsed?.type === 'buy') {
      actionLabel = 'Buy';
    } else if (
      first.program === 'token-mill' &&
      first.parsed?.type === 'sell'
    ) {
      actionLabel = 'Sell';
    }
  }

  // Accent color
  const accentColor = getActionColor(actionLabel);

  // Signature (truncated)
  const sig = action.signature || 'UnknownSignature';
  const truncatedSig =
    sig.length > 16 ? `${sig.slice(0, 8)}...${sig.slice(-6)}` : sig;

  // Time ago
  const timeAgo = action.timestamp ? getTimeAgo(action.timestamp) : 'N/A';

  // Amount
  const {amount, decimals, tokenNameOrSymbol} = getDisplayAmount(action);
  // If it's SOL, format as SOL; otherwise, format as token
  const isSol = tokenNameOrSymbol === 'SOL';
  const formatted = isSol
    ? formatSolAmount(amount)
    : formatTokenAmount(amount, decimals);

  // Color for positive/negative
  const amtColor = getAmountColor(amount);

  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [{opacity: pressed ? 0.8 : 1}]}>
      <View style={[styles.card, {borderLeftColor: accentColor}]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.actionLabel, {color: accentColor}]}>
            {actionLabel}
          </Text>
          <Text style={styles.timeAgo}>{timeAgo}</Text>
        </View>
        <Text style={styles.signature}>{truncatedSig}</Text>
        {/* Amount row */}
        <View style={styles.amountContainer}>
          <Text style={[styles.amountText, {color: amtColor}]}>
            {formatted} {tokenNameOrSymbol}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

const ActionsPage: React.FC<ActionsPageProps> = ({
  myActions,
  loadingActions,
  fetchActionsError,
}) => {
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);

  if (loadingActions) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#999" />
        <Text style={styles.emptyText}>Loading actions...</Text>
      </View>
    );
  }

  if (fetchActionsError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{fetchActionsError}</Text>
      </View>
    );
  }

  if (!myActions || myActions.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No actions found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={myActions}
        keyExtractor={(_, i) => String(i)}
        renderItem={({item}) => (
          <ActionItem action={item} onPress={() => setSelectedAction(item)} />
        )}
        contentContainerStyle={styles.listContent}
      />

      <ActionDetailModal
        visible={selectedAction !== null}
        action={selectedAction}
        onClose={() => setSelectedAction(null)}
      />
    </View>
  );
};

export default ActionsPage;
