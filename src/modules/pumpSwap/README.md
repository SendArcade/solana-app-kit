# PumpSwap Module

A React Native module for interacting with the [PumpSwap SDK](https://github.com/pump-fun/pump-sdk) to facilitate token swaps, liquidity provision, and pool creation on the Solana blockchain.

## Features

- **Token Swapping**: Swap between tokens in PumpSwap liquidity pools
- **Liquidity Management**: Add and remove liquidity from pools
- **Pool Creation**: Create new liquidity pools with desired token pairs
- **Real-time Quotes**: Get real-time price quotes and price impact estimates
- **Transaction Monitoring**: Track transaction status and get confirmations

## Components

The module provides several reusable UI components:

- **PumpSwapCard**: Container component with consistent styling
- **TokenInput**: Input component for entering token amounts
- **PoolSelector**: Component for selecting a liquidity pool
- **ActionButton**: Reusable button with various states and styles
- **SwapSection**: Section for token swapping functionality
- **LiquidityAddSection**: Section for adding liquidity to pools
- **LiquidityRemoveSection**: Section for removing liquidity from pools
- **PoolCreationSection**: Section for creating new pools

## Screens

- **PumpSwapScreen**: Main screen with tabs for all PumpSwap functionality

## Usage

### Basic Setup

```tsx
import React from 'react';
import {PumpSwapNavigator} from './modules/pumpSwap';

// Include in your app navigation
const AppNavigator = () => {
  return (
    <Stack.Navigator>
      {/* Other screens */}
      <Stack.Screen name="PumpSwap" component={PumpSwapNavigator} />
    </Stack.Navigator>
  );
};
```

### Using Components Individually

```tsx
import React from 'react';
import {View} from 'react-native';
import {PumpSwapCard, SwapSection, usePumpSwap} from './modules/pumpSwap';

const MyCustomScreen = () => {
  // The hook provides all necessary functionality
  const pumpSwap = usePumpSwap();

  return (
    <View style={{flex: 1, padding: 16}}>
      <PumpSwapCard>
        <SwapSection swapButtonLabel="Swap Now" />
      </PumpSwapCard>
    </View>
  );
};
```

## Hook API

The `usePumpSwap` hook provides the following methods:

- `isLoading`: Boolean indicating if pools are loading
- `pools`: Array of available liquidity pools
- `refreshPools()`: Method to refresh the pools list
- `getSwapQuote(params)`: Get a quote for a token swap
- `swap(params)`: Execute a token swap
- `getLiquidityQuote(params)`: Get a quote for adding liquidity
- `addLiquidity(params)`: Add liquidity to a pool
- `removeLiquidity(params)`: Remove liquidity from a pool
- `createPool(params)`: Create a new liquidity pool

## Configuration

The module uses the Helius RPC URL for Solana blockchain connectivity. Make sure the proper constants are set in your environment configuration.

## Dependencies

- `@pump-fun/pump-swap-sdk`: SDK for interacting with PumpSwap contracts
- `@solana/web3.js`: Solana JavaScript client
- `@solana/spl-token`: SPL Token JavaScript client
- React Native core dependencies

## License

MIT
