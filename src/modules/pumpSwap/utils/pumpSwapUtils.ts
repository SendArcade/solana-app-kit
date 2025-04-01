/**
 * PumpSwap Utilities
 * 
 * Utility functions for the PumpSwap module
 */

import { PublicKey, Connection } from '@solana/web3.js';
import { PumpAmmSdk, Pool } from '@pump-fun/pump-swap-sdk';
import { getPumpAmmSdk } from '../services/pumpSwapService';

/**
 * Default slippage percentage for transactions
 */
export const DEFAULT_SLIPPAGE = 1; // 1%

/**
 * Format a number with specified number of decimal places
 * @param value The number to format
 * @param decimals The number of decimal places to display
 * @returns Formatted string representation of the number
 */
export function formatNumber(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined) {
    return '0';
  }
  
  // Handle very small numbers to avoid scientific notation
  if (Math.abs(value) < 0.000001 && value !== 0) {
    return '<0.000001';
  }
  
  // Format with fixed decimals
  return value.toFixed(decimals).replace(/\.?0+$/, '');
}

/**
 * Format a currency amount with symbol
 * @param value - The amount to format
 * @param symbol - The currency symbol
 * @param decimals - The number of decimal places (default: 6)
 * @returns Formatted string representation of the currency amount
 */
export function formatCurrency(value: number, symbol: string, decimals = 6): string {
  return `${formatNumber(value, decimals)} ${symbol}`;
}

/**
 * Parse and format input amount string
 * @param input The raw input string from TextInput
 * @returns Sanitized numeric string 
 */
export function parseInputAmount(input: string): string {
  if (!input) return '';
  
  // Remove all characters except numbers and decimal point
  let sanitized = input.replace(/[^\d.]/g, '');
  
  // Ensure only one decimal point
  const decimalPointIndex = sanitized.indexOf('.');
  if (decimalPointIndex !== -1) {
    sanitized = 
      sanitized.substring(0, decimalPointIndex + 1) + 
      sanitized.substring(decimalPointIndex + 1).replace(/\./g, '');
  }
  
  return sanitized;
}

/**
 * Calculate price impact percentage for a swap
 * @param inputAmount Input token amount
 * @param outputAmount Output token amount
 * @param spotPrice Current spot price
 * @param isBaseToQuote Whether the swap direction is base to quote
 * @returns Price impact percentage
 */
export function calculatePriceImpact(
  inputAmount: number,
  outputAmount: number,
  spotPrice: number,
  isBaseToQuote: boolean
): number {
  if (inputAmount <= 0 || outputAmount <= 0 || spotPrice <= 0) {
    return 0;
  }
  
  // Calculate expected output
  const expectedOutput = isBaseToQuote 
    ? inputAmount * spotPrice 
    : inputAmount / spotPrice;
  
  // Calculate price impact
  const priceImpact = isBaseToQuote
    ? ((expectedOutput - outputAmount) / expectedOutput) * 100
    : ((outputAmount - expectedOutput) / expectedOutput) * 100;
  
  return Math.max(0, priceImpact);
}

/**
 * Calculate the spot price from a pool
 * @param pool - The liquidity pool
 * @returns The spot price (quote/base)
 */
export function calculateSpotPrice(pool: Pool): number {
  // Since the actual Pool type doesn't have a price property,
  // we need to calculate it from the pool data
  // This is a mock implementation - in a real scenario, we would
  // use the actual pool data and SDK to calculate the price
  return 1.0; // Default mock price
}

/**
 * Check if a transaction exceeds maximum allowed slippage
 * @param expectedAmount - The expected output amount
 * @param actualAmount - The actual output amount
 * @param maxSlippage - The maximum allowed slippage percentage
 * @returns Whether the slippage is acceptable
 */
export function isSlippageAcceptable(
  expectedAmount: number,
  actualAmount: number,
  maxSlippage: number
): boolean {
  const slippagePercent = ((expectedAmount - actualAmount) / expectedAmount) * 100;
  return slippagePercent <= maxSlippage;
}

/**
 * Shorten an address for display
 * @param address The full address to shorten
 * @param startChars Number of characters to keep at the start
 * @param endChars Number of characters to keep at the end
 * @returns Shortened address string
 */
export function shortenAddress(
  address: string,
  startChars: number = 4,
  endChars: number = 4
): string {
  if (!address) return '';
  
  if (address.length <= startChars + endChars) {
    return address;
  }
  
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format token amount based on decimals
 * @param amount The raw token amount
 * @param decimals The token decimals
 * @returns Formatted token amount as string
 */
export function formatTokenAmount(amount: number | string, decimals: number = 9): string {
  if (typeof amount === 'string') {
    amount = parseFloat(amount);
  }
  
  if (isNaN(amount)) {
    return '0';
  }
  
  // Calculate division factor based on decimals
  const divisionFactor = Math.pow(10, decimals);
  const formattedAmount = amount / divisionFactor;
  
  return formatNumber(formattedAmount, decimals);
}

/**
 * Format an LP token amount
 * @param amount - The LP token amount
 * @returns The formatted LP token amount
 */
export function formatLpTokenAmount(amount: number): string {
  return formatNumber(amount, 6);
}

/**
 * Create a description for a pool
 * @param baseSymbol - The base token symbol
 * @param quoteSymbol - The quote token symbol
 * @returns A description of the pool
 */
export function getPoolDescription(baseSymbol: string, quoteSymbol: string): string {
  return `${baseSymbol}-${quoteSymbol} Liquidity Pool`;
}

/**
 * Get the price change direction indicator
 * @param currentPrice - The current price
 * @param previousPrice - The previous price
 * @returns 'up', 'down', or 'neutral'
 */
export function getPriceChangeDirection(
  currentPrice: number,
  previousPrice: number
): 'up' | 'down' | 'neutral' {
  if (currentPrice > previousPrice) return 'up';
  if (currentPrice < previousPrice) return 'down';
  return 'neutral';
}

/**
 * Calculate the percentage change between two values
 * @param currentValue - The current value
 * @param previousValue - The previous value
 * @returns The percentage change
 */
export function calculatePercentageChange(
  currentValue: number,
  previousValue: number
): number {
  if (previousValue === 0) return 0;
  return ((currentValue - previousValue) / previousValue) * 100;
}

/**
 * Check if a wallet has sufficient balance for a transaction
 * @param balance - The wallet balance
 * @param amount - The amount to spend
 * @param fee - The transaction fee
 * @returns Whether the balance is sufficient
 */
export function hasSufficientBalance(
  balance: number,
  amount: number,
  fee = 0.000005 // Default Solana transaction fee in SOL
): boolean {
  return balance >= amount + fee;
}

/**
 * Convert a base/quote direction enum to human-readable string
 * @param direction The direction enum value
 * @returns Human-readable direction string
 */
export function formatDirection(direction: 'baseToQuote' | 'quoteToBase'): string {
  return direction === 'baseToQuote' ? 'Base → Quote' : 'Quote → Base';
}

/**
 * Get the reverse of a direction
 * @param direction The current direction
 * @returns The opposite direction
 */
export function flipDirection(direction: 'baseToQuote' | 'quoteToBase'): 'baseToQuote' | 'quoteToBase' {
  return direction === 'baseToQuote' ? 'quoteToBase' : 'baseToQuote';
}

/**
 * Determine if a string value is a valid number
 * @param value String value to check
 * @returns Boolean indicating if value is a valid number
 */
export function isValidNumericInput(value: string): boolean {
  if (!value) return false;
  
  const parsedValue = parseFloat(value);
  
  return !isNaN(parsedValue) && parsedValue > 0;
} 