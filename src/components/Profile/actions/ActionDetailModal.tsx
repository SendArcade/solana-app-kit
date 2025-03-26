import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Linking,
  TouchableOpacity,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { FontAwesome5 } from '@expo/vector-icons';
import { Action } from '../../../services/profileActions';

export interface ActionDetailModalProps {
  visible: boolean;
  action: Action | null;
  onClose: () => void;
  walletAddress?: string;
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
  } else if (label.includes('stake')) {
    return '#ff9800'; // Orange for staking
  } else if (label.includes('nft')) {
    return '#673ab7'; // Deep purple for NFTs
  }
  return '#607d8b'; // Default blue-gray for unknown actions
}

/**
 * Format lamports as SOL with appropriate decimal places.
 */
function formatSolAmount(lamports: number): string {
  return (lamports / 1_000_000_000).toFixed(4);
}

/**
 * Format date to a human-readable string.
 */
function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

/**
 * Truncate address for display
 */
function truncateAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return address.slice(0, 4) + '...' + address.slice(-4);
}

const ActionDetailModal: React.FC<ActionDetailModalProps> = ({
  visible,
  action,
  onClose,
  walletAddress,
}) => {
  const [showInstructions, setShowInstructions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showFromTooltip, setShowFromTooltip] = useState(false);
  const [showToTooltip, setShowToTooltip] = useState(false);
  const tooltipAnimation = useRef(new Animated.Value(0)).current;

  // Hide tooltip animation function - defined before useEffect
  const hideTooltip = () => {
    Animated.timing(tooltipAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowFromTooltip(false);
      setShowToTooltip(false);
    });
  };

  // Add effect to dismiss tooltip when user taps outside
  useEffect(() => {
    // Hide tooltip when modal is closed
    if (!visible) {
      hideTooltip();
    }
  }, [visible]);

  if (!action) return null;

  // Determine the action label using enriched type if available
  let actionType = action.enrichedType || action.transactionType || action.type || 'Transaction';

  // Prettier action type name for display
  if (actionType === 'SWAP') actionType = 'Swap';
  if (actionType === 'TRANSFER') actionType = 'Transfer';
  if (actionType === 'TOKEN_TRANSFER') actionType = 'Token Transfer';

  const accentColor = getActionColor(actionType);
  const signature = action.signature || '';
  const truncatedSignature = truncateAddress(signature);
  const fee = action.fee !== undefined ? formatSolAmount(action.fee) : '—';
  const date = action.timestamp ? formatDate(action.timestamp) : '—';
  const solscanURL = `https://solscan.io/tx/${signature}`;

  // Get transaction details - prefer enriched data if available
  let fromAddress = '';
  let toAddress = '';
  let amount = '';
  let symbol = 'SOL';
  let direction = 'neutral';
  let swapDetails = null;

  // Get the original address before truncation
  let originalFromAddress = '';
  let originalToAddress = '';

  if (action.enrichedData) {
    // Get details from enriched data
    if (action.enrichedType === 'SWAP') {
      const { swapType, inputSymbol, outputSymbol, inputAmount, outputAmount, direction: enrichedDirection } = action.enrichedData;

      swapDetails = {
        inputAmount: inputAmount?.toFixed(4) || '?',
        inputSymbol: inputSymbol || '?',
        outputAmount: outputAmount?.toFixed(4) || '?',
        outputSymbol: outputSymbol || '?',
        direction: enrichedDirection || 'neutral'
      };

      direction = enrichedDirection || 'neutral';
    }
    else if (action.enrichedType === 'TRANSFER' || action.enrichedType === 'TOKEN_TRANSFER') {
      const { transferType, amount: txAmount, tokenSymbol, counterparty, direction: enrichedDirection } = action.enrichedData;

      // For display in the transaction detail view
      amount = txAmount ?
        (transferType === 'SOL' ? txAmount.toFixed(4) : txAmount.toString()) :
        '?';
      symbol = transferType === 'SOL' ? 'SOL' : (tokenSymbol || 'tokens');
      direction = enrichedDirection || 'neutral';

      // Set from/to based on direction
      if (enrichedDirection === 'OUT' && walletAddress) {
        fromAddress = truncateAddress(walletAddress);
        originalFromAddress = walletAddress;
        toAddress = counterparty || '?';
        originalToAddress = counterparty || '?';
      } else if (enrichedDirection === 'IN' && walletAddress) {
        toAddress = truncateAddress(walletAddress);
        originalToAddress = walletAddress;
        fromAddress = counterparty || '?';
        originalFromAddress = counterparty || '?';
      }
    }
  }
  // Fall back to original implementation for non-enriched data
  else {
    if (action.nativeTransfers && action.nativeTransfers.length > 0) {
      const transfer = action.nativeTransfers[0];
      fromAddress = truncateAddress(transfer.fromUserAccount);
      originalFromAddress = transfer.fromUserAccount;
      toAddress = truncateAddress(transfer.toUserAccount);
      originalToAddress = transfer.toUserAccount;
      amount = formatSolAmount(transfer.amount);
      symbol = 'SOL';

      if (walletAddress) {
        if (transfer.fromUserAccount === walletAddress) {
          direction = 'out';
        } else if (transfer.toUserAccount === walletAddress) {
          direction = 'in';
        }
      }
    } else if (action.tokenTransfers && action.tokenTransfers.length > 0) {
      const transfer = action.tokenTransfers[0];
      fromAddress = truncateAddress(transfer.fromUserAccount);
      originalFromAddress = transfer.fromUserAccount;
      toAddress = truncateAddress(transfer.toUserAccount);
      originalToAddress = transfer.toUserAccount;
      amount = transfer.tokenAmount.toString();
      symbol = transfer.symbol || truncateAddress(transfer.mint);

      if (walletAddress) {
        if (transfer.fromUserAccount === walletAddress) {
          direction = 'out';
        } else if (transfer.toUserAccount === walletAddress) {
          direction = 'in';
        }
      }
    }

    // For swaps, get input and output details
    if (action.events?.swap) {
      const swap = action.events.swap;
      let inputAmount = '';
      let inputSymbol = '';
      let outputAmount = '';
      let outputSymbol = '';

      if (swap.nativeInput) {
        inputAmount = formatSolAmount(parseInt(String(swap.nativeInput.amount), 10));
        inputSymbol = 'SOL';
      } else if (swap.tokenInputs && swap.tokenInputs.length > 0) {
        const input = swap.tokenInputs[0];
        const decimals = parseInt(String(input.rawTokenAmount.decimals), 10);
        inputAmount = (parseFloat(input.rawTokenAmount.tokenAmount) / Math.pow(10, decimals)).toFixed(4);
        inputSymbol = truncateAddress(input.mint);
      }

      if (swap.nativeOutput) {
        outputAmount = formatSolAmount(parseInt(String(swap.nativeOutput.amount), 10));
        outputSymbol = 'SOL';
      } else if (swap.tokenOutputs && swap.tokenOutputs.length > 0) {
        const output = swap.tokenOutputs[0];
        const decimals = parseInt(String(output.rawTokenAmount.decimals), 10);
        outputAmount = (parseFloat(output.rawTokenAmount.tokenAmount) / Math.pow(10, decimals)).toFixed(4);
        outputSymbol = truncateAddress(output.mint);
      }

      if (inputAmount && outputAmount) {
        swapDetails = {
          inputAmount,
          inputSymbol,
          outputAmount,
          outputSymbol,
          direction: 'neutral'
        };
      }
    }
  }

  const copySignature = async () => {
    if (signature) {
      await Clipboard.setStringAsync(signature);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openSolscan = () => {
    Linking.openURL(solscanURL).catch(err =>
      console.error('Failed to open Solscan:', err),
    );
  };

  // Format direction for display
  const directionDisplay = direction === 'IN' || direction === 'in' ? 'Received' :
    direction === 'OUT' || direction === 'out' ? 'Sent' : '';

  // Set color based on direction
  const amountColor = direction === 'IN' || direction === 'in' ? '#14F195' :
    direction === 'OUT' || direction === 'out' ? '#F43860' : '#333';

  // Show tooltip animation
  const showTooltip = (tooltipType: 'from' | 'to') => {
    if (tooltipType === 'from') {
      setShowFromTooltip(true);
      setShowToTooltip(false);
    } else {
      setShowFromTooltip(false);
      setShowToTooltip(true);
    }

    Animated.timing(tooltipAnimation, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableWithoutFeedback onPress={hideTooltip}>
        <View style={modalStyles.overlay}>
          <TouchableWithoutFeedback>
            <View style={modalStyles.modalContainer}>
              {/* Draggable Handle */}
              <View style={modalStyles.handleBar} />

              {/* Header */}
              <View style={modalStyles.header}>
                <TouchableOpacity
                  style={modalStyles.closeButton}
                  onPress={onClose}
                  activeOpacity={0.7}>
                  <FontAwesome5 name="times" size={18} color="#666" />
                </TouchableOpacity>
                <Text style={modalStyles.headerTitle}>Transaction Details</Text>
              </View>

              <ScrollView
                style={modalStyles.content}
                showsVerticalScrollIndicator={false}>

                {/* Transaction Type Banner */}
                <View style={[modalStyles.typeBanner, { backgroundColor: `${accentColor}10` }]}>
                  <View style={[modalStyles.iconContainer, { backgroundColor: `${accentColor}20` }]}>
                    <FontAwesome5
                      name={actionType.toLowerCase().includes('transfer') ? 'exchange-alt'
                        : actionType.toLowerCase().includes('swap') ? 'sync-alt'
                          : 'receipt'}
                      size={16}
                      color={accentColor}
                    />
                  </View>
                  <View style={modalStyles.typeInfo}>
                    <Text style={[modalStyles.typeTitle, { color: accentColor }]}>
                      {actionType}
                    </Text>
                    <Text style={modalStyles.dateText}>{date}</Text>
                  </View>
                </View>

                {/* Transaction Amount for Transfers */}
                {direction !== 'neutral' && amount && (
                  <View style={modalStyles.amountContainer}>
                    <Text style={[
                      modalStyles.amountText,
                      { color: amountColor }
                    ]}>
                      {direction === 'IN' || direction === 'in' ? '+ ' : direction === 'OUT' || direction === 'out' ? '- ' : ''}{amount} {symbol}
                    </Text>
                    {directionDisplay && (
                      <Text style={modalStyles.directionLabel}>
                        {directionDisplay}
                      </Text>
                    )}
                  </View>
                )}

                {/* Swap Details */}
                {swapDetails && (
                  <View style={modalStyles.swapContainer}>
                    <View style={modalStyles.swapRow}>
                      <View style={modalStyles.swapAmount}>
                        <Text style={modalStyles.swapValue}>
                          {swapDetails.inputAmount} {swapDetails.inputSymbol}
                        </Text>
                        <Text style={modalStyles.swapLabel}>Paid</Text>
                      </View>
                      <View style={modalStyles.swapArrow}>
                        <FontAwesome5 name="arrow-right" size={14} color="#999" />
                      </View>
                      <View style={modalStyles.swapAmount}>
                        <Text style={modalStyles.swapValue}>
                          {swapDetails.outputAmount} {swapDetails.outputSymbol}
                        </Text>
                        <Text style={modalStyles.swapLabel}>Received</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Transaction Details */}
                <View style={modalStyles.detailsSection}>
                  <Text style={modalStyles.sectionTitle}>Details</Text>

                  {/* Fee */}
                  <View style={modalStyles.detailRow}>
                    <Text style={modalStyles.detailLabel}>Fee</Text>
                    <Text style={modalStyles.detailValue}>{fee} SOL</Text>
                  </View>

                  {/* From / To for transfers */}
                  {fromAddress && (
                    <View style={modalStyles.detailRow}>
                      <Text style={modalStyles.detailLabel}>From</Text>
                      <TouchableOpacity
                        onPressIn={() => showTooltip('from')}
                        onPressOut={hideTooltip}
                        activeOpacity={0.7}
                      >
                        <Text style={modalStyles.detailValue}>{fromAddress}</Text>

                        {showFromTooltip && (
                          <Animated.View
                            style={[
                              modalStyles.tooltip,
                              {
                                opacity: tooltipAnimation,
                                transform: [{
                                  translateY: tooltipAnimation.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [-5, 0],
                                  })
                                }]
                              }
                            ]}
                          >
                            <Text style={modalStyles.tooltipText}>{originalFromAddress}</Text>
                            <View style={modalStyles.tooltipArrow} />
                          </Animated.View>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}

                  {toAddress && (
                    <View style={modalStyles.detailRow}>
                      <Text style={modalStyles.detailLabel}>To</Text>
                      <TouchableOpacity
                        onPressIn={() => showTooltip('to')}
                        onPressOut={hideTooltip}
                        activeOpacity={0.7}
                      >
                        <Text style={modalStyles.detailValue}>{toAddress}</Text>

                        {showToTooltip && (
                          <Animated.View
                            style={[
                              modalStyles.tooltip,
                              {
                                opacity: tooltipAnimation,
                                transform: [{
                                  translateY: tooltipAnimation.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [-5, 0],
                                  })
                                }]
                              }
                            ]}
                          >
                            <Text style={modalStyles.tooltipText}>{originalToAddress}</Text>
                            <View style={modalStyles.tooltipArrow} />
                          </Animated.View>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Signature with copy button */}
                  <View style={modalStyles.detailRow}>
                    <Text style={modalStyles.detailLabel}>Signature</Text>
                    <View style={modalStyles.signatureContainer}>
                      <Text style={modalStyles.detailValue}>{truncatedSignature}</Text>
                      <TouchableOpacity
                        onPress={copySignature}
                        style={modalStyles.copyButton}>
                        <FontAwesome5
                          name={copied ? "check" : "copy"}
                          size={14}
                          color={copied ? "#4caf50" : "#1d9bf0"}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Slot */}
                  {action.slot && (
                    <View style={modalStyles.detailRow}>
                      <Text style={modalStyles.detailLabel}>Slot</Text>
                      <Text style={modalStyles.detailValue}>{action.slot}</Text>
                    </View>
                  )}
                </View>

                {/* View on Solscan Button */}
                <TouchableOpacity
                  onPress={openSolscan}
                  style={modalStyles.solscanButton}
                  activeOpacity={0.8}>
                  <FontAwesome5 name="external-link-alt" size={14} color="#1d9bf0" style={modalStyles.solscanIcon} />
                  <Text style={modalStyles.solscanText}>View on Solscan</Text>
                </TouchableOpacity>

                {/* Instructions Section */}
                {action.instructions && action.instructions.length > 0 && (
                  <View style={modalStyles.instructionsContainer}>
                    <View style={modalStyles.instructionHeader}>
                      <Text style={modalStyles.sectionTitle}>Instructions</Text>
                      <TouchableOpacity
                        onPress={() => setShowInstructions(!showInstructions)}
                        style={modalStyles.toggleButton}>
                        <Text style={modalStyles.toggleButtonText}>
                          {showInstructions ? 'Hide' : 'Show'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {showInstructions && (
                      <View style={modalStyles.instructionsList}>
                        {action.instructions.map((instr, idx) => (
                          <View key={idx} style={modalStyles.instructionItem}>
                            <Text style={modalStyles.instructionProgram}>
                              Program: {instr.programId || instr.program || 'Unknown'}
                            </Text>
                            <View style={modalStyles.instructionData}>
                              <Text style={modalStyles.instructionDataText}>
                                {JSON.stringify(instr.data || instr, null, 2)}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 30,
  },
  handleBar: {
    width: 40,
    height: 5,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    alignSelf: 'center',
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    left: 20,
    padding: 5,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    paddingHorizontal: 20,
  },
  typeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeInfo: {
    marginLeft: 12,
  },
  typeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 13,
    color: '#666',
  },
  amountContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  amountText: {
    fontSize: 24,
    fontWeight: '600',
  },
  swapContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  swapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  swapAmount: {
    alignItems: 'center',
    flex: 1,
  },
  swapValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  swapLabel: {
    fontSize: 12,
    color: '#888',
  },
  swapArrow: {
    marginHorizontal: 8,
  },
  detailsSection: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  signatureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  copyButton: {
    marginLeft: 8,
    padding: 6,
  },
  solscanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f7ff',
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 16,
  },
  solscanIcon: {
    marginRight: 8,
  },
  solscanText: {
    color: '#1d9bf0',
    fontWeight: '600',
    fontSize: 14,
  },
  instructionsContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  instructionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  toggleButton: {
    padding: 4,
  },
  toggleButtonText: {
    fontSize: 14,
    color: '#1d9bf0',
    fontWeight: '500',
  },
  instructionsList: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
  },
  instructionItem: {
    marginBottom: 12,
  },
  instructionProgram: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 4,
  },
  instructionData: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#eee',
  },
  instructionDataText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  directionLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  tooltip: {
    position: 'absolute',
    bottom: 30,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 6,
    padding: 8,
    zIndex: 1000,
    minWidth: 200,
    maxWidth: 280,
  },
  tooltipText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -8,
    right: 10,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(0,0,0,0.75)',
  },
});

export default ActionDetailModal;
