/**
 * PumpSwap Utilities
 * 
 * Utility functions for the PumpSwap module
 */

import { PublicKey } from '@solana/web3.js';
import { Direction } from '../types';

/**
 * Default slippage tolerance (0.5%)
 */
export const DEFAULT_SLIPPAGE = 0.5;

/**
 * Validate a Solana public key
 */
export function isValidPublicKey(key: string): boolean {
  try {
    new PublicKey(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Format a number to a fixed number of decimal places
 */
export function formatNumber(value: number, decimals: number = 6): string {
  return value.toFixed(decimals);
}

/**
 * Convert a number to a percentage string
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

/**
 * Convert a Direction enum to a human-readable string
 */
export function getDirectionLabel(direction: Direction): string {
  switch (direction) {
    case Direction.BaseToQuote:
      return 'Base to Quote';
    case Direction.QuoteToBase:
      return 'Quote to Base';
    default:
      return 'Unknown';
  }
}

/**
 * Calculate the minimum output amount based on slippage
 */
export function calculateMinOutput(amount: number, slippage: number): number {
  return amount * (1 - slippage / 100);
}

/**
 * Calculate the maximum input amount based on slippage
 */
export function calculateMaxInput(amount: number, slippage: number): number {
  return amount * (1 + slippage / 100);
}

/**
 * Validate swap parameters
 */
export function validateSwapParams(params: {
  pool: string;
  amount: number;
  direction: Direction;
  slippage: number;
}): string | null {
  if (!isValidPublicKey(params.pool)) {
    return 'Invalid pool address';
  }

  if (params.amount <= 0) {
    return 'Amount must be greater than 0';
  }

  if (params.slippage <= 0 || params.slippage > 100) {
    return 'Slippage must be between 0 and 100';
  }

  return null;
}

/**
 * Validate liquidity parameters
 */
export function validateLiquidityParams(params: {
  pool: string;
  baseAmount: number | null;
  quoteAmount: number | null;
  slippage: number;
}): string | null {
  if (!isValidPublicKey(params.pool)) {
    return 'Invalid pool address';
  }

  if (params.baseAmount === null && params.quoteAmount === null) {
    return 'Either base amount or quote amount must be provided';
  }

  if (params.baseAmount !== null && params.baseAmount <= 0) {
    return 'Base amount must be greater than 0';
  }

  if (params.quoteAmount !== null && params.quoteAmount <= 0) {
    return 'Quote amount must be greater than 0';
  }

  if (params.slippage <= 0 || params.slippage > 100) {
    return 'Slippage must be between 0 and 100';
  }

  return null;
}

/**
 * Validate pool creation parameters
 */
export function validateCreatePoolParams(params: {
  baseMint: string;
  quoteMint: string;
  baseAmount: number;
  quoteAmount: number;
}): string | null {
  if (!isValidPublicKey(params.baseMint)) {
    return 'Invalid base mint address';
  }

  if (!isValidPublicKey(params.quoteMint)) {
    return 'Invalid quote mint address';
  }

  if (params.baseAmount <= 0) {
    return 'Base amount must be greater than 0';
  }

  if (params.quoteAmount <= 0) {
    return 'Quote amount must be greater than 0';
  }

  return null;
} 