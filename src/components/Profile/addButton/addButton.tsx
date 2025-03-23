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

  // Add a ref to modal components with initial null value
  const modalRef = useRef<View | null>(null);

  // Get the current auth state and transaction settings
  const currentProvider = useAppSelector(state => state.auth.provider);
  const transactionState = useAppSelector(state => state.transaction);

  // Use the wallet from useWallet - now it will work correctly with MWA
  const { wallet, address, isMWA } = useWallet();
  console.log('Wallet:', wallet);

  // Initialize modal state with Redux state when opened
  useEffect(() => {
    if (sendModalVisible) {
      setSelectedMode(transactionState.transactionMode);
      setSelectedFeeTier(transactionState.selectedFeeTier);
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

      // For MWA we need to handle transactions differently
      if (isMWA()) {
        Alert.alert(
          'Send Transaction',
          `This will open your external wallet app to send ${parsedAmount} SOL to ${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}`,
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Continue',
              onPress: async () => {
                try {
                  // Here we'd normally integrate with MWA transaction signing
                  // For this example, just show how we'd do it
                  console.log(`Would send ${parsedAmount} SOL from ${address} to ${recipientAddress}`);

                  // Close the modal
                  setSendModalVisible(false);
                  setSelectedMode(null);
                  setAmountSol('');

                  Alert.alert(
                    'External Transaction',
                    'Please complete the transaction in your wallet app'
                  );
                } catch (err: any) {
                  console.error('Error preparing MWA transaction:', err);
                  Alert.alert('Transaction Preparation Failed', err.message || String(err));
                }
              }
            }
          ]
        );
        return;
      }

      // Use our centralized sendSOL function for non-MWA wallets
      const signature = await sendSOL({
        wallet,
        recipientAddress,
        amountSol: parsedAmount,
        connection,
        onStatusUpdate: (status) => console.log(`[AddButton] ${status}`),
      });

      Alert.alert('Success', 'Transaction sent!');
      setSendModalVisible(false);
      setSelectedMode(null);
      setAmountSol('');
    } catch (err: any) {
      console.error('Error sending transaction:', err);
      Alert.alert('Transaction Failed', err.message || String(err));
      // Close the modal on error too
      setSendModalVisible(false);
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

            <View style={modalOverlayStyles.buttonRow}>
              <TouchableOpacity
                style={[modalOverlayStyles.modalButton, { backgroundColor: '#ccc' }]}
                onPress={() => setSendModalVisible(false)}
              >
                <Text style={modalOverlayStyles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[modalOverlayStyles.modalButton, { backgroundColor: '#1d9bf0' }]}
                onPress={handleSendTransaction}
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
