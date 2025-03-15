// File: src/components/Profile/slider/ActionsPage.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import ActionDetailModal from './ActionDetailModal';

export interface Action {
  signature?: string;
  slot?: number | string;
  transactionType?: string;
  type?: string; // fallback field
  instructions?: any[];
  description?: string;
  fee?: number;
  timestamp?: number;
  feePayer?: string;
  source?: string;
  events?: any[] | object;
  // ... add other properties if needed
}

interface ActionsPageProps {
  myActions: Action[];
  loadingActions?: boolean;
  fetchActionsError?: string | null;
}

/**
 * Returns an accent color based on the action label.
 */
function getActionColor(actionLabel: string): string {
  const label = actionLabel.toLowerCase();
  if (label.includes('transfer')) {
    return '#1d9bf0'; // Blue
  } else if (label.includes('swap')) {
    return '#9c27b0'; // Purple
  } else if (label.includes('buy')) {
    return '#4caf50'; // Green
  } else if (label.includes('sell')) {
    return '#f44336'; // Red
  }
  return '#607d8b'; // Default blue-gray
}

const styles = StyleSheet.create({
  centered: {
    paddingTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
  },
  errorText: {
    fontSize: 14,
    color: '#c00',
    marginTop: 10,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 12,
    flexDirection: 'column',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  actionLabel: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  description: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    width: 70,
    color: '#555',
  },
  infoValue: {
    fontSize: 11,
    color: '#777',
    flex: 1,
  },
});

const ActionItem: React.FC<{ action: Action; onPress: () => void }> = ({
  action,
  onPress,
}) => {
  // Determine the action label using transactionType, then type
  let actionLabel = action.transactionType || action.type || 'Unknown Action';
  if ((!actionLabel || actionLabel === 'Unknown Action') && action.instructions?.length) {
    const firstInstruction = action.instructions[0];
    if (
      firstInstruction.program === 'system' &&
      firstInstruction.parsed &&
      firstInstruction.parsed.type === 'transfer'
    ) {
      actionLabel = 'Transfer';
    } else if (
      firstInstruction.program === 'token-mill' &&
      firstInstruction.parsed &&
      firstInstruction.parsed.type === 'buy'
    ) {
      actionLabel = 'Buy';
    } else if (
      firstInstruction.program === 'token-mill' &&
      firstInstruction.parsed &&
      firstInstruction.parsed.type === 'sell'
    ) {
      actionLabel = 'Sell';
    }
  }
  
  const accentColor = getActionColor(actionLabel);
  const signature = action.signature || 'UnknownSignature';
  const truncatedSignature =
    signature.length > 16 ? signature.slice(0, 8) + "..." + signature.slice(-6) : signature;
  const slot = action.slot || '—';
  const description = action.description || '';
  const fee = action.fee !== undefined ? action.fee : null;
  
  let formattedTimestamp = '';
  if (action.timestamp) {
    const d = new Date(action.timestamp * 1000);
    formattedTimestamp = d.toLocaleString();
  }
  const source = action.source || '';

  return (
    <TouchableOpacity onPress={onPress}>
      <View style={[styles.card, { borderLeftColor: accentColor }]}>
        <Text style={[styles.actionLabel, { color: accentColor }]}>{actionLabel}</Text>
        {description ? (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        ) : null}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Signature:</Text>
          <Text style={styles.infoValue}>{truncatedSignature}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Slot:</Text>
          <Text style={styles.infoValue}>{slot}</Text>
        </View>
        {fee !== null && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fee:</Text>
            <Text style={styles.infoValue}>{fee}</Text>
          </View>
        )}
        {formattedTimestamp ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Time:</Text>
            <Text style={styles.infoValue}>{formattedTimestamp}</Text>
          </View>
        ) : null}
        {source ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Source:</Text>
            <Text style={styles.infoValue}>{source}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
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
        <ActivityIndicator size="large" color="#1d9bf0" />
        <Text style={styles.emptyText}>Loading actions...</Text>
      </View>
    );
  }

  if (fetchActionsError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error: {fetchActionsError}</Text>
      </View>
    );
  }

  if (!myActions || myActions.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No actions yet.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={myActions}
        keyExtractor={(_, index) => String(index)}
        renderItem={({ item }) => (
          <ActionItem action={item} onPress={() => setSelectedAction(item)} />
        )}
        contentContainerStyle={{ paddingHorizontal: 10, paddingVertical: 12 }}
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
