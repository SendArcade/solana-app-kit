/**
 * Types for the PumpSwap module
 */

import { StyleProp, ViewStyle, TextStyle } from 'react-native';
import { PublicKey, Connection } from '@solana/web3.js';
import { StandardWallet } from '../../embeddedWalletProviders/types';

// Direction enum for swap direction
export enum Direction {
  QuoteToBase = 0,
  BaseToQuote = 1
}

// Pool interface - simplified version of the server-side Pool type
export interface Pool {
  address: string;
  baseMint: string;
  quoteMint: string;
  baseReserve?: string;
  quoteReserve?: string;
  lpMint?: string;
  price?: number;
}

/**
 * Props for the PumpSwapCard component
 * @interface PumpSwapCardProps
 */
export interface PumpSwapCardProps {
  /** Optional style override for the card container */
  containerStyle?: StyleProp<ViewStyle>;
  /** Child elements to render inside the card */
  children: React.ReactNode;
}

/**
 * Props for the PumpSwapSection component
 * @interface PumpSwapSectionProps
 */
export interface PumpSwapSectionProps {
  /** Optional style override for the container */
  containerStyle?: StyleProp<ViewStyle>;
  /** Optional style override for the input fields */
  inputStyle?: StyleProp<TextStyle>;
  /** Optional style override for the swap button */
  buttonStyle?: StyleProp<ViewStyle>;
  /** Custom label for the swap button (defaults to 'Swap Tokens') */
  swapButtonLabel?: string;
}

/**
 * Props for the LiquidityAddSection component
 * @interface LiquidityAddSectionProps
 */
export interface LiquidityAddSectionProps {
  /** Optional style override for the container */
  containerStyle?: StyleProp<ViewStyle>;
  /** Optional style override for the input fields */
  inputStyle?: StyleProp<TextStyle>;
  /** Optional style override for the add liquidity button */
  buttonStyle?: StyleProp<ViewStyle>;
  /** Custom label for the add liquidity button (defaults to 'Add Liquidity') */
  addLiquidityButtonLabel?: string;
}

/**
 * Props for the LiquidityRemoveSection component
 * @interface LiquidityRemoveSectionProps
 */
export interface LiquidityRemoveSectionProps {
  /** Optional style override for the container */
  containerStyle?: StyleProp<ViewStyle>;
  /** Optional style override for the input fields */
  inputStyle?: StyleProp<TextStyle>;
  /** Optional style override for the remove liquidity button */
  buttonStyle?: StyleProp<ViewStyle>;
  /** Custom label for the remove liquidity button (defaults to 'Remove Liquidity') */
  removeLiquidityButtonLabel?: string;
}

/**
 * Props for the PoolCreationSection component
 * @interface PoolCreationSectionProps
 */
export interface PoolCreationSectionProps {
  /** Optional style override for the container */
  containerStyle?: StyleProp<ViewStyle>;
  /** Optional style override for the input fields */
  inputStyle?: StyleProp<TextStyle>;
  /** Optional style override for the create pool button */
  buttonStyle?: StyleProp<ViewStyle>;
  /** Custom label for the create pool button (defaults to 'Create Pool') */
  createPoolButtonLabel?: string;
}

/**
 * Interface representing a token pair for a pool
 * @interface TokenPair
 */
export interface TokenPair {
  /** The base token mint address */
  baseMint: string;
  /** The quote token mint address */
  quoteMint: string;
}

/**
 * Interface representing a liquidity pool
 * @interface LiquidityPool
 */
export interface LiquidityPool {
  /** The pool address */
  address: string;
  /** The base token mint address */
  baseMint: string;
  /** The quote token mint address */
  quoteMint: string;
  /** The base token reserve amount */
  baseReserve: string;
  /** The quote token reserve amount */
  quoteReserve: string;
  /** The pool's LP token mint address */
  lpMint: string;
  /** The current pool price */
  price: number;
}

/**
 * Types for the services
 */
export interface SwapParams {
  /** The pool address to swap in */
  pool: string;
  /** The amount to swap */
  amount: number;
  /** The direction of the swap */
  direction: Direction;
  /** The slippage tolerance in percentage */
  slippage?: number;
  /** The user's public key */
  userPublicKey: string;
}

export interface AddLiquidityParams {
  /** The pool address to add liquidity to */
  pool: string;
  /** The base token amount */
  baseAmount: number;
  /** The quote token amount */
  quoteAmount: number;
  /** The slippage tolerance in percentage */
  slippage?: number;
  /** The user's public key */
  userPublicKey: string;
}

export interface RemoveLiquidityParams {
  /** The pool address to remove liquidity from */
  pool: string;
  /** The LP token amount to burn */
  lpTokenAmount: number;
  /** The slippage tolerance in percentage */
  slippage?: number;
  /** The user's public key */
  userPublicKey: string;
}

export interface CreatePoolParams {
  /** The index for the pool */
  index: number;
  /** The base token mint */
  baseMint: string;
  /** The quote token mint */
  quoteMint: string;
  /** The initial base token amount */
  baseAmount: number;
  /** The initial quote token amount */
  quoteAmount: number;
  /** The user's public key */
  userPublicKey: string;
}

// Context type for potential future use
export interface PumpSwapContextType {
  /** Whether the SDK is loading */
  isLoading: boolean;
  /** The Solana Connection */
  connection: Connection | null;
  /** Available pools */
  pools: Pool[];
  /** Swap tokens */
  swap: (params: SwapParams & { connection: Connection, solanaWallet: StandardWallet, onStatusUpdate?: (status: string) => void }) => Promise<string>;
  /** Add liquidity to a pool */
  addLiquidity: (params: AddLiquidityParams & { connection: Connection, solanaWallet: StandardWallet, onStatusUpdate?: (status: string) => void }) => Promise<string>;
  /** Remove liquidity from a pool */
  removeLiquidity: (params: RemoveLiquidityParams & { connection: Connection, solanaWallet: StandardWallet, onStatusUpdate?: (status: string) => void }) => Promise<string>;
  /** Create a new pool */
  createPool: (params: CreatePoolParams & { connection: Connection, solanaWallet: StandardWallet, onStatusUpdate?: (status: string) => void }) => Promise<string>;
  /** Refresh pools */
  refreshPools: () => Promise<void>;
}

// Re-export Pump SDK types for convenience
export { Direction, Pool } from '@pump-fun/pump-swap-sdk'; 