import React, {useState} from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Linking,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';

export interface Action {
  signature?: string;
  slot?: number | string;
  transactionType?: string;
  type?: string;
  instructions?: any[];
  description?: string;
  fee?: number;
  timestamp?: number;
  feePayer?: string;
  source?: string;
  events?: any[] | object;
}

export interface ActionDetailModalProps {
  visible: boolean;
  action: Action | null;
  onClose: () => void;
}

/**
 * Returns an accent color based on the action label.
 */
function getActionColor(actionLabel: string): string {
  const label = actionLabel.toLowerCase();
  if (label.includes('transfer')) {
    return '#1d9bf0'; // Blue for transfers
  } else if (label.includes('swap')) {
    return '#9c27b0'; // Purple for swaps
  } else if (label.includes('buy')) {
    return '#4caf50'; // Green for buys
  } else if (label.includes('sell')) {
    return '#f44336'; // Red for sells
  }
  return '#607d8b'; // Default blue-gray for unknown actions
}

const ActionDetailModal: React.FC<ActionDetailModalProps> = ({
  visible,
  action,
  onClose,
}) => {
  const [showInstructions, setShowInstructions] = useState(false);

  if (!action) return null;

  // Determine the action label.
  let actionLabel = action.transactionType || action.type || 'Unknown Action';
  if (
    (!actionLabel || actionLabel === 'Unknown Action') &&
    action.instructions?.length
  ) {
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
    signature.length > 16
      ? signature.slice(0, 8) + '...' + signature.slice(-6)
      : signature;
  const slot = action.slot || '—';
  const description = action.description || 'No description available.';
  const fee = action.fee !== undefined ? action.fee : 'N/A';

  // Format timestamp into separate date and time strings.
  let formattedDate = 'N/A';
  let formattedTime = 'N/A';
  if (action.timestamp) {
    const d = new Date(action.timestamp * 1000);
    formattedDate = d.toLocaleDateString();
    formattedTime = d.toLocaleTimeString();
  }

  const solscanURL = `https://solscan.io/tx/${signature}`;

  const copySignature = () => {
    Clipboard.setString(signature);
  };

  const openSolscan = () => {
    Linking.openURL(solscanURL).catch(err =>
      console.error('Failed to open Solscan:', err),
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.modalContainer}>
          {/* Draggable Handle */}
          <View style={modalStyles.handleBar} />
          {/* Header */}
          <View style={modalStyles.header}>
            <Text style={modalStyles.headerTitle}>Transaction Details</Text>
            <Pressable
              onPress={onClose}
              style={({pressed}) => [{opacity: pressed ? 0.7 : 1}]}>
              <Text style={modalStyles.closeText}>✕</Text>
            </Pressable>
          </View>
          <ScrollView
            style={modalStyles.content}
            showsVerticalScrollIndicator={false}>
            {/* Basic Details */}
            <View style={modalStyles.detailRow}>
              <Text style={modalStyles.detailLabel}>Type:</Text>
              <Text style={[modalStyles.detailValue, {color: accentColor}]}>
                {actionLabel}
              </Text>
            </View>
            <View style={modalStyles.detailRow}>
              <Text style={modalStyles.detailLabel}>Description:</Text>
              <Text style={modalStyles.detailValue}>{description}</Text>
            </View>
            {/* Signature Row with copy functionality */}
            <View style={modalStyles.detailRow}>
              <Text style={modalStyles.detailLabel}>Signature:</Text>
              <Pressable onPress={copySignature} style={modalStyles.copyButton}>
                <Text style={modalStyles.copyButtonText}>Copy</Text>
              </Pressable>
              <Text style={modalStyles.detailValue}>{truncatedSignature}</Text>
            </View>
            {/* Solscan Button */}
            <Pressable
              onPress={openSolscan}
              style={({pressed}) => [
                modalStyles.solscanButton,
                {opacity: pressed ? 0.8 : 1},
              ]}>
              <Text style={modalStyles.solscanButtonText}>View on Solscan</Text>
            </Pressable>
            <View style={modalStyles.detailRow}>
              <Text style={modalStyles.detailLabel}>Slot:</Text>
              <Text style={modalStyles.detailValue}>{slot}</Text>
            </View>
            <View style={modalStyles.detailRow}>
              <Text style={modalStyles.detailLabel}>Fee:</Text>
              <Text style={modalStyles.detailValue}>{fee}</Text>
            </View>
            <View style={modalStyles.detailRow}>
              <Text style={modalStyles.detailLabel}>Date:</Text>
              <Text style={modalStyles.detailValue}>{formattedDate}</Text>
            </View>
            <View style={modalStyles.detailRow}>
              <Text style={modalStyles.detailLabel}>Time:</Text>
              <Text style={modalStyles.detailValue}>{formattedTime}</Text>
            </View>
            {action.feePayer && (
              <View style={modalStyles.detailRow}>
                <Text style={modalStyles.detailLabel}>Fee Payer:</Text>
                <Text style={modalStyles.detailValue}>{action.feePayer}</Text>
              </View>
            )}
            {action.source && (
              <View style={modalStyles.detailRow}>
                <Text style={modalStyles.detailLabel}>Source:</Text>
                <Text style={modalStyles.detailValue}>{action.source}</Text>
              </View>
            )}
            {/* Instructions Dropdown */}
            {action.instructions && action.instructions.length > 0 && (
              <View style={modalStyles.instructionsContainer}>
                <Text style={modalStyles.sectionTitle}>Instructions</Text>
                {showInstructions ? (
                  action.instructions.map((instr, idx) => (
                    <View key={idx} style={modalStyles.instructionBox}>
                      <Text style={modalStyles.instructionText}>
                        {JSON.stringify(instr, null, 2)}
                      </Text>
                    </View>
                  ))
                ) : (
                  <View style={modalStyles.instructionBox}>
                    <Text style={modalStyles.instructionText}>
                      {JSON.stringify(action.instructions[0]).slice(0, 100)}...
                    </Text>
                  </View>
                )}
                <Pressable
                  onPress={() => setShowInstructions(!showInstructions)}
                  style={modalStyles.toggleButton}>
                  <Text style={modalStyles.toggleButtonText}>
                    {showInstructions ? 'Show Less' : 'Show More'}
                  </Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 20,
  },
  handleBar: {
    width: 40,
    height: 5,
    backgroundColor: '#ccc',
    borderRadius: 3,
    alignSelf: 'center',
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  closeText: {
    fontSize: 24,
    color: '#888',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontWeight: '600',
    width: 100,
    color: '#555',
  },
  detailValue: {
    flex: 1,
    color: '#333',
    fontSize: 14,
  },
  copyButton: {
    marginRight: 8,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  copyButtonText: {
    fontSize: 12,
    color: '#1d9bf0',
    fontWeight: '600',
  },
  solscanButton: {
    backgroundColor: '#e8f4fd',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginVertical: 10,
  },
  solscanButtonText: {
    color: '#1d9bf0',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  instructionsContainer: {
    marginTop: 16,
  },
  instructionBox: {
    backgroundColor: '#f7f7f7',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  instructionText: {
    fontSize: 12,
    color: '#555',
  },
  toggleButton: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  toggleButtonText: {
    fontSize: 12,
    color: '#1d9bf0',
    fontWeight: '600',
  },
});

export default ActionDetailModal;
