// FILE: src/hooks/useTradeTransaction.ts

import {useSelector} from 'react-redux';
import {Alert} from 'react-native';
import {useEmbeddedSolanaWallet} from '@privy-io/expo';
import {
  Connection,
  clusterApiUrl,
  SystemProgram,
  PublicKey,
  TransactionInstruction,
  LAMPORTS_PER_SOL,
  VersionedTransaction,
  Transaction,
  Cluster,
} from '@solana/web3.js';
import {sendPriorityTransaction} from '../utils/transactions/sendPriorityTx';
import {sendJitoBundleTransaction} from '../utils/transactions/sendJitoBundleTx';
import {RootState} from '../state/store';
import {useCustomization} from '../CustomizationProvider';
import {CLUSTER, HELIUS_RPC_URL, SERVER_URL} from '@env';
import {ENDPOINTS, PUBLIC_KEYS} from '../config/constants';

/**
 * Hook to handle trade transactions.
 *
 * Now, sendTrade accepts a mode ('priority' | 'jito'),
 * a recipient address, and an amount in SOL.
 */
export function useTradeTransaction() {
  const solanaWallet = useEmbeddedSolanaWallet();
  const {transaction: transactionConfig} = useCustomization();
  const selectedFeeTier = useSelector(
    (state: RootState) => state.transaction.selectedFeeTier,
  );

  /**
   * sendTrade:
   * 1. Accepts additional parameters: recipient (string) and amountSol (number).
   * 2. Constructs a SystemProgram.transfer instruction for the given recipient and amount.
   * 3. Uses the priority or Jito transaction method based on the mode.
   *
   * @param mode - Either 'priority' or 'jito'
   * @param recipient - SOL address to send funds to.
   * @param amountSol - Amount in SOL to send.
   */
  const sendTrade = async (
    mode: 'priority' | 'jito',
    recipient: string,
    amountSol: number,
  ) => {
    const walletPublicKey =
      solanaWallet.wallets && solanaWallet.wallets.length > 0
        ? solanaWallet.wallets[0].publicKey
        : null;
    if (!solanaWallet || !walletPublicKey) {
      Alert.alert('Wallet Error', 'Wallet not connected');
      return;
    }

    try {
      const provider = solanaWallet.getProvider
        ? await solanaWallet.getProvider()
        : null;
      if (!provider || typeof provider.request !== 'function') {
        Alert.alert(
          'Provider Error',
          'Provider does not support signing transactions.',
        );
        return;
      }

      // Determine the RPC endpoint.
      const rpcUrl = ENDPOINTS.helius || clusterApiUrl(CLUSTER as Cluster);
      const connection = new Connection(rpcUrl, 'confirmed');
      const senderPubkey = new PublicKey(walletPublicKey);
      console.log('senderPubkey', senderPubkey);
      console.log('walletPublicKey', walletPublicKey);
      const receiverPubkey = new PublicKey(recipient.trim());
      console.log('receiverPubkey', receiverPubkey);

      const balance = await connection.getBalance(senderPubkey);
      // Convert the SOL amount to lamports.
      const transferLamports = Math.floor(amountSol * LAMPORTS_PER_SOL);
      const estimatedFee = 500000; // Estimated fee in lamports..
      const totalRequired = transferLamports + estimatedFee;

      console.log('balance', balance);
      if (balance < totalRequired) {
        Alert.alert(
          'Insufficient Balance',
          `Your wallet has ${balance} lamports, but the transaction requires ${totalRequired} lamports (including fees).`,
        );
        return;
      }

   

      let txSignature: string;
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: senderPubkey,
        toPubkey: receiverPubkey,
        lamports: transferLamports,
      });
      const instructions: TransactionInstruction[] = [transferInstruction];

      if (mode === 'priority') {
        txSignature = await sendPriorityTransaction(
          provider,
          selectedFeeTier,
          instructions,
          connection,
          senderPubkey,
          transactionConfig.feeTiers,
        );
      } else if (mode === 'jito') {
        txSignature = await sendJitoBundleTransaction(
          provider,
          selectedFeeTier,
          instructions,
          senderPubkey,
          connection,
          transactionConfig.feeTiers,
        );
      } else {
        throw new Error('Invalid mode');
      }

      Alert.alert('Transaction Sent', `Signature: ${txSignature}`);
      console.log('[Trade] Transaction sent successfully', txSignature);
    } catch (error: any) {
      Alert.alert('Transaction Error', error.message);
    }
  };

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

  return {sendTrade, replicateJupiterTrade};
}
