/**
 * Types for the PumpFun module
 */

/**
 * Props for the PumpfunCard component
 * @interface PumpfunCardProps
 */
export interface PumpfunCardProps {
  /** Optional style override for the card container */
  containerStyle?: StyleProp<ViewStyle>;
  /** Child elements to render inside the card */
  children: React.ReactNode;
}

/**
 * Props for the PumpfunBuySection component
 * @interface PumpfunBuySectionProps
 */
export interface PumpfunBuySectionProps {
  /** Optional style override for the container */
  containerStyle?: StyleProp<ViewStyle>;
  /** Optional style override for the input fields */
  inputStyle?: StyleProp<TextStyle>;
  /** Optional style override for the buy button */
  buttonStyle?: StyleProp<ViewStyle>;
  /** Custom label for the buy button (defaults to 'Buy via Pump.fun') */
  buyButtonLabel?: string;
}

/**
 * Interface representing a token selected for selling
 * @interface SelectedToken
 */
export interface SelectedToken {
  /** The public key of the token's mint account */
  mintPubkey: string;
  /** The available token amount in UI format (decimal) */
  uiAmount: number;
}

/**
 * Props for the PumpfunSellSection component
 * @interface PumpfunSellSectionProps
 */
export interface PumpfunSellSectionProps {
  /** Optional pre-selected token to sell */
  selectedToken?: SelectedToken | null;
  /** Optional style override for the container */
  containerStyle?: StyleProp<ViewStyle>;
  /** Optional style override for the input fields */
  inputStyle?: StyleProp<TextStyle>;
  /** Optional style override for the sell button */
  buttonStyle?: StyleProp<ViewStyle>;
  /** Custom label for the sell button (defaults to 'Sell Token') */
  sellButtonLabel?: string;
}

/**
 * Props for the PumpfunLaunchSection component
 * @interface PumpfunLaunchSectionProps
 */
export interface PumpfunLaunchSectionProps {
  /** Optional style override for the container */
  containerStyle?: StyleProp<ViewStyle>;
  /** Optional style override for the input fields */
  inputStyle?: StyleProp<TextStyle>;
  /** Optional style override for the launch button */
  buttonStyle?: StyleProp<ViewStyle>;
  /** Custom label for the launch button (defaults to 'Launch Token') */
  launchButtonLabel?: string;
}

/**
 * Types for the services
 */
export interface PumpfunBuyParams {
  /** The buyer's public key */
  buyerPublicKey: string;
  /** The token address to buy */
  tokenAddress: string;
  /** The amount of SOL to spend */
  solAmount: number;
  /** The wallet to use for the transaction */
  solanaWallet: any;
  /** Optional callback for status updates */
  onStatusUpdate?: (status: string) => void;
}

export interface PumpfunSellParams {
  /** The seller's public key */
  sellerPublicKey: string;
  /** The token address to sell */
  tokenAddress: string;
  /** The amount of tokens to sell */
  tokenAmount: number;
  /** The wallet to use for the transaction */
  solanaWallet: any;
  /** Optional callback for status updates */
  onStatusUpdate?: (status: string) => void;
}

export interface PumpfunLaunchParams {
  /** The user's public key */
  userPublicKey: string;
  /** The name of the token to create */
  tokenName: string;
  /** The symbol for the token */
  tokenSymbol: string;
  /** Description of the token */
  description: string;
  /** Twitter handle */
  twitter?: string;
  /** Telegram handle */
  telegram?: string;
  /** Website URL */
  website?: string;
  /** URI of the token image */
  imageUri: string;
  /** Initial SOL amount to buy */
  solAmount: number;
  /** Slippage basis points (optional) */
  slippageBasisPoints?: bigint;
  /** The wallet to use for the transaction */
  solanaWallet: any;
  /** Optional callback for status updates */
  onStatusUpdate?: (status: string) => void;
}

// Raydium and PumpFun SDK specific types
export interface RaydiumSwapTransactionParams {
  swapResponse: any;
  computeUnitPriceMicroLamports: string;
  userPubkey: string;
  unwrapSol: boolean;
  wrapSol: boolean;
  txVersion?: string;
  inputAccount?: string;
}

export interface PumpFunBondingBuyParams {
  payerPubkey: PublicKey;
  tokenMint: PublicKey;
  lamportsToBuy: bigint;
  slippageBasis?: bigint;
  sdk: PumpFunSDK;
  connection: Connection;
}

export interface PumpFunBondingSellParams {
  sellerPubkey: PublicKey;
  tokenMint: PublicKey;
  lamportsToSell: bigint;
  slippageBasis?: bigint;
  sdk: PumpFunSDK;
  connection: Connection;
}

// Types from React Native and external libraries that are used in interfaces
import { StyleProp, ViewStyle, TextStyle } from 'react-native';
import { PublicKey, Connection } from '@solana/web3.js';
import { PumpFunSDK } from 'pumpdotfun-sdk';

// Re-export TokenEntry from common utils for convenience
export { TokenEntry } from '../../../utils/common/fetch'; 