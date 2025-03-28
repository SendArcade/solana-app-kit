// File: src/components/AddButton/AddButton.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { styles } from './addButton.style';
import Icons from '../../../assets/svgs/index';
import { useAppSelector, useAppDispatch } from '../../../hooks/useReduxHooks';
import { Cluster, Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';
import { sendSOL } from '../../../utils/transactions/transactionUtils';
import { useWallet } from '../../../hooks/useWallet';
import {
  setSelectedFeeTier as setFeeTier,
  setTransactionMode as setMode
} from '../../../state/transaction/reducer';
import { CLUSTER } from '@env';
import { TransactionService } from '../../../services/transaction/transactionService';

export interface AddButtonProps {
  amIFollowing: boolean;
  areTheyFollowingMe: boolean;
  onPressFollow: () => void;
  onPressUnfollow: () => void;
  onSendToWallet?: () => void;
  recipientAddress: string;
}

const AddButton: React.FC<AddButtonProps> = ({
  amIFollowing,
  areTheyFollowingMe,
  onPressFollow,
  onPressUnfollow,
  onSendToWallet,
  recipientAddress,
}) => {
  const dispatch = useAppDispatch();
  const [sendModalVisible, setSendModalVisible] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'jito' | 'priority' | null>(
    null,
  );
  const [selectedFeeTier, setSelectedFeeTier] = useState<
    'low' | 'medium' | 'high' | 'very-high'
  >('low');
  const [amountSol, setAmountSol] = useState('');
  const [transactionStatus, setTransactionStatus] = useState<string | null>(null);

  // Add a ref to modal components with initial null value
  const modalRef = useRef<View | null>(null);

  // Get the current auth state and transaction settings
  const currentProvider = useAppSelector(state => state.auth.provider);
  const transactionState = useAppSelector(state => state.transaction);

  // Use the wallet from useWallet - now it will work correctly with MWA
  const { wallet, address, isMWA } = useWallet();

  // Initialize modal state with Redux state when opened
  useEffect(() => {
    if (sendModalVisible) {
      setSelectedMode(transactionState.transactionMode);
      setSelectedFeeTier(transactionState.selectedFeeTier);
      setTransactionStatus(null);
    }
  }, [sendModalVisible, transactionState]);

  let followLabel = 'Follow';
  if (amIFollowing) {
    followLabel = 'Following';
  } else if (!amIFollowing && areTheyFollowingMe) {
    followLabel = 'Follow Back';
  }

  const handlePressFollowButton = () => {
    if (amIFollowing) {
      onPressUnfollow();
    } else {
      onPressFollow();
    }
  };

  const handlePressSendToWallet = () => {
    // Only show the modal if we have a valid recipient address
    if (!recipientAddress) {
      Alert.alert('Error', 'No recipient address available');
      return;
    }

    if (onSendToWallet) {
      onSendToWallet();
    }

    setSendModalVisible(true);
  };

  const handleSendTransaction = async () => {
    try {
      if (!selectedMode) {
        Alert.alert('Error', "Please select 'Priority' or 'Jito' first.");
        return;
      }
      if (!recipientAddress || !amountSol) {
        Alert.alert('Error', 'Please provide recipient address and amount.');
        return;
      }
      const parsedAmount = parseFloat(amountSol);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        Alert.alert('Error', 'Invalid SOL amount.');
        return;
      }

      if (!wallet) {
        Alert.alert('Error', 'Wallet not connected');
        return;
      }

      // Update the Redux state with the selections from the modal
      if (selectedMode) {
        dispatch(setMode(selectedMode));

        if (selectedMode === 'priority' && selectedFeeTier) {
          dispatch(setFeeTier(selectedFeeTier));
        }
      }

      // Create connection to Solana
      const connection = new Connection(clusterApiUrl(CLUSTER as Cluster), 'confirmed');

      // Set initial status
      setTransactionStatus('Preparing transaction...');

      // Use our centralized sendSOL function for both MWA and non-MWA wallets
      // The function now handles the MWA case internally
      const signature = await sendSOL({
        wallet,
        recipientAddress,
        amountSol: parsedAmount,
        connection,
        onStatusUpdate: (status) => {
          // Only update status if it's not an error message
          if (!status.startsWith('Error:')) {
            console.log(`[AddButton] ${status}`);
            setTransactionStatus(status);
          } else {
            // For errors, just set a generic message
            setTransactionStatus('Transaction failed');
          }
        },
      });

      // Success, transaction was sent and confirmed
      setTransactionStatus(`Transaction successful! Signature: ${signature.slice(0, 8)}...`);

      // Use TransactionService instead of Alert
      TransactionService.showSuccess(signature, 'transfer');

      setTimeout(() => {
        setSendModalVisible(false);
        setSelectedMode(null);
        setAmountSol('');
        setTransactionStatus(null);
      }, 2000);
    } catch (err: any) {
      console.error('Error sending transaction:', err);

      // Don't set the raw error message, just use a generic one
      setTransactionStatus('Transaction failed');

      // Use TransactionService instead of Alert for the detailed error
      TransactionService.showError(err);

      setTimeout(() => {
        setSendModalVisible(false);
        setTransactionStatus(null);
      }, 2000);
    }
  };

  // Only render the send to wallet button if provider supports it
  const showSendToWalletButton = currentProvider === 'privy' ||
    currentProvider === 'dynamic' ||
    currentProvider === 'mwa';

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.btn} onPress={handlePressFollowButton}>
        <Text style={styles.text}>{followLabel}</Text>
      </TouchableOpacity>

      {showSendToWalletButton && (
        <TouchableOpacity style={styles.btn} onPress={handlePressSendToWallet}>
          <Text style={styles.text}>Send to Wallet</Text>
        </TouchableOpacity>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={sendModalVisible}
        onRequestClose={() => setSendModalVisible(false)}
      >
        <View
          style={modalOverlayStyles.overlay}
          ref={modalRef}
        >
          <View style={modalOverlayStyles.container}>
            <Text style={modalOverlayStyles.title}>Send SOL</Text>

            <View style={modalOverlayStyles.modeContainer}>
              <Text style={modalOverlayStyles.sectionTitle}>Select Mode:</Text>
              <View style={modalOverlayStyles.buttonRow}>
                <TouchableOpacity
                  style={[
                    modalOverlayStyles.modeButton,
                    selectedMode === 'priority' && modalOverlayStyles.selectedBtn,
                  ]}
                  onPress={() => setSelectedMode('priority')}
                >
                  <Text
                    style={[
                      modalOverlayStyles.modeButtonText,
                      selectedMode === 'priority' &&
                      modalOverlayStyles.selectedBtnText,
                    ]}
                  >
                    Priority
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    modalOverlayStyles.modeButton,
                    selectedMode === 'jito' && modalOverlayStyles.selectedBtn,
                  ]}
                  onPress={() => setSelectedMode('jito')}
                >
                  <Text
                    style={[
                      modalOverlayStyles.modeButtonText,
                      selectedMode === 'jito' && modalOverlayStyles.selectedBtnText,
                    ]}
                  >
                    Jito
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {selectedMode === 'priority' && (
              <View style={modalOverlayStyles.tierContainer}>
                <Text style={modalOverlayStyles.sectionTitle}>
                  Priority Fee Tier:
                </Text>
                <View style={modalOverlayStyles.buttonRow}>
                  {(['low', 'medium', 'high', 'very-high'] as const).map(tier => (
                    <TouchableOpacity
                      key={tier}
                      style={[
                        modalOverlayStyles.tierButton,
                        selectedFeeTier === tier && modalOverlayStyles.selectedBtn,
                      ]}
                      onPress={() => setSelectedFeeTier(tier)}
                    >
                      <Text
                        style={[
                          modalOverlayStyles.tierButtonText,
                          selectedFeeTier === tier &&
                          modalOverlayStyles.selectedBtnText,
                        ]}
                      >
                        {tier}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={modalOverlayStyles.inputContainer}>
              <Text style={modalOverlayStyles.label}>Amount (SOL)</Text>
              <TextInput
                style={modalOverlayStyles.input}
                value={amountSol}
                onChangeText={setAmountSol}
                keyboardType="numeric"
                placeholder="e.g. 0.25"
              />
            </View>

            {transactionStatus && (
              <View style={modalOverlayStyles.statusContainer}>
                <Text style={modalOverlayStyles.statusText}>{transactionStatus}</Text>
              </View>
            )}

            <View style={modalOverlayStyles.buttonRow}>
              <TouchableOpacity
                style={[modalOverlayStyles.modalButton, { backgroundColor: '#ccc' }]}
                onPress={() => setSendModalVisible(false)}
                disabled={!!transactionStatus && !transactionStatus.includes('Error')}
              >
                <Text style={modalOverlayStyles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  modalOverlayStyles.modalButton,
                  { backgroundColor: '#1d9bf0' },
                  !!transactionStatus && { opacity: 0.5 }
                ]}
                onPress={handleSendTransaction}
                disabled={!!transactionStatus}
              >
                <Text style={modalOverlayStyles.modalButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AddButton;

const modalOverlayStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  modeContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 8,
    rowGap: 8,
  },
  modeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  modeButtonText: {
    color: '#333',
  },
  selectedBtn: {
    backgroundColor: '#1d9bf0',
  },
  selectedBtnText: {
    color: '#fff',
  },
  tierContainer: {
    marginBottom: 16,
  },
  tierButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  tierButtonText: {
    color: '#333',
  },
  inputContainer: {
    marginBottom: 16,
  },
  statusContainer: {
    backgroundColor: '#f8f8f8',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  statusText: {
    color: '#333',
    fontSize: 14,
    textAlign: 'center',
  },
  label: {
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 4,
    fontSize: 13,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 16,
    marginHorizontal: 4,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
