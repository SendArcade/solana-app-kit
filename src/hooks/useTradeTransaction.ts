// File: src/hooks/useTradeTransaction.ts
import { useSelector } from 'react-redux';
import { Alert } from 'react-native';
import { useEmbeddedSolanaWallet } from '@privy-io/expo';
import {
  Connection,
  clusterApiUrl,
  SystemProgram,
  PublicKey,
  TransactionInstruction,
  LAMPORTS_PER_SOL,
  Transaction,
  VersionedTransaction,
  Cluster,
} from '@solana/web3.js';

import { RootState } from '../state/store';
import { useCustomization } from '../CustomizationProvider';
import {
  sendPriorityTransaction,
  sendPriorityTransactionMWA,
} from '../utils/transactions/sendPriorityTx';
import {
  sendJitoBundleTransaction,
  sendJitoBundleTransactionMWA,
} from '../utils/transactions/sendJitoBundleTx';
import { ENDPOINTS } from '../config/constants';
import { CLUSTER, SERVER_URL } from '@env';

/**
 * Hook to handle trade transactions for both Privy & MWA.
 */
export function useTradeTransaction() {
  const { transaction: transactionConfig } = useCustomization();
  const currentProvider = useSelector((state: RootState) => state.auth.provider);
  const solanaWallet = useEmbeddedSolanaWallet();

  const sendTrade = async (
    mode: 'priority' | 'jito',
    recipient: string,
    amountSol: number,
  ) => {
    console.log(
      `[useTradeTransaction] Called sendTrade with mode=${mode}, recipient=${recipient}, amountSol=${amountSol}, provider=${currentProvider}`
    );

    // Force devnet in code
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    const lamports = Math.floor(amountSol * LAMPORTS_PER_SOL);

    try {
      // If provider is MWA, use MWA flow
      if (currentProvider === 'mwa') {
        console.log('[useTradeTransaction] Using MWA flow...');
        let signature: string;
        if (mode === 'priority') {
          signature = await sendPriorityTransactionMWA(
            connection,
            recipient,
            lamports,
            transactionConfig.feeTiers,
          );
        } else {
          signature = await sendJitoBundleTransactionMWA(
            connection,
            recipient,
            lamports,
            transactionConfig.feeTiers,
          );
        }
        console.log('[useTradeTransaction] MWA flow returned signature:', signature);
        Alert.alert('MWA Transaction', `Signature: ${signature}`);
        return;
      }

      // Otherwise, use the embedded/Privy approach
      console.log('[useTradeTransaction] Using embedded/Privy flow...');
      const walletPublicKey =
        solanaWallet?.wallets?.length ? solanaWallet.wallets[0].publicKey : null;
      if (!walletPublicKey) {
        Alert.alert('Error', 'No embedded wallet found');
        return;
      }

      // optional: check balance
      const senderPubKey = new PublicKey(walletPublicKey);
      const balance = await connection.getBalance(senderPubKey);
      console.log('[useTradeTransaction] Embedded wallet balance:', balance);
      if (balance < lamports) {
        Alert.alert('Insufficient Funds', 'Not enough balance for this transfer');
        return;
      }

      // build instructions
      const instructions: TransactionInstruction[] = [
        SystemProgram.transfer({
          fromPubkey: senderPubKey,
          toPubkey: new PublicKey(recipient),
          lamports,
        }),
      ];

      const selectedFeeTier = transactionConfig.defaultFeeTier || 'low';
      const provider = await solanaWallet.getProvider!();
      let txSignature: string;

      if (mode === 'priority') {
        console.log('[useTradeTransaction] Calling sendPriorityTransaction...');
        txSignature = await sendPriorityTransaction(
          provider,
          selectedFeeTier as 'low' | 'medium' | 'high' | 'very-high',
          instructions,
          connection,
          senderPubKey,
          transactionConfig.feeTiers,
        );
      } else {
        console.log('[useTradeTransaction] Calling sendJitoBundleTransaction...');
        txSignature = await sendJitoBundleTransaction(
          provider,
          selectedFeeTier as 'low' | 'medium' | 'high' | 'very-high',
          instructions,
          senderPubKey,
          connection,
          transactionConfig.feeTiers,
        );
      }

      console.log('[useTradeTransaction] Embedded transaction success:', txSignature);
      Alert.alert('Transaction Sent', `Signature: ${txSignature}`);
    } catch (err: any) {
      console.error('[useTradeTransaction] Error in sendTrade:', err);
      Alert.alert('Transaction Error', err.message || String(err));
    }
  };

  /**
   * replicateJupiterTrade example
   */
  async function replicateJupiterTrade(
    tradeData: {
      token1Avatar?: any;
      token1Name?: string;
      token1PriceUsd?: string;
      token2Avatar?: any;
      token2Name?: string;
      token2PriceUsd?: string;
      token2PriceSol?: string;
      inputMint?: string;
      outputMint?: string;
      inputAmountLamports?: string;
      outputAmountLamports?: string;
      aggregator?: string;
    },
    mode: 'priority' | 'jito',
  ): Promise<void> {
    const walletPublicKey =
      solanaWallet.wallets && solanaWallet.wallets.length > 0
        ? solanaWallet.wallets[0].publicKey
        : null;
    if (!solanaWallet || !walletPublicKey) {
      throw new Error('Wallet not connected');
    }

    if (
      !tradeData.inputMint ||
      !tradeData.outputMint ||
      !tradeData.inputAmountLamports
    ) {
      throw new Error('Insufficient tradeData to replicate Jupiter swap.');
    }

    try {
      // 1) Re-quote from Jupiter
      const quoteUrl = `https://api.jup.ag/swap/v1/quote?inputMint=${tradeData.inputMint}&outputMint=${tradeData.outputMint}&amount=${tradeData.inputAmountLamports}&slippageBps=50&swapMode=ExactIn`;
      const quoteResp = await fetch(quoteUrl);
      if (!quoteResp.ok) {
        throw new Error(`Jupiter quote failed: ${quoteResp.status}`);
      }
      const quoteData = await quoteResp.json();
      const firstRoute = quoteData?.data?.[0];
      if (!firstRoute) {
        throw new Error('No routes returned by Jupiter (replicateTrade).');
      }

      // 2) Call server endpoint to get the swap transaction
      const serverBody = {
        quoteResponse: quoteData,
        userPublicKey: walletPublicKey.toString(),
      };
      const swapResp = await fetch(`${SERVER_URL}/api/jupiter/swap`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(serverBody),
      });
      const swapData = await swapResp.json();
      if (!swapResp.ok || !swapData.swapTransaction) {
        throw new Error(
          swapData.error ||
            'Failed to get Jupiter swapTransaction from server.',
        );
      }

      // 3) Deserialize and sign the transaction
      const {swapTransaction} = swapData;
      const txBuffer = Buffer.from(swapTransaction, 'base64');
      let transaction;
      try {
        transaction = VersionedTransaction.deserialize(txBuffer);
      } catch (e) {
        transaction = Transaction.from(txBuffer);
      }

      const provider = solanaWallet.wallets && solanaWallet.wallets.length > 0
        ? await solanaWallet.wallets[0].getProvider()
        : null;
      if (!provider) {
        throw new Error('Provider not available');
      }
      const rpcUrl = ENDPOINTS.helius || clusterApiUrl(CLUSTER as Cluster);
      const connection = new Connection(rpcUrl, 'confirmed');
      const {signature} = await provider.request({
        method: 'signAndSendTransaction',
        params: {transaction, connection},
      });
      if (!signature) {
        throw new Error('No signature returned from replicateJupiterTrade');
      }

      Alert.alert('Trade Copied!', `Tx Signature: ${signature}`);
    } catch (err: any) {
      throw err;
    }
  }

  return { sendTrade, replicateJupiterTrade };
}
