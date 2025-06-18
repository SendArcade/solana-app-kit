import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { Connection } from '@solana/web3.js';
import { HELIUS_STAKED_URL, SERVER_URL } from '@env';
import { useWallet } from '@/modules/wallet-providers/hooks/useWallet';
import COLORS from '@/assets/colors';
import Icons from '@/assets/svgs';

const connection = new Connection(
  HELIUS_STAKED_URL || 'https://api.mainnet-beta.solana.com',
  'confirmed'
);

const LuloRebalancingYieldCard = () => {
  const { address, connected, sendBase64Transaction } = useWallet();
  const [modalContent, setModalContent] = useState<'hidden' | 'details' | 'amount' | 'pending_list'>('hidden');
  const [isProcessingTransaction, setIsProcessingTransaction] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lulo data states
  const [luloApy, setLuloApy] = useState<{
    regular: {
      CURRENT: number;
      '1HR': number;
      '1YR': number;
      '24HR': number;
      '30DAY': number;
      '7DAY': number;
    };
    protected: {
      CURRENT: number;
      '1HR': number;
      '1YR': number;
      '24HR': number;
      '30DAY': number;
      '7DAY': number;
    };
  } | null>(null);
  const [luloBalance, setLuloBalance] = useState<number>(0);
  const [luloLoading, setLuloLoading] = useState(false);
  const mountedRef = useRef(true);
  const [modalType, setModalType] = useState<'deposit' | 'withdraw' | null>(null);
  const [amount, setAmount] = useState('');
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);
  const [autoCompleteAlertShown, setAutoCompleteAlertShown] = useState(false);

  const fetchPendingWithdrawals = useCallback(async () => {
    if (!address) return;
    try {
      const url = `${SERVER_URL}/api/lulo/pending-withdrawals/${address}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && Array.isArray(json.withdrawals)) {
        setPendingWithdrawals(json.withdrawals);
      } else {
        setPendingWithdrawals([]);
      }
    } catch (e) {
      setPendingWithdrawals([]);
    }
  }, [address]);

  // Fetch Lulo data
  const fetchLuloData = useCallback(async () => {
    if (!address) return;
    setLuloLoading(true);
    setError(null);
    try {
      const apyRes = await fetch(`${SERVER_URL}/api/lulo/apy`);
      const apyJson = await apyRes.json();
      if (apyJson.success) setLuloApy(apyJson.apy);

      const balRes = await fetch(`${SERVER_URL}/api/lulo/balance/${address}`);
      const balJson = await balRes.json();
      if (balJson.success) setLuloBalance(balJson.balance?.totalUsdValue ?? 0);
    } catch (e) {
      setError('Failed to fetch Lulo data.');
    } finally {
      setLuloLoading(false);
    }
  }, [address]);

  // Handle deposit
  const handleDeposit = async () => {
    console.log('handleDeposit function called with amount:', amount);

    const depositValue = parseFloat(amount);
    if (!address || !amount || isNaN(depositValue) || depositValue <= 0) {
      console.log('Exiting handleDeposit: invalid amount or no address.', { address, amount, depositValue });
      setError('Please enter a valid deposit amount.');
      return;
    }

    if (!connected) {
      console.log('Exiting handleDeposit: wallet not connected.');
      setError('Please connect your wallet first.');
      return;
    }

    console.log('Proceeding with deposit...');
    setIsProcessingTransaction(true);
    setError(null);
    try {
      console.log('Fetching transaction from server...');
      const res = await fetch(`${SERVER_URL}/api/lulo/lend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userPublicKey: address, amount: depositValue })
      });

      if (!mountedRef.current) return;
      console.log('Received response from server.');
      const data = await res.json();
      console.log('Server response data:', data);

      if (!data.success || !data.transaction) {
        throw new Error(data.error || 'Failed to get transaction for deposit');
      }

      console.log('Awaiting transaction signature from wallet...');
      // Send transaction with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Transaction approval timed out. Please try again.')), 30000)
      );

      const transactionPromise = sendBase64Transaction(data.transaction, connection);
      await Promise.race([transactionPromise, timeoutPromise]);
      
      if (!mountedRef.current) return;
      console.log('Transaction sent successfully.');

      // Update UI
      await fetchLuloData();
      setModalContent('details'); // Go back to details view
      setAmount('');
      setError(null);
      Alert.alert('Success', 'Your deposit has been processed successfully.');
    } catch (e) {
      console.error('Deposit error:', e);
      if (mountedRef.current) {
        if (e instanceof Error) {
          if (e.message.includes('timeout')) {
            setError('Transaction approval timed out. Please try again and make sure to approve the transaction in your wallet.');
          } else if (e.message.includes('wallets:connect')) {
            setError('Wallet connection lost. Please reconnect your wallet and try again.');
          } else {
            setError(e.message || 'Deposit failed. Please try again.');
          }
        } else {
          setError('An unknown error occurred during deposit. Please try again.');
        }
      }
    } finally {
      if (mountedRef.current) {
        setIsProcessingTransaction(false);
      }
    }
  };

  const handleInitiateWithdraw = async () => {
    const withdrawValue = parseFloat(amount);
    if (!address || !amount || isNaN(withdrawValue) || withdrawValue <= 0) {
      setError('Please enter a valid withdrawal amount.');
      return;
    }
    if (withdrawValue < 1) {
      setError('Withdrawal amount must be at least 1 USDC.');
      return;
    }

    setIsProcessingTransaction(true);
    setError(null);
    try {
      console.log('Fetching transaction from server for withdrawal initiation...');
      const res1 = await fetch(`${SERVER_URL}/api/lulo/initiate-withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userPublicKey: address, amount: withdrawValue })
      });

      if (!mountedRef.current) return;
      console.log('Received response from server.');
      const data1 = await res1.json();
      console.log('Server response data:', data1);
      
      if (!data1.success || !data1.transaction) {
        throw new Error(data1.error || 'Failed to get transaction for initiate withdraw');
      }

      console.log('Awaiting transaction signature from wallet for withdrawal initiation...');
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Transaction approval timed out. Please try again.')), 30000)
      );

      const transactionPromise = sendBase64Transaction(data1.transaction, connection);
      await Promise.race([transactionPromise, timeoutPromise]);
      if (!mountedRef.current) return;
      console.log('Withdrawal initiation transaction sent successfully.');

      // Update UI
      await fetchLuloData();
      await fetchPendingWithdrawals();
      setModalContent('details'); // Go back to details
      setAmount('');
      setError(null);
      Alert.alert('Success', 'Your withdrawal has been initiated. You must wait 24 hours to complete it.');
    } catch (e: any) {
      console.error('Withdraw initiation error:', e);
      if (mountedRef.current) {
        if (e.message.includes('timeout')) {
          setError('Transaction approval timed out. Please try again and make sure to approve the transaction in your wallet.');
        } else {
          setError(e.message || 'Withdraw initiation failed. Please try again.');
        }
      }
    } finally {
      if (mountedRef.current) {
        setIsProcessingTransaction(false);
      }
    }
  };

  const handleCompleteWithdraw = useCallback(async (withdrawalToComplete: any) => {
    if (!address || !withdrawalToComplete?.nativeAmount) {
      setError('No pending withdrawal amount found to complete.');
      return;
    }

    setIsProcessingTransaction(true);
    try {
      // Complete withdraw
      const res = await fetch(`${SERVER_URL}/api/lulo/complete-withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userPublicKey: address,
          amount: withdrawalToComplete.nativeAmount,
        })
      });

      if (!mountedRef.current) return;
      const data = await res.json();
      if (!data.success || !data.transaction) {
        throw new Error(data.error || 'Failed to get transaction for complete withdraw');
      }

      // Send second transaction
      await sendBase64Transaction(data.transaction, connection);

      if (!mountedRef.current) return;
      // Update UI
      await fetchLuloData();
      await fetchPendingWithdrawals();
      
      setModalContent('details'); // Go back to details
      setError(null);
      Alert.alert('Success', 'Your withdrawal has been completed successfully.');

    } catch (e: any) {
      if (mountedRef.current) {
        setError(e.message || 'Withdraw completion failed. Please try again.');
      }
    } finally {
      if (mountedRef.current) {
        setIsProcessingTransaction(false);
      }
    }
  }, [address, fetchLuloData, fetchPendingWithdrawals, sendBase64Transaction]);

  const getWithdrawCountdown = useCallback((withdrawal: any) => {
    if (!withdrawal?.createdTimestamp) return { total: -1, text: null };
    
    const now = Date.now() / 1000;
    const secondsLeft = (24 * 3600) - (now - withdrawal.createdTimestamp);

    if (secondsLeft <= 0) return { total: 0, text: null };

    const hours = Math.floor(secondsLeft / 3600);
    const minutes = Math.floor((secondsLeft % 3600) / 60);
    
    return { total: secondsLeft, text: `${hours}h ${minutes}m remaining` };
  }, []);

  // Fetch data on mount and when address changes
  useEffect(() => {
    if (address) {
      fetchLuloData();
    }
  }, [address, fetchLuloData]);

  useEffect(() => {
    if (modalContent === 'details') {
      fetchLuloData();
      fetchPendingWithdrawals();
      setAutoCompleteAlertShown(false); // Reset alert flag when modal opens
    }
  }, [modalContent, fetchLuloData, fetchPendingWithdrawals]);

  useEffect(() => {
    const { total: countdownTotal } = getWithdrawCountdown(pendingWithdrawals[0]);
    if (pendingWithdrawals.length > 0 && countdownTotal === 0 && !autoCompleteAlertShown) {
      Alert.alert(
        "Complete Withdrawal",
        "Your pending withdrawal is ready to be completed. Press OK to proceed.",
        [{ text: "OK", onPress: () => handleCompleteWithdraw(pendingWithdrawals[0])}]
      );
      setAutoCompleteAlertShown(true);
    }
  }, [pendingWithdrawals, autoCompleteAlertShown, getWithdrawCountdown, handleCompleteWithdraw]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const openAmountScreen = (type: 'deposit' | 'withdraw') => {
    setModalType(type);
    setAmount('');
    setModalContent('amount');
    setError(null);
  };

  const closeModals = () => {
    setModalContent('hidden');
    setModalType(null);
  }

  const renderModalContent = () => {
    if (modalContent === 'details') {
      const firstPending = pendingWithdrawals.length > 0 ? pendingWithdrawals[0] : null;
      const countdown = getWithdrawCountdown(firstPending);

      return (
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={closeModals}
              style={styles.backButton}
            >
              <Icons.ArrowLeft width={24} height={24} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Rebalancing Yield</Text>
            <View style={styles.providerContainer}>
              <Text style={styles.providedByText}>Provided by</Text>
              <Image
                source={require('@/assets/images/lulolog.jpg')}
                style={styles.providerLogo}
                resizeMode="contain"
              />
              <Text style={styles.providerName}>Lulo</Text>
            </View>
          </View>

          <ScrollView 
            style={styles.modalScroll}
            contentContainerStyle={styles.scrollContent}
          >
            {/* See how it works section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>See how it works</Text>
              <View style={styles.simulationCard}>
                <Text style={styles.depositLabel}>You Deposit</Text>
                <View style={styles.amountContainer}>
                  <Icons.CryptoIcon width={32} height={32} color={COLORS.brandBlue} />
                  <Text style={styles.amountInput}>
                    {luloLoading
                      ? <ActivityIndicator size="small" color={COLORS.white} />
                      : getBalanceText()
                    }
                  </Text>
                </View>
                <View style={styles.yieldBadge}>
                  <Text style={styles.yieldText}>
                    Simulated Yield {luloApy?.protected?.CURRENT ? `${luloApy.protected.CURRENT.toFixed(2)}%` : '0.00%'}
                  </Text>
                </View>
                <View style={styles.balanceContainer}>
                  <Text style={styles.balanceLabel}>Your Balance</Text>
                  <Text style={styles.balanceValue}>
                    {luloLoading
                      ? <ActivityIndicator size="small" color={COLORS.white} />
                      : getBalanceText()
                    }
                  </Text>
                </View>

                {pendingWithdrawals.length > 0 && (
                  <TouchableOpacity
                    style={[styles.actionButton, { marginTop: 20, backgroundColor: COLORS.brandPurple }]}
                    onPress={() => setModalContent('pending_list')}
                  >
                    <Text style={styles.actionButtonText}>
                      View Pending Withdrawals ({pendingWithdrawals.length})
                    </Text>
                  </TouchableOpacity>
                )}
                
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: COLORS.brandBlue, borderRadius: 12, padding: 16, alignItems: 'center' }}
                    onPress={() => openAmountScreen('deposit')}
                  >
                    <Text style={{ color: COLORS.white, fontWeight: 'bold', fontSize: 16 }}>Deposit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: COLORS.errorRed, borderRadius: 12, padding: 16, alignItems: 'center' }}
                    onPress={() => openAmountScreen('withdraw')}
                  >
                    <Text style={{ color: COLORS.white, fontWeight: 'bold', fontSize: 16 }}>Withdraw</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Available pools section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Available pools</Text>
              <View style={styles.poolCard}>
                <View style={styles.poolInfo}>
                  <Icons.CryptoIcon width={24} height={24} color={COLORS.brandBlue} />
                  <Text style={styles.poolName}>USDC</Text>
                </View>
                <Text style={styles.apyText}>
                  APY <Text style={styles.apyValue}>
                    {luloApy?.protected?.CURRENT ? `${luloApy.protected.CURRENT.toFixed(2)}%` : '0.00%'}
                  </Text>
                </Text>
              </View>
            </View>

            {/* About section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.aboutText}>
                Lulo dynamically allocates funds across Kamino, Drift, Marinade, and Jito to optimize yields while maintaining stability.
              </Text>
            </View>

            {/* Add bottom padding to account for fixed button */}
            <View style={styles.bottomPadding} />
          </ScrollView>

          {/* Fixed Deposit Button */}
          <View style={styles.fixedButtonContainer}>
            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}
          </View>
        </View>
      );
    }

    if (modalContent === 'amount') {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: COLORS.background, borderRadius: 12, padding: 24, width: '80%', maxWidth: 400 }}>
            <Text style={{ color: COLORS.white, fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
              {isProcessingTransaction ? 'Processing Transaction...' : (modalType === 'deposit' ? 'Deposit Amount' : 'Withdraw Amount')}
            </Text>
            
            {!isProcessingTransaction ? (
              <>
                <TextInput
                  style={{ backgroundColor: COLORS.lighterBackground, color: COLORS.white, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 20, width: '100%' }}
                  placeholder="Enter amount"
                  placeholderTextColor={COLORS.greyMid}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, width: '100%' }}>
                  <TouchableOpacity
                    style={{ borderRadius: 8, paddingVertical: 10, paddingHorizontal: 18, alignItems: 'center', minWidth: 90, backgroundColor: COLORS.lighterBackground }}
                    onPress={() => setModalContent('details')} // Go back to details
                  >
                    <Text style={{ color: COLORS.white, fontSize: 15, fontWeight: 'bold' }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ borderRadius: 8, paddingVertical: 10, paddingHorizontal: 18, alignItems: 'center', minWidth: 90, backgroundColor: modalType === 'deposit' ? COLORS.brandBlue : COLORS.errorRed }}
                    onPress={() => {
                      if (modalType === 'deposit') {
                        handleDeposit();
                      } else if (modalType === 'withdraw') {
                        handleInitiateWithdraw();
                      }
                    }}
                    disabled={isProcessingTransaction}
                  >
                    <Text style={{ color: COLORS.white, fontSize: 15, fontWeight: 'bold' }}>
                      {isProcessingTransaction ? 'Processing...' : 'Confirm'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={{ alignItems: 'center', marginBottom: 20, paddingVertical: 20 }}>
                <ActivityIndicator size="large" color={COLORS.brandPrimary} />
              </View>
            )}

            {error && (
              <Text style={{ color: COLORS.errorRed, textAlign: 'center', marginTop: 12, fontSize: 14 }}>
                {error}
              </Text>
            )}
          </View>
        </View>
      );
    }

    if (modalContent === 'pending_list') {
      return (
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setModalContent('details')}
              style={styles.backButton}
            >
              <Icons.ArrowLeft width={24} height={24} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Pending Withdrawals</Text>
            <View style={{ width: 24 }} />
          </View>

          <FlatList
            data={pendingWithdrawals}
            keyExtractor={(item) => item.withdrawalId.toString()}
            renderItem={({ item }) => {
              const countdown = getWithdrawCountdown(item);
              const isReady = countdown.total === 0;
              const date = new Date(item.createdTimestamp * 1000);
              const formattedDate = `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
              const formattedAmount = (parseInt(item.nativeAmount) / 1_000_000).toFixed(2);

              return (
                <View style={styles.withdrawalItem}>
                  <View>
                    <Text style={styles.withdrawalAmount}>${formattedAmount} USDC</Text>
                    <Text style={styles.withdrawalDate}>Initiated: {formattedDate}</Text>
                  </View>
                  <View>
                    {isReady ? (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.completeButton, { paddingVertical: 8, marginTop: 0 }]}
                        onPress={() => handleCompleteWithdraw(item)}
                        disabled={isProcessingTransaction}
                      >
                        <Text style={styles.actionButtonText}>
                          {isProcessingTransaction ? '...' : 'Complete'}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.countdownText}>{countdown.text}</Text>
                    )}
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: COLORS.greyDark, fontSize: 16 }}>No pending withdrawals.</Text>
              </View>
            }
          />
        </View>
      );
    }
    return null;
  };

  const getBalanceText = () => {
    if (luloLoading) {
      return <ActivityIndicator size="small" color={COLORS.white} />;
    }
    return `$${luloBalance.toFixed(2)}`;
  };

  return (
    <>
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={() => setModalContent('details')}
      >
        <View style={styles.actionIconContainer}>
          <View style={styles.logoBox}>
            <Image
              source={require('@/assets/images/lulolog.jpg')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </View>
        <View style={styles.actionTextContainer}>
          <Text style={styles.actionText}>Rebalancing Yield</Text>
          <Text style={styles.actionSubtext}>
            Lulo dynamically allocates your deposits across four integrated DeFi apps.
          </Text>
        </View>
        <View style={styles.apyBadge}>
          <Text style={styles.apyBadgeText}>
            {luloLoading ? (
              <ActivityIndicator size="small" color={COLORS.brandGreen} />
            ) : (
              `${luloApy?.protected?.CURRENT ? luloApy.protected.CURRENT.toFixed(2) : '0.00'}% APY`
            )}
          </Text>
        </View>
      </TouchableOpacity>
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalContent !== 'hidden'}
        onRequestClose={closeModals}
      >
        <View style={styles.modalContainer}>
          {renderModalContent()}
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    backgroundColor: COLORS.lightBackground,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  logoBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F5EFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionSubtext: {
    color: COLORS.greyDark,
    fontSize: 14,
  },
  apyBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  apyBadgeText: {
    color: COLORS.brandGreen,
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightBackground,
  },
  backButton: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 8,
  },
  providerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providedByText: {
    color: COLORS.greyDark,
    fontSize: 14,
    marginRight: 8,
  },
  providerLogo: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: 4,
  },
  providerName: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  modalScroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightBackground,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 16,
  },
  simulationCard: {
    backgroundColor: COLORS.lightBackground,
    borderRadius: 16,
    padding: 16,
  },
  depositLabel: {
    color: COLORS.greyDark,
    fontSize: 14,
    marginBottom: 8,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  amountInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: 32,
    fontWeight: '700',
    marginLeft: 8,
  },
  yieldBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 24,
  },
  yieldText: {
    color: COLORS.brandGreen,
    fontSize: 14,
    fontWeight: '600',
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.lightBackground,
    marginTop: 20,
  },
  balanceLabel: {
    fontSize: 16,
    color: COLORS.greyDark,
    fontWeight: '600',
  },
  balanceValue: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  poolCard: {
    backgroundColor: COLORS.lightBackground,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  poolInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  poolName: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  apyText: {
    color: COLORS.greyDark,
    fontSize: 14,
  },
  apyValue: {
    color: COLORS.brandGreen,
    fontWeight: '600',
  },
  aboutText: {
    color: COLORS.greyDark,
    fontSize: 14,
    lineHeight: 20,
  },
  bottomPadding: {
    height: 80, // Height of the fixed button container
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightBackground,
  },
  errorText: {
    color: COLORS.errorRed,
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  actionButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  completeButton: {
    backgroundColor: COLORS.brandGreen,
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 16,
  },
  pendingNotice: {
    marginTop: 20,
    padding: 12,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    borderRadius: 8,
    alignItems: 'center',
  },
  pendingText: {
    color: '#F97316',
    fontSize: 14,
    textAlign: 'center',
  },
  countdownText: {
    color: '#F97316',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  withdrawalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightBackground,
  },
  withdrawalAmount: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  withdrawalDate: {
    color: COLORS.greyDark,
    fontSize: 12,
  },
});

export default LuloRebalancingYieldCard; 