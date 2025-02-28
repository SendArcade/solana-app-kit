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
import {useAuth} from '../../hooks/useAuth';
import {PumpfunBuyButton} from '../../components/pumpfun/PumpfunBuyButton';
import {PumpfunSellButton} from '../../components/pumpfun/PumpfunSellButton';
import {HELIUS_API_KEY} from '@env';
import COLORS from '../../assets/colors';
import {fetchWithRetries} from '../../utils/common/fetch';
import PumpfunLaunchButton from '../../components/pumpfun/PumpfunLaunchButton';
import {styles} from './pumpfunScreen.style';

type TokenEntry = {
  accountPubkey: string;
  mintPubkey: string; // Must be a valid base58 address, e.g. "BY1hGNp2z..."
  uiAmount: number; // e.g. 12.345
  decimals: number; // e.g. 6
};

export default function PumpfunScreen() {
  const {solanaWallet} = useAuth();
  const userPublicKey = solanaWallet?.wallets?.[0]?.publicKey || null;

  // UI state
  const [activeTab, setActiveTab] = useState<'buy' | 'sell' | 'launch'>('buy');
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [tokens, setTokens] = useState<TokenEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // For the "Sell" flow
  const [selectedSellToken, setSelectedSellToken] = useState<TokenEntry | null>(
    null,
  );

  // --------------------------------------------------------------------------
  // Fetch user’s SOL balance
  // --------------------------------------------------------------------------
  async function fetchSolBalance() {
    if (!userPublicKey) return;
    try {
      setLoading(true);
      const url = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
      const body = {
        jsonrpc: '2.0',
        id: 'get-balance-1',
        method: 'getBalance',
        params: [userPublicKey],
      };
      const res = await fetchWithRetries(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data?.result?.value) {
        setSolBalance(data.result.value);
      } else {
        console.warn('No "value" in getBalance result', data);
      }
    } catch (err) {
      console.error('Error in fetchSolBalance:', err);
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------------------------------------
  // Fetch user’s tokens
  // --------------------------------------------------------------------------
  async function fetchTokenAccounts() {
    if (!userPublicKey) return;
    try {
      setLoading(true);
      const url = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
      const body = {
        jsonrpc: '2.0',
        id: 'get-tkn-accs-1',
        method: 'getTokenAccountsByOwner',
        params: [
          userPublicKey,
          {programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'},
          {encoding: 'jsonParsed'},
        ],
      };

      const res = await fetchWithRetries(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!data?.result?.value) {
        console.warn('No token accounts found for user');
        setTokens([]);
        return;
      }

      // data.result.value is an array of { account, pubkey }
      const rawAccounts = data.result.value;
      const tokenEntries: TokenEntry[] = [];

      for (const acct of rawAccounts) {
        const accountPubkey = acct.pubkey;
        const mintPubkey = acct?.account?.data?.parsed?.info?.mint || '';

        // Now fetch each token account's balance
        const balObj = await fetchTokenAccountBalance(accountPubkey);
        if (balObj.uiAmount && balObj.uiAmount > 0) {
          tokenEntries.push({
            accountPubkey,
            mintPubkey,
            uiAmount: balObj.uiAmount,
            decimals: balObj.decimals,
          });
        }
      }
      setTokens(tokenEntries);
    } catch (err) {
      console.error('Error in fetchTokenAccounts:', err);
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------------------------------------
  // For each token account, get its balance via getTokenAccountBalance
  // --------------------------------------------------------------------------
  async function fetchTokenAccountBalance(tokenAccount: string) {
    try {
      const url = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
      const body = {
        jsonrpc: '2.0',
        id: 'token-balance-1',
        method: 'getTokenAccountBalance',
        params: [tokenAccount],
      };
      const res = await fetchWithRetries(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data?.result?.value) {
        // returns { uiAmount, decimals, amount, uiAmountString, ...}
        return data.result.value;
      }
      return {uiAmount: 0, decimals: 0};
    } catch (err) {
      console.warn(
        `Error in fetchTokenAccountBalance for ${tokenAccount}:`,
        err,
      );
      return {uiAmount: 0, decimals: 0};
    }
  }

  // --------------------------------------------------------------------------
  // Refresh everything
  // --------------------------------------------------------------------------
  async function refreshAll() {
    if (!userPublicKey) return;
    setTokens([]);
    setSolBalance(null);
    await fetchSolBalance();
    await fetchTokenAccounts();
  }

  // If no wallet connected
  if (!userPublicKey) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.warnText}>Please connect your wallet first!</Text>
      </SafeAreaView>
    );
  }

  // Convert lamports to SOL for display
  const solString = useMemo(() => {
    if (solBalance === null) return '--';
    return (solBalance / 1e9).toFixed(4);
  }, [solBalance]);

  // --------------------------------------------------------------------------
  // FlatList Data + Renderers
  // --------------------------------------------------------------------------
  // We’ll display the user’s tokens as the main data for the FlatList
  const renderTokenItem = ({item}: {item: TokenEntry}) => {
    return (
      <View style={styles.tokenRow}>
        <Text style={styles.tokenMint}>
          {item.mintPubkey.slice(0, 6)}...{item.mintPubkey.slice(-6)}
        </Text>
        <Text style={styles.tokenAmount}>{item.uiAmount.toFixed(4)}</Text>
        <TouchableOpacity
          onPress={() => {
            // Choose to SELL this token
            setSelectedSellToken(item);
            setActiveTab('sell');
          }}
          style={styles.selectButton}>
          <Text style={styles.selectButtonText}>Sell</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Header for the list (SOL balance, refresh button, top label)
  const renderListHeader = () => {
    return (
      <View style={{marginBottom: 16}}>
        <Text style={styles.header}>Pumpfun Dashboard</Text>
        {/* SOL Balance */}
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>SOL Balance: </Text>
          <Text style={styles.balanceValue}>{solString} SOL</Text>
        </View>
        {/* Refresh */}
        <TouchableOpacity style={styles.refreshButton} onPress={refreshAll}>
          <Text style={styles.refreshButtonText}>
            {loading ? 'Loading...' : 'Refresh'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.subHeader}>Your Tokens</Text>
        {loading && <ActivityIndicator size="large" color="#999" />}
      </View>
    );
  };

  // Footer for the list (tabs + buy/sell/launch)
  const renderListFooter = () => {
    return (
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

        {activeTab === 'buy' && <PumpfunBuyButton />}

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
            <PumpfunSellButton selectedToken={selectedSellToken} />
          </>
        )}

        {activeTab === 'launch' && <PumpfunLaunchButton />}
      </View>
    );
  };

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
        // So the list can scroll fully
        contentContainerStyle={styles.listContentContainer}
      />
    </SafeAreaView>
  );
}
