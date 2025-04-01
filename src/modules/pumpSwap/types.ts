import { StyleProp, ViewStyle } from 'react-native';
import { Pool, Direction } from '@pump-fun/pump-swap-sdk';
import { PublicKey } from '@solana/web3.js';

/**
 * Base props interface for all PumpSwap sections
 */
export interface BasePumpSwapProps {
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<ViewStyle>;
  buttonStyle?: StyleProp<ViewStyle>;
}

/**
 * Props for the PumpSwapCard component
 */
export interface PumpSwapCardProps {
  children: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Props for the SwapSection component
 */
export interface PumpSwapSectionProps extends BasePumpSwapProps {
  swapButtonLabel?: string;
}

/**
 * Props for the LiquidityAddSection component
 */
export interface LiquidityAddSectionProps extends BasePumpSwapProps {
  addLiquidityButtonLabel?: string;
}

/**
 * Props for the LiquidityRemoveSection component
 */
export interface LiquidityRemoveSectionProps extends BasePumpSwapProps {
  removeLiquidityButtonLabel?: string;
}

/**
 * Props for the PoolCreationSection component
 */
export interface PoolCreationSectionProps extends BasePumpSwapProps {
  createPoolButtonLabel?: string;
}

/**
 * Swap quote request parameters
 */
export interface SwapQuoteParams {
  pool: Pool;
  inputAmount: number;
  direction: Direction;
  slippage?: number;
}

/**
 * Swap transaction parameters
 */
export interface SwapParams {
  userPublicKey: string;
  pool: string;
  amount: number;
  direction: Direction;
  slippage: number;
  solanaWallet: any;
  onStatusUpdate?: (status: string) => void;
}

/**
 * Liquidity quote request parameters
 */
export interface LiquidityQuoteParams {
  pool: Pool;
  baseAmount?: number;
  quoteAmount?: number;
  slippage?: number;
}

/**
 * Liquidity quote response
 */
export interface LiquidityQuoteResult {
  base?: number;
  quote?: number;
  lpToken: number;
}

/**
 * Add liquidity transaction parameters
 */
export interface AddLiquidityParams {
  userPublicKey: string;
  pool: string;
  baseAmount: number | null;
  quoteAmount: number | null;
  lpTokenAmount: number;
  slippage: number;
  solanaWallet: any;
  onStatusUpdate?: (status: string) => void;
}

/**
 * Remove liquidity transaction parameters
 */
export interface RemoveLiquidityParams {
  userPublicKey: string;
  pool: string;
  lpTokenAmount: number;
  slippage: number;
  solanaWallet: any;
  onStatusUpdate?: (status: string) => void;
}

/**
 * Pool creation transaction parameters
 */
export interface CreatePoolParams {
  userPublicKey: string;
  index: number;
  baseMint: string;
  quoteMint: string;
  baseAmount: number;
  quoteAmount: number;
  solanaWallet: any;
  onStatusUpdate?: (status: string) => void;
}

/**
 * The PumpSwap hook return type
 */
export interface UsePumpSwapResult {
  isLoading: boolean;
  pools: Pool[];
  refreshPools: () => Promise<void>;
  getSwapQuote: (params: SwapQuoteParams) => Promise<number>;
  swap: (params: SwapParams) => Promise<string>;
  getLiquidityQuote: (params: LiquidityQuoteParams) => Promise<LiquidityQuoteResult>;
  addLiquidity: (params: AddLiquidityParams) => Promise<string>;
  removeLiquidity: (params: RemoveLiquidityParams) => Promise<string>;
  createPool: (params: CreatePoolParams) => Promise<string>;
}

