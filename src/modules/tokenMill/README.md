# TokenMill Module

TokenMill is a module for the Solana App Kit that provides token creation and management functionality, including market creation, bonding curve configuration, swapping, staking, and vesting.

## Features

- Create token markets with configurable parameters
- Fund users and markets with wSOL
- Configure bonding curves for token pricing
- Swap tokens (buy/sell)
- Stake tokens for rewards
- Create and release vesting plans

## Installation

The TokenMill module is part of the Solana App Kit. No additional installation is required.

## Module Structure

```
src/modules/tokenMill/
├── components/           # UI components
│   ├── styles/           # Component styles
│   ├── BondingCurveCard.tsx
│   ├── BondingCurveConfigurator.tsx
│   ├── ExistingAddressCard.tsx
│   ├── FundMarketCard.tsx
│   ├── FundUserCard.tsx
│   ├── MarketCreationCard.tsx
│   ├── StakingCard.tsx
│   ├── SwapCard.tsx
│   └── VestingCard.tsx
├── services/             # Service functions for API calls
│   └── tokenMillService.ts
├── screens/              # Screen components
│   ├── styles/           # Screen styles
│   └── TokenMillScreen.tsx
├── types/                # Type definitions
│   └── index.ts
├── index.ts              # Module exports
└── README.md             # Module documentation
```

## Usage

### Import the module

```typescript
import { TokenMillService } from 'solana-app-kit/modules/tokenMill';
// OR for specific functions
import { fundUserWithWSOL, createMarket } from 'solana-app-kit/modules/tokenMill';
```

### Using the TokenMill Screen

```typescript
import { TokenMillScreen } from 'solana-app-kit/modules/tokenMill';

// In your navigation setup
function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="TokenMill" component={TokenMillScreen} />
      {/* Other screens */}
    </Stack.Navigator>
  );
}
```

### Using the TokenMill Service

```typescript
import { TokenMillService } from 'solana-app-kit/modules/tokenMill';
import { Connection, PublicKey } from '@solana/web3.js';

// Example: Create a token market
async function createNewToken() {
  const connection = new Connection('your-rpc-url', 'confirmed');
  
  try {
    const result = await TokenMillService.createMarket({
      tokenName: 'My Token',
      tokenSymbol: 'MTK',
      metadataUri: 'https://example.com/metadata.json',
      totalSupply: 1000000,
      creatorFee: 2.5,  // 2.5%
      stakingFee: 1.0,  // 1%
      userPublicKey: 'your-wallet-public-key',
      connection,
      solanaWallet: yourWalletInstance,
      onStatusUpdate: (status) => console.log(status),
    });
    
    console.log('Market created:', result.marketAddress);
    console.log('Token mint:', result.baseTokenMint);
  } catch (error) {
    console.error('Failed to create market:', error);
  }
}
```

## API Reference

### Services

The TokenMill module provides the following service functions in `tokenMillService.ts`:

#### `fundUserWithWSOL(params)`

Funds a user's wrapped SOL account.

#### `createMarket(params)`

Creates a new token market with the specified parameters.

#### `stakeTokens(params)`

Stakes tokens in the specified market.

#### `createVesting(params)`

Creates a vesting plan for tokens.

#### `releaseVesting(params)`

Releases vested tokens to the recipient.

#### `swapTokens(params)`

Swaps tokens (buy or sell) in the specified market.

#### `fundMarket(params)`

Funds a market's SOL account.

#### `setBondingCurve(params)`

Configures the bonding curve for a market.

## Components

The TokenMill module includes the following UI components:

- `FundUserCard`: Allows users to fund their wSOL account
- `MarketCreationCard`: Facilitates token market creation
- `BondingCurveCard`: Configures token pricing curves
- `BondingCurveConfigurator`: Advanced curve configuration
- `SwapCard`: Enables token swapping
- `StakingCard`: Allows token staking
- `VestingCard`: Manages token vesting plans
- `FundMarketCard`: Funds market accounts
- `ExistingAddressCard`: Manages existing token addresses

## Contributing

To contribute to the TokenMill module, please follow the contribution guidelines in the main README.md file of the Solana App Kit repository. 