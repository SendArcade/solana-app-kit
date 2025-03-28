// File: src/hooks/useTradeTransaction.ts
import { useSelector } from 'react-redux';
import { Alert } from 'react-native';
import {
  Connection,
  clusterApiUrl,
  Cluster,
} from '@solana/web3.js';

import { RootState } from '../state/store';
import { useCustomization } from '../CustomizationProvider';
import { useAuth } from '../hooks/useAuth';
import { ENDPOINTS } from '../config/constants';
import { CLUSTER, SERVER_URL } from '@env';
import { 
  sendSOL, 
  sendTransactionWithPriorityFee 
} from '../utils/transactions/transactionUtils';
import { TransactionService } from '../services/transaction/transactionService';

/**
 * Hook to handle trade transactions for both Privy & Dynamic.
 * This hook provides backward compatibility with existing code.
 */
export function useTradeTransaction() {
  const { transaction: transactionConfig } = useCustomization();
  const currentProvider = useSelector((state: RootState) => state.auth.provider);
  const { wallet } = useAuth();

  const sendTrade = async (
    mode: 'priority' | 'jito',
    recipient: string,
    amountSol: number,
  ) => {
    console.log(
      `[useTradeTransaction] Called sendTrade with mode=${mode}, recipient=${recipient}, amountSol=${amountSol}, provider=${currentProvider}`
    );

    // Force devnet in code
    const connection = new Connection(clusterApiUrl(CLUSTER as Cluster), 'confirmed');

    try {
      if (!wallet) {
        Alert.alert('Error', 'Wallet not connected');
        return;
      }

      // Use our centralized sendSOL function 
      const signature = await sendSOL({
        wallet,
        recipientAddress: recipient,
        amountSol,
        connection,
        onStatusUpdate: (status) => console.log(`[TradeTransaction] ${status}`),
      });
      
      Alert.alert('Transaction Sent', `Signature: ${signature}`);
      return signature;
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
  ): Promise<string | void> {
    if (!tradeData.inputMint ||
        !tradeData.outputMint ||
        !tradeData.inputAmountLamports) {
      throw new Error('Insufficient tradeData to replicate Jupiter swap.');
    }
    
    // Exit early if wallet is not available
    if (!wallet) {
      throw new Error('Wallet not connected');
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
        userPublicKey: wallet.address || wallet.publicKey,
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

      // 3) Use the transaction service to sign and send the base64 transaction
      const rpcUrl = ENDPOINTS.helius || clusterApiUrl(CLUSTER as Cluster);
      const connection = new Connection(rpcUrl, 'confirmed');
      
      // Use TransactionService through our centralized utility
      const signature = await TransactionService.signAndSendTransaction(
        { type: 'base64', data: swapData.swapTransaction },
        wallet,
        {
          connection,
          statusCallback: (status: string) => console.log(`[JupiterTrade] ${status}`),
        }
      );

      Alert.alert('Trade Copied!', `Tx Signature: ${signature}`);
      return signature;
    } catch (err: any) {
      throw err;
    }
  }

  return { sendTrade, replicateJupiterTrade };
}
