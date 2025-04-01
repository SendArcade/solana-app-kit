import React, {useState, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import {styles} from './pumpfunScreen.style';
import { useAuth } from '../../embeddedWalletProviders/hooks/useAuth';
import { fetchSolBalance, fetchTokenAccounts, TokenEntry } from '../../../utils/common/fetch';
import PumpfunBuySection from '../components/PumpfunBuySection';
import PumpfunSellSection from '../components/PumpfunSellSection';
import PumpfunLaunchSection from '../components/PumpfunLaunchSection';
import { useAppSelector } from '../../../hooks/useReduxHooks';

const customStyles = StyleSheet.create({
  customCardContainer: {
    backgroundColor: '#F9F9FF',
    padding: 20,
    borderRadius: 16,
  },
  customInput: {
    backgroundColor: '#FFF5E1',
    borderColor: '#FFA500',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
  },
  customButton: {
    backgroundColor: '#FFA500',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  customButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});

export default function PumpfunScreen() {
  const {solanaWallet} = useAuth();
  const myWallet = useAppSelector(state => state.auth.address);

  const userPublicKey = solanaWallet?.wallets?.[0]?.publicKey || myWallet || null;
  // console.log('userPublicKey', userPublicKey);

  const [activeTab, setActiveTab] = useState<'buy' | 'sell' | 'launch'>('buy');
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [tokens, setTokens] = useState<TokenEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSellToken, setSelectedSellToken] = useState<TokenEntry | null>(
    null,
  );

  async function refreshAll() {
    if (!userPublicKey) return;
    setLoading(true);
    setTokens([]);
    setSolBalance(null);

    try {
      const balance = await fetchSolBalance(userPublicKey);
      setSolBalance(balance);
      const tokenAccounts = await fetchTokenAccounts(userPublicKey);
      setTokens(tokenAccounts);
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setLoading(false);
    }
  }

  if (!userPublicKey) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.warnText}>Please connect your wallet first!</Text>
      </SafeAreaView>
    );
  }

  const solString = useMemo(() => {
    if (solBalance === null) return '--';
    return (solBalance / 1e9).toFixed(4);
  }, [solBalance]);

  const renderTokenItem = ({item}: {item: TokenEntry}) => (
    <View style={styles.tokenRow}>
      <Text style={styles.tokenMint}>
        {item.mintPubkey.slice(0, 6)}...{item.mintPubkey.slice(-6)}
      </Text>
      <Text style={styles.tokenAmount}>{item.uiAmount.toFixed(4)}</Text>
      <TouchableOpacity
        onPress={() => {
          setSelectedSellToken(item);
          setActiveTab('sell');
        }}
        style={styles.selectButton}>
        <Text style={styles.selectButtonText}>Sell</Text>
      </TouchableOpacity>
    </View>
  );

  const renderListHeader = () => (
    <View style={{marginBottom: 16}}>
      <Text style={styles.header}>Pumpfun Dashboard</Text>
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceLabel}>SOL Balance: </Text>
        <Text style={styles.balanceValue}>{solString} SOL</Text>
      </View>
      <TouchableOpacity style={styles.refreshButton} onPress={refreshAll}>
        <Text style={styles.refreshButtonText}>
          {loading ? 'Loading...' : 'Refresh'}
        </Text>
      </TouchableOpacity>
      <Text style={styles.subHeader}>Your Tokens</Text>
      {loading && <ActivityIndicator size="large" color="#999" />}
    </View>
  );

  const renderListFooter = () => (
    <View style={{paddingBottom: 40}}>
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'buy' && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab('buy')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'buy' && styles.tabTextActive,
            ]}>
            Buy
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'sell' && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab('sell')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'sell' && styles.tabTextActive,
            ]}>
            Sell
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'launch' && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab('launch')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'launch' && styles.tabTextActive,
            ]}>
            Launch
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'buy' && (
        <PumpfunBuySection
          containerStyle={customStyles.customCardContainer}
          inputStyle={customStyles.customInput}
          buttonStyle={customStyles.customButton}
        />
      )}

      {activeTab === 'sell' && (
        <>
          <View style={styles.selectedTokenContainer}>
            <Text style={styles.selectedTokenLabel}>Selected Token:</Text>
            {selectedSellToken ? (
              <Text style={styles.selectedTokenText}>
                {selectedSellToken.mintPubkey} {'\n'}
                Balance: {selectedSellToken.uiAmount.toFixed(4)}
              </Text>
            ) : (
              <Text style={styles.selectedTokenPlaceholder}>
                No token selected
              </Text>
            )}
          </View>
          <PumpfunSellSection
            selectedToken={selectedSellToken}
            containerStyle={customStyles.customCardContainer}
            inputStyle={customStyles.customInput}
            buttonStyle={customStyles.customButton}
            sellButtonLabel="Sell Now"
          />
        </>
      )}

      {activeTab === 'launch' && (
        <PumpfunLaunchSection
          containerStyle={customStyles.customCardContainer}
          inputStyle={customStyles.customInput}
          buttonStyle={customStyles.customButton}
          launchButtonLabel="Go Live!"
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={tokens}
        keyExtractor={item => item.accountPubkey}
        renderItem={renderTokenItem}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyText}>
              No tokens found. Press Refresh.
            </Text>
          ) : null
        }
        ListFooterComponent={renderListFooter}
        contentContainerStyle={styles.listContentContainer}
      />
    </SafeAreaView>
  );
}
