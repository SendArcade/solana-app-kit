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

    const mintKeypair = Keypair.generate();
    console.log('[createAndBuy] New Mint =>', mintKeypair.publicKey.toBase58());

    // "create" instructions
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
      buyTx.instructions.forEach(ix => combinedTx.add(ix));
    }

    // Sign it with the mint keypair
    combinedTx.partialSign(mintKeypair);

    // Get blockhash
    const blockhash = await provider.connection.getLatestBlockhash();
    combinedTx.recentBlockhash = blockhash.blockhash;
    combinedTx.feePayer = creatorPubkey;

    // Use the new transaction service
    const txSignature = await TransactionService.signAndSendTransaction(
      { type: 'transaction', transaction: combinedTx },
      solanaWallet, // Pass wallet directly - TransactionService will handle it
      { connection }
    );

    if (!txSignature) {
      throw new Error('Transaction failed.');
    }

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
}: {
  buyerPublicKey: string;
  tokenAddress: string;
  solAmount: number;
  solanaWallet: any;
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
    const isOnRaydium = await checkIfTokenIsOnRaydium(tokenAddress);
    console.log('isOnRaydium =>', isOnRaydium);
    
    // If on Raydium, we should use their API
    if (isOnRaydium) {
      console.log('[buyTokenViaPumpfun] Token is on Raydium, using swap API...');
      
      // 2. Get quote first (exact output: I want X tokens, how much SOL?)
      const lamportsIn = Math.floor(solAmount * LAMPORTS_PER_SOL);
      const quote = await getSwapQuote(
        RAYDIUM_SOL_MINT, // input = SOL
        tokenAddress, // output = Token
        lamportsIn, // amount in (SOL lamports)
      );

      console.log('quote =>', quote)
      
      if (!quote || !quote.data) {
        throw new Error('Failed to get swap quote from Raydium');
      }

      const swapFee = await getSwapFee();

      // 3. Get swap transaction
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
      
      // 4. Sign and send transaction
      try {
        console.log('[buyTokenViaPumpfun] Attempting to sign and send base64 transaction');
        
        let txId = await TransactionService.signAndSendTransaction(
          { type: 'base64', data: base64Tx },
          solanaWallet, // Pass wallet directly - TransactionService will handle it
          { connection }
        );
        
        return {
          txSignature: txId,
          usedRaydium: true,
        };
      } catch (txError) {
        console.error('[buyTokenViaPumpfun] Transaction signing error:', txError);
        throw txError;
      }
    }
    
    // If not on Raydium, use Pump.fun
    console.log('[buyTokenViaPumpfun] Token not on Raydium, using Pump.fun...');
    
    // Build transaction
    const buyerPubkey = new PublicKey(buyerPublicKey);
    const tokenMint = new PublicKey(tokenAddress);
    const lamportsToBuy = BigInt(Math.floor(solAmount * LAMPORTS_PER_SOL));
    
    const transaction = await buildPumpFunBuyTransaction({
      payerPubkey: buyerPubkey,
      tokenMint,
      lamportsToBuy,
      sdk,
      connection,
    });
    
    // Sign transaction
    const txId = await TransactionService.signAndSendTransaction(
      { type: 'transaction', transaction },
      solanaWallet, // Pass wallet directly - TransactionService will handle it
      { connection }
    );
    
    return {
      txSignature: txId,
      usedRaydium: false,
    };
  } catch (err: any) {
    console.error('buyTokenViaPumpfun error:', err);
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
}: {
  sellerPublicKey: string;
  tokenAddress: string;
  tokenAmount: number;
  solanaWallet: any;
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
    const isOnRaydium = await checkIfTokenIsOnRaydium(tokenAddress);

    // If on Raydium, we should use their API
    if (isOnRaydium) {
      console.log('[sellTokenViaPumpfun] Token is on Raydium, using swap API...');
      
      // Get swap fee (compute unit price)
      const swapFee = await getSwapFee();
      
      // Get holder token account
      const tokenMint = new PublicKey(tokenAddress);
      const walletPubkey = new PublicKey(sellerPublicKey);
      const tokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        walletPubkey,
      );
      
      // 2. Get quote (exact input: I have X tokens, how much SOL?)
      const swapAmountIn = Math.floor(tokenAmount * 1_000_000); // 6 decimals
      const quote = await getSwapQuote(
        tokenAddress,      // input = Token
        RAYDIUM_SOL_MINT,  // output = SOL
        swapAmountIn,      // amount in (token)
      );
      
      if (!quote || !quote.data) {
        throw new Error('Failed to get swap quote from Raydium');
      }
      
      // 3. Get swap transaction
      const swapTxResp = await getSwapTransaction({
        swapResponse: quote,
        computeUnitPriceMicroLamports: swapFee,
        userPubkey: sellerPublicKey,
        unwrapSol: true,
        wrapSol: false,
        inputAccount: tokenAccount.toString(),
      });
      console.log("swapTxResp =>", swapTxResp);
      const base64Tx = swapTxResp?.data?.[0]?.transaction;
      if (!base64Tx) {
        throw new Error('No swap transaction returned from Raydium');
      }
      
      // 4. Sign and send transaction
      try {
        console.log('[sellTokenViaPumpfun] Attempting to sign and send base64 transaction');
        
        let txId = await TransactionService.signAndSendTransaction(
          { type: 'base64', data: base64Tx },
          solanaWallet, // Pass wallet directly - TransactionService will handle it
          { connection }
        );
        
        return {
          txSignature: txId,
          usedRaydium: true,
        };
      } catch (txError) {
        console.error('[sellTokenViaPumpfun] Transaction signing error:', txError);
        throw txError;
      }
    }
    
    // If not on Raydium, use Pump.fun
    console.log('[sellTokenViaPumpfun] Token not on Raydium, using Pump.fun...');
    
    // Build transaction
    const sellerPubkey = new PublicKey(sellerPublicKey);
    const tokenMint = new PublicKey(tokenAddress);
    const lamportsToSell = BigInt(Math.floor(tokenAmount * 1_000_000));
    
    const transaction = await buildPumpFunSellTransaction({
      sellerPubkey,
      tokenMint,
      lamportsToSell,
      sdk,
      connection,
    });
    
    // Sign transaction
    const txId = await TransactionService.signAndSendTransaction(
      { type: 'transaction', transaction },
      solanaWallet, // Pass wallet directly - TransactionService will handle it
      { connection }
    );
    
    return {
      txSignature: txId,
      usedRaydium: false,
    };
  } catch (err: any) {
    console.error('sellTokenViaPumpfun error:', err);
    throw err;
  }
}
