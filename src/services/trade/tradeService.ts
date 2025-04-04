import { Connection, clusterApiUrl, Cluster, Transaction, VersionedTransaction, PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { ENDPOINTS } from '../../config/constants';
import { CLUSTER } from '@env';
import { TokenInfo } from '../token/tokenService';
import { TransactionService } from '../../modules/embeddedWalletProviders/services/transaction/transactionService';

export interface TradeResponse {
  success: boolean;
  signature?: string;
  error?: Error | string;
  inputAmount: number;
  outputAmount: number;
}

export interface SwapCallback {
  statusCallback: (status: string) => void;
}

export class TradeService {
  /**
   * Executes a token swap using Jupiter API
   */
  static async executeSwap(
    inputToken: TokenInfo,
    outputToken: TokenInfo,
    inputAmount: string,
    walletPublicKey: PublicKey,
    sendTransaction: (
      transaction: Transaction | VersionedTransaction,
      connection: Connection, 
      options?: { statusCallback?: (status: string) => void, confirmTransaction?: boolean }
    ) => Promise<string>,
    callbacks?: SwapCallback
  ): Promise<TradeResponse> {
    try {
      // Convert to base units
      const inputLamports = Number(this.toBaseUnits(inputAmount, inputToken.decimals));
      
      // Get quote from Jupiter
      callbacks?.statusCallback('Getting quote...');
      console.log('Getting Jupiter quote...');
      
      const quoteUrl = `${ENDPOINTS.jupiter.quote}?inputMint=${inputToken.address
        }&outputMint=${outputToken.address}&amount=${Math.round(
          inputLamports,
        )}&slippageBps=50&swapMode=ExactIn`;
        
      const quoteResp = await fetch(quoteUrl);
      if (!quoteResp.ok) {
        throw new Error(`Jupiter quote failed: ${quoteResp.status}`);
      }
      
      const quoteData = await quoteResp.json();
      console.log('Jupiter quote received');

      let firstRoute;
      let outLamports = 0;
      
      if (
        quoteData.data &&
        Array.isArray(quoteData.data) &&
        quoteData.data.length > 0
      ) {
        firstRoute = quoteData.data[0];
        outLamports = parseFloat(firstRoute.outAmount) || 0;
      } else if (
        quoteData.routePlan &&
        Array.isArray(quoteData.routePlan) &&
        quoteData.routePlan.length > 0
      ) {
        firstRoute = quoteData;
        outLamports = parseFloat(quoteData.outAmount) || 0;
      } else {
        throw new Error('No routes returned by Jupiter.');
      }

      // Build swap transaction
      callbacks?.statusCallback('Building transaction...');
      console.log('Building swap transaction from server...');
      
      const body = {
        quoteResponse: quoteData,
        userPublicKey: walletPublicKey.toString(),
      };
      
      const swapResp = await fetch(ENDPOINTS.jupiter.swap, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const swapData = await swapResp.json();
      if (!swapResp.ok || !swapData.swapTransaction) {
        throw new Error(
          swapData.error || 'Failed to get Jupiter swapTransaction.',
        );
      }
      
      console.log('Swap transaction received from server');

      const { swapTransaction } = swapData;
      const txBuffer = Buffer.from(swapTransaction, 'base64');
      let transaction: Transaction | VersionedTransaction;
      
      try {
        transaction = VersionedTransaction.deserialize(txBuffer);
        console.log('Deserialized as VersionedTransaction');
      } catch {
        transaction = Transaction.from(txBuffer);
        console.log('Deserialized as legacy Transaction');

        // Ensure feePayer is set for legacy transactions
        if (!transaction.feePayer) {
          transaction.feePayer = walletPublicKey;
          console.log('Set feePayer on legacy transaction');
        }
      }

      const rpcUrl = ENDPOINTS.helius || clusterApiUrl(CLUSTER as Cluster);
      console.log('Using RPC URL:', rpcUrl);
      const connection = new Connection(rpcUrl, 'confirmed');

      // Send transaction with status updates
      callbacks?.statusCallback('Please approve the transaction...');
      console.log('Sending transaction...');
      
      const signature = await sendTransaction(
        transaction,
        connection,
        {
          statusCallback: (status) => {
            console.log(`[JupiterSwap] ${status}`);
            // Filter raw errors using TransactionService
            TransactionService.filterStatusUpdate(status, (filteredStatus) => {
              callbacks?.statusCallback(filteredStatus);
            });
          },
          confirmTransaction: true
        }
      );

      console.log('Transaction successfully sent with signature:', signature);

      // Show success notification
      TransactionService.showSuccess(signature, 'swap');

      callbacks?.statusCallback(`Swap successful!`);

      return {
        success: true,
        signature,
        inputAmount: inputLamports,
        outputAmount: outLamports
      };
    } catch (err: any) {
      console.error('Trade error:', err);
      
      // Show error notification
      TransactionService.showError(err);
      
      return {
        success: false,
        error: err,
        inputAmount: 0,
        outputAmount: 0
      };
    }
  }

  /**
   * Converts a decimal amount to base units (e.g., SOL -> lamports)
   */
  static toBaseUnits(amount: string, decimals: number): number {
    const val = parseFloat(amount);
    if (isNaN(val)) return 0;
    return val * Math.pow(10, decimals);
  }
} 