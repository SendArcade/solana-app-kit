// File: /Users/bhuwantyagi/Desktop/sendAi/solana-social-starter/src/hooks/useTradeTransaction.ts
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
} from '@solana/web3.js';
import {sendPriorityTransaction} from '../utils/transactions/sendPriorityTx';
import {sendJitoBundleTransaction} from '../utils/transactions/sendJitoBundleTx';
import {RootState} from '../state/store';
import {useCustomization} from '../CustomizationProvider';

export function useTradeTransaction() {
  const solanaWallet = useEmbeddedSolanaWallet();
  const {transaction: transactionConfig} = useCustomization();
  const selectedFeeTier = useSelector(
    (state: RootState) => state.transaction.selectedFeeTier,
  );

  const sendTrade = async (mode: 'priority' | 'jito') => {
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

      // Connect to mainnet-beta
      const connection = new Connection(clusterApiUrl('mainnet-beta'));
      const senderPubkey = new PublicKey(walletPublicKey);
      console.log('senderPubkey', senderPubkey);
      console.log('walletPublicKey', walletPublicKey);
      const balance = await connection.getBalance(senderPubkey);
      const transferLamports = 20000000;
      const estimatedFee = 500000;
      const totalRequired = transferLamports + estimatedFee;

      console.log('balance', balance);

      if (balance < totalRequired) {
        Alert.alert(
          'Insufficient Balance',
          `Your wallet has ${balance} lamports, but the transaction needs ${totalRequired} (including fees).`,
        );
        return;
      }

      // Define the receiver public key (hard-coded)
      const receiverPubkey = new PublicKey(
        '24MDwQXG2TWiST8ty1rjcrKgtaYaMiLdRxFQawYgZh4v',
      );

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

  return {sendTrade};
}
