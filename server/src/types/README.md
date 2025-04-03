# Types Directory

This directory contains TypeScript type definitions used throughout the Solana Social Starter backend.

## Overview

Centralized type definitions help maintain consistency and type safety across the codebase. These types:

- Define the structure of API request and response objects
- Specify parameters for service functions
- Model database entities
- Define interfaces for external service interactions

## Files

### `interfaces.ts`

Contains interfaces and types for:

- **TokenMill Parameters**

  - `MarketParams`: Parameters for creating a token market
  - `TokenParams`: Parameters for creating a token
  - `StakingParams`: Parameters for staking operations
  - `VestingParams`: Parameters for vesting operations
  - `SwapParams`: Parameters for token swaps
  - `FreeMarketParams`: Parameters for freeing a market
  - `TokenMillResponse`: Standard response format for TokenMill operations

- **Thread-related Types**

  - Thread content and metadata structures
  - Interaction types (likes, reposts, etc.)
  - Query parameters for thread retrieval

- **Profile Types**

  - User profile structures
  - Wallet connection parameters
  - Profile image metadata

- **API Response Types**
  - Standard response structures
  - Error formats
  - Pagination parameters

## Usage

Types are imported where needed throughout the codebase:

```typescript
import {MarketParams, TokenMillResponse} from '../types/interfaces';

async function createMarket(params: MarketParams): Promise<TokenMillResponse> {
  // Implementation
}
```

## Best Practices

1. **Keep Types DRY**: If the same structure is used in multiple places, define it once in the types directory
2. **Use Descriptive Names**: Type names should clearly indicate what they represent
3. **Document Types**: Use JSDoc comments to describe complex types
4. **Use Type Composition**: Build complex types from simpler ones using intersection and union types
5. **Export All Types**: Make all types available for import from other modules
6. **Avoid Any**: Use specific types instead of `any` to maintain type safety

## Example Type Definition

```typescript
/**
 * Parameters for creating a token market
 */
export interface MarketParams {
  /** The name of the token */
  name: string;

  /** The symbol for the token */
  symbol: string;

  /** URI for token metadata */
  uri: string;

  /** Total supply of tokens */
  totalSupply: number;

  /** Percentage fee for token creators */
  creatorFeeShare: number;

  /** Percentage fee for staking */
  stakingFeeShare: number;

  /** The creator's public key */
  userPublicKey: string;
}

/**
 * Standard response format for TokenMill operations
 */
export interface TokenMillResponse {
  /** Whether the operation was successful */
  success: boolean;

  /** Optional data returned by the operation */
  data?: {
    /** Transaction signature */
    transaction?: string;

    /** Other operation-specific data */
    [key: string]: any;
  };

  /** Error message if the operation failed */
  error?: string;
}
```
