// FILE: src/services/pumpfun/pumpfunService.ts

import {
  PublicKey,
  Keypair,
  LAMPORTS_PER_SOL,
  Connection,
  VersionedTransaction,
} from '@solana/web3.js';
import {PumpFunSDK} from 'pumpdotfun-sdk';
import {getAssociatedTokenAddress} from '@solana/spl-token';

import {
  getProvider,
  checkIfTokenIsOnRaydium,
  getSwapFee,
  getSwapQuote,
  getSwapTransaction,
  parseRaydiumVersionedTransaction,
  buildPumpFunBuyTransaction,
  buildPumpFunSellTransaction,
  RAYDIUM_SOL_MINT,
} from '../../utils/pumpfun/pumpfunUtils';

import {calculateWithSlippageBuy} from 'pumpdotfun-sdk';
import {SERVER_URL} from '@env';
import { TransactionService } from '../../services/transaction/transactionService';
import {
  signAndSendWithPrivy,
  signAndSendBase64Tx,
} from '../../utils/transactions/transactionCompatUtils';

/**
 * Create and immediately buy tokens
 */
export async function createAndBuyTokenViaPumpfun({
  userPublicKey,
  tokenName,
  tokenSymbol,
  description,
  twitter,
  telegram,
  website,
  imageUri,
  solAmount,
  slippageBasisPoints = 500n,
  solanaWallet,
  onStatusUpdate,
}: {
  userPublicKey: string;
  tokenName: string;
  tokenSymbol: string;
  description: string;
  twitter?: string;
  telegram?: string;
  website?: string;
  imageUri: string;
  solAmount: number;
  slippageBasisPoints?: bigint;
  solanaWallet: any;
  onStatusUpdate?: (status: string) => void;
}) {
  if (!solanaWallet) {
    throw new Error(
      'No Solana wallet found. Please connect your wallet first.',
    );
  }

  const provider = getProvider();
  const connection = provider.connection;
  const sdk = new PumpFunSDK(provider);
  const creatorPubkey = new PublicKey(userPublicKey);

  console.log('[createAndBuyTokenViaPumpfun] =>', {
    userPublicKey,
    tokenName,
    tokenSymbol,
    solAmount,
    imageUri,
  });

  try {
    onStatusUpdate?.('Uploading token metadata...');
    const uploadEndpoint = `${SERVER_URL}/api/pumpfun/uploadMetadata`;
    const formData = new FormData();
    formData.append('publicKey', userPublicKey);
    formData.append('tokenName', tokenName);
    formData.append('tokenSymbol', tokenSymbol);
    formData.append('description', description);
    formData.append('twitter', twitter || '');
    formData.append('telegram', telegram || '');
    formData.append('website', website || '');
    formData.append('showName', 'true');
    formData.append('mode', 'local');
    formData.append('image', {
      uri: imageUri,
      name: 'token.png',
      type: 'image/png',
    } as any);

    const uploadResponse = await fetch(uploadEndpoint, {
      method: 'POST',
      body: formData,
    });
    if (!uploadResponse.ok) {
      const errMsg = await uploadResponse.text();
      throw new Error(`Metadata upload failed: ${errMsg}`);
    }
    const uploadJson = await uploadResponse.json();
    if (!uploadJson?.success || !uploadJson.metadataUri) {
      throw new Error(uploadJson?.error || 'No metadataUri returned');
    }

    const {metadataUri} = uploadJson;
    console.log('[createAndBuy] metadataUri =>', metadataUri);

    onStatusUpdate?.('Generating mint keypair...');
    const mintKeypair = Keypair.generate();
    console.log('[createAndBuy] New Mint =>', mintKeypair.publicKey.toBase58());

    // "create" instructions
    onStatusUpdate?.('Preparing token creation...');
    const createTx = await sdk.getCreateInstructions(
      creatorPubkey,
      tokenName,
      tokenSymbol,
      metadataUri,
      mintKeypair,
    );

    // optional "buy" instructions
    let buyTx = null;
    if (solAmount > 0) {
      onStatusUpdate?.('Preparing initial buy instructions...');
      const globalAccount = await sdk.getGlobalAccount();
      const buyAmount = globalAccount.getInitialBuyPrice(
        BigInt(Math.floor(solAmount * 1e9)),
      );
      const buyAmountWithSlippage = calculateWithSlippageBuy(
        BigInt(Math.floor(solAmount * 1e9)),
        slippageBasisPoints,
      );

      buyTx = await sdk.getBuyInstructions(
        creatorPubkey,
        mintKeypair.publicKey,
        globalAccount.feeRecipient,
        buyAmount,
        buyAmountWithSlippage,
      );
    }

    // Combine create + buy instructions
    const combinedTx = createTx;
    if (buyTx) {
      console.log("buyTx =>", buyTx);
      buyTx.instructions.forEach(ix => combinedTx.add(ix));
    }
    // Sign it with the mint keypair
    onStatusUpdate?.('Getting latest blockhash...');
    const blockhash = await provider.connection.getLatestBlockhash();
    combinedTx.recentBlockhash = blockhash.blockhash;
    combinedTx.feePayer = creatorPubkey;
    combinedTx.partialSign(mintKeypair);
    
    // Use the new transaction service
    console.log("combinedTx =>", combinedTx);
    onStatusUpdate?.('Sending transaction for approval...');
    const txSignature = await TransactionService.signAndSendTransaction(
      { type: 'transaction', transaction: combinedTx },
      solanaWallet, // Pass wallet directly - TransactionService will handle it
      { 
        connection,
        statusCallback: onStatusUpdate 
      }
    );

    if (!txSignature) {
      throw new Error('Transaction failed.');
    }

    onStatusUpdate?.('Token launched successfully!');
    return {
      mint: mintKeypair.publicKey.toString(),
      txSignature,
    };
  } catch (err: any) {
    console.error('createAndBuyTokenViaPumpfun error:', err);
    throw err;
  }
}

/**
 * buyTokenViaPumpfun
 */
export async function buyTokenViaPumpfun({
  buyerPublicKey,
  tokenAddress,
  solAmount,
  solanaWallet,
  onStatusUpdate,
}: {
  buyerPublicKey: string;
  tokenAddress: string;
  solAmount: number;
  solanaWallet: any;
  onStatusUpdate?: (status: string) => void;
}) {
  if (!solanaWallet) {
    throw new Error(
      'No Solana wallet found. Please connect your wallet first.',
    );
  }

  const provider = getProvider();
  const connection = provider.connection;
  const sdk = new PumpFunSDK(provider);

  console.log('[buyTokenViaPumpfun] =>', {
    buyerPublicKey,
    tokenAddress,
    solAmount,
  });

  try {
    // 1. Check if the token is available on Raydium
    onStatusUpdate?.('Checking token availability...');
    const isOnRaydium = await checkIfTokenIsOnRaydium(tokenAddress);
    console.log('isOnRaydium =>', isOnRaydium);
    
    // If on Raydium, we should use their API
    if (isOnRaydium) {
      onStatusUpdate?.('Token found on Raydium, preparing swap...');
      console.log('[buyTokenViaPumpfun] Token is on Raydium, using swap API...');
      
      // 2. Get quote first (exact output: I want X tokens, how much SOL?)
      const lamportsIn = Math.floor(solAmount * LAMPORTS_PER_SOL);
      onStatusUpdate?.('Getting swap quote...');
      const quote = await getSwapQuote(
        RAYDIUM_SOL_MINT, // input = SOL
        tokenAddress, // output = Token
        lamportsIn, // amount in (SOL lamports)
      );

      console.log('quote =>', quote)
      
      if (!quote || !quote.data) {
        throw new Error('Failed to get swap quote from Raydium');
      }

      onStatusUpdate?.('Calculating swap fee...');
      const swapFee = await getSwapFee();

      // 3. Get swap transaction
      onStatusUpdate?.('Building swap transaction...');
      const swapTxResp = await getSwapTransaction({
        swapResponse: quote,
        computeUnitPriceMicroLamports: swapFee,
        userPubkey: buyerPublicKey,
        unwrapSol: false,
        wrapSol: true,
      });

      console.log("swapTxResp =>", swapTxResp);
      
      const base64Tx = swapTxResp?.data?.[0]?.transaction;
      if (!base64Tx) {
        throw new Error('No swap transaction returned from Raydium');
      }
      
      // Send the transaction
      onStatusUpdate?.('Sending transaction for approval...');
      const txSignature = await TransactionService.signAndSendTransaction(
        { type: 'base64', data: base64Tx },
        solanaWallet,
        { 
          connection,
          statusCallback: onStatusUpdate 
        }
      );
      
      onStatusUpdate?.('Token purchased successfully!');
      return txSignature;
    } else {
      // Not on Raydium, use PumpFun API
      console.log('[buyTokenViaPumpfun] Token not on Raydium, using PumpFun...');
      onStatusUpdate?.('Using PumpFun for token purchase...');
      
      const mintPubkey = new PublicKey(tokenAddress);
      const buyerPubkey = new PublicKey(buyerPublicKey);
      
      onStatusUpdate?.('Building transaction...');
      const { tx, instructions } = await buildPumpFunBuyTransaction({
        solAmount,
        mintPubkey, 
        buyerPubkey,
      });
      
      onStatusUpdate?.('Sending transaction for approval...');
      const txSignature = await TransactionService.signAndSendTransaction(
        { type: 'transaction', transaction: tx },
        solanaWallet,
        { 
          connection,
          statusCallback: onStatusUpdate 
        }
      );
      
      onStatusUpdate?.('Token purchased successfully!');
      return txSignature;
    }
  } catch (err: any) {
    console.error('[buyTokenViaPumpfun] Error:', err);
    throw err;
  }
}

