# TokenMill Server Services

This directory contains the server-side implementation of the TokenMill module, which provides core functionality for token creation, market operations, token swapping, staking, and vesting on the Solana blockchain.

## Overview

The TokenMill server services integrate with the TokenMill Solana program to provide endpoints that generate and serialize transactions for client applications. These transactions enable users to:

- Create token markets
- Configure bonding curves
- Swap tokens (buy/sell)
- Stake tokens for rewards
- Create and release vesting plans
- Fund markets with SOL
- And more

## Files

The directory contains the following files:

### `tokenMill.ts`

The primary implementation of the TokenMill client that interfaces with the Solana blockchain and provides transaction building services.

### `tokenMillBackupFunctions.ts`

Contains additional functions and alternative implementations for TokenMill operations that are kept as backup or for reference.

## TokenMillClient Class

The `TokenMillClient` class in `tokenMill.ts` is the main entry point for all TokenMill operations on the server side.

### Initialization

The client initializes with:

- A connection to the Solana RPC endpoint
- A wallet keypair generated from the environment-provided private key
- An Anchor provider
- The TokenMill program derived from the IDL

### Core Functions

#### Market and Token Creation

| Function                | Description                                             |
| ----------------------- | ------------------------------------------------------- |
| `createConfig()`        | Creates a new TokenMill configuration with fee settings |
| `getTokenBadge()`       | Creates a token badge for wSOL as a quote asset         |
| `buildCreateMarketTx()` | Builds a transaction to create a new token market       |
| `freeMarket()`          | Removes restrictions from a market                      |
| `createToken()`         | Creates a new token mint                                |

#### Token Swapping

| Function        | Description                                         |
| --------------- | --------------------------------------------------- |
| `buildSwapTx()` | Builds a transaction for token swapping (buy/sell)  |
| `quoteSwap()`   | Calculates expected swap outcomes for a given input |

#### Staking and Vesting

| Function                                       | Description                                      |
| ---------------------------------------------- | ------------------------------------------------ |
| `buildStakeTx()`                               | Builds a transaction for staking tokens          |
| `buildCreateVestingTxWithAutoPositionAndATA()` | Builds a transaction for creating a vesting plan |
| `buildReleaseVestingTx()`                      | Builds a transaction for releasing vested tokens |

#### Market Configuration

| Function            | Description                                               |
| ------------------- | --------------------------------------------------------- |
| `buildSetCurveTx()` | Builds a transaction for setting a market's bonding curve |

#### Metadata and Information

| Function             | Description                              |
| -------------------- | ---------------------------------------- |
| `getAssetMetadata()` | Retrieves metadata for a given asset     |
| `getGraduation()`    | Gets graduation information for a market |

## TokenMillClientBackup Class

The `TokenMillClientBackup` class in `tokenMillBackupFunctions.ts` contains alternative implementations and additional utilities.

### Notable Functions

| Function           | Description                                                |
| ------------------ | ---------------------------------------------------------- |
| `lockMarket()`     | Locks a market with a given swap authority                 |
| `createMarket()`   | Direct implementation of market creation (not building tx) |
| `setPrices()`      | Sets prices for a market                                   |
| `stake()`          | Direct implementation for staking tokens                   |
| `createVesting()`  | Direct implementation for creating a vesting plan          |
| `releaseVesting()` | Direct implementation for releasing vested tokens          |
| `executeSwap()`    | Direct implementation for executing token swaps            |

## Technical Details

### Transaction Building Pattern

Most functions follow a similar pattern:

1. Parse and validate input parameters
2. Derive necessary accounts and PDAs
3. Build the transaction with appropriate instructions
4. Serialize the transaction to a base64 string
5. Return the serialized transaction to the client for signing and submission

### PDA (Program Derived Address) Derivation

The service handles complex PDA derivations for various accounts:

- Market PDAs
- Quote token badges
- Associated Token Accounts (ATAs)
- Metadata accounts
- Staking accounts
- Vesting plan accounts

### Error Handling

The services implement robust error handling with:

- Proper error messages
- Transaction validation
- Response formatting with success/error flags
- Logging for debugging

## Usage in API Endpoints

These service functions are used by the server's API endpoints to provide client-facing functionality:

| Endpoint               | TokenMill Service Function                     |
| ---------------------- | ---------------------------------------------- |
| `/api/markets`         | `buildCreateMarketTx()`                        |
| `/api/stake`           | `buildStakeTx()`                               |
| `/api/vesting/create`  | `buildCreateVestingTxWithAutoPositionAndATA()` |
| `/api/vesting/release` | `buildReleaseVestingTx()`                      |
| `/api/swap`            | `buildSwapTx()`                                |
| `/api/market/fund`     | `buildFundMarketTx()`                          |
| `/api/market/curve`    | `buildSetCurveTx()`                            |

## Environment Variables

The services rely on several environment variables:

- `RPC_URL`: Solana RPC endpoint URL
- `WALLET_PRIVATE_KEY`: Server wallet private key (bs58 encoded)
- `TOKEN_MILL_CONFIG_PDA`: TokenMill configuration PDA address
- `SWAP_AUTHORITY_KEY`: Swap authority private key (for locking markets)

## Transaction Security

All transactions built by these services:

- Require client-side signature with the user's wallet
- Include proper fee payers
- Set appropriate blockhash and timeout
- Implement signature verification
- Validate user authority

## Integration with Solana Programs

The services integrate with:

- TokenMill program (primary)
- SPL Token program
- System program
- Metaplex token metadata program

## Response Format

All service functions return responses in a consistent format:

```typescript
{
  success: boolean;        // Whether the operation was successful
  data?: string | object;  // Base64-encoded transaction or other data
  error?: string;          // Error message if applicable
}
```

## Development and Extension

When extending the TokenMill services:

1. Follow the established patterns for transaction building
2. Ensure proper PDA derivation for new accounts
3. Implement consistent error handling
4. Update the appropriate API endpoints

## Documentation

For more information about the TokenMill module's client-side integration, refer to the `src/modules/tokenMill/README.md` file.