/**
 * sellTokenViaPumpfun
 */
export async function sellTokenViaPumpfun({
  sellerPublicKey,
  tokenAddress,
  tokenAmount,
  solanaWallet,
  onStatusUpdate,
}: {
  sellerPublicKey: string;
  tokenAddress: string;
  tokenAmount: number;
  solanaWallet: any;
  onStatusUpdate?: (status: string) => void;
}) {
  if (!solanaWallet) {
    throw new Error(
      'No Solana wallet found. Please connect your wallet first.',
    );
  }

  const provider = getProvider();
  const connection = provider.connection;
  const sdk = new PumpFunSDK(provider);

  console.log('[sellTokenViaPumpfun] =>', {
    sellerPublicKey,
    tokenAddress,
    tokenAmount,
  });

  try {
    // 1. Check if the token is available on Raydium
    onStatusUpdate?.('Checking token availability...');
    const isOnRaydium = await checkIfTokenIsOnRaydium(tokenAddress);
    console.log('isOnRaydium =>', isOnRaydium);
    
    // If on Raydium, we should use their API
    if (isOnRaydium) {
      onStatusUpdate?.('Token found on Raydium, preparing swap...');
      console.log('[sellTokenViaPumpfun] Token is on Raydium, using swap API...');
      
      // Convert token amount to lamports (assuming decimals = 9)
      const tokenLamports = Math.floor(tokenAmount * LAMPORTS_PER_SOL);
      
      // Get a swap quote (token -> SOL)
      onStatusUpdate?.('Getting swap quote...');
      const quote = await getSwapQuote(
        tokenAddress, // input = Token
        RAYDIUM_SOL_MINT, // output = SOL
        tokenLamports, // amount in (token lamports)
      );

      if (!quote || !quote.data) {
        throw new Error('Failed to get swap quote from Raydium');
      }

      onStatusUpdate?.('Calculating swap fee...');
      const swapFee = await getSwapFee();

      // Get swap transaction
      onStatusUpdate?.('Building swap transaction...');
      const swapTxResp = await getSwapTransaction({
        swapResponse: quote,
        computeUnitPriceMicroLamports: swapFee,
        userPubkey: sellerPublicKey,
        unwrapSol: true,
        wrapSol: false,
      });
      
      const base64Tx = swapTxResp?.data?.[0]?.transaction;
      if (!base64Tx) {
        throw new Error('No swap transaction returned from Raydium');
      }

      // Send the transaction
      onStatusUpdate?.('Sending transaction for approval...');
      const txSignature = await TransactionService.signAndSendTransaction(
        { type: 'base64', data: base64Tx },
        solanaWallet,
        { 
          connection,
          statusCallback: onStatusUpdate
        }
      );
      
      onStatusUpdate?.('Tokens sold successfully!');
      return txSignature;
    } else {
      // Not on Raydium, use PumpFun API
      console.log('[sellTokenViaPumpfun] Token not on Raydium, using PumpFun...');
      onStatusUpdate?.('Using PumpFun for token sale...');
      
      const mintPubkey = new PublicKey(tokenAddress);
      const sellerPubkey = new PublicKey(sellerPublicKey);
      
      // Check if user has the token account
      onStatusUpdate?.('Checking token account...');
      const ata = await getAssociatedTokenAddress(mintPubkey, sellerPubkey);
      const tokenAccountInfo = await connection.getAccountInfo(ata);
      if (!tokenAccountInfo) {
        throw new Error(`You don't own any ${tokenAddress} tokens.`);
      }
      
      // Build the transaction
      onStatusUpdate?.('Building transaction...');
      const { tx, instructions } = await buildPumpFunSellTransaction({
        tokenAmount,
        mintPubkey,
        sellerPubkey,
      });
      
      // Send the transaction
      onStatusUpdate?.('Sending transaction for approval...');
      const txSignature = await TransactionService.signAndSendTransaction(
        { type: 'transaction', transaction: tx },
        solanaWallet,
        { 
          connection,
          statusCallback: onStatusUpdate
        }
      );
      
      onStatusUpdate?.('Tokens sold successfully!');
      return txSignature;
    }
  } catch (err: any) {
    console.error('[sellTokenViaPumpfun] Error:', err);
    throw err;
  }
}
