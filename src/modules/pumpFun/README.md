# PumpFun Module

A comprehensive module for interacting with the Pump.fun platform in Solana-based applications. This module provides a set of React components, hooks, services, and utilities to seamlessly integrate Pump.fun functionality into your application.

## Features

- Buy tokens through Pump.fun or Raydium
- Sell tokens through Pump.fun or Raydium
- Launch new tokens with customizable metadata
- Token management dashboard
- Wallet integration

## Components

### PumpfunBuySection

A form component for buying tokens on Pump.fun.

```tsx
import { PumpfunBuySection } from '@solana-app-kit/pumpfun';

// Usage
<PumpfunBuySection
  containerStyle={styles.customContainer}
  inputStyle={styles.customInput}
  buttonStyle={styles.customButton}
  buyButtonLabel="Purchase Token"
/>
```

### PumpfunSellSection

A form component for selling tokens on Pump.fun.

```tsx
import { PumpfunSellSection } from '@solana-app-kit/pumpfun';

// Usage with manual token input
<PumpfunSellSection
  containerStyle={styles.customContainer}
  sellButtonLabel="Sell Now"
/>

// Usage with pre-selected token
<PumpfunSellSection
  selectedToken={{
    mintPubkey: "5tMi...",
    uiAmount: 1000
  }}
  sellButtonLabel="Sell Token"
/>
```

### PumpfunLaunchSection

A form component for launching new tokens on Pump.fun.

```tsx
import { PumpfunLaunchSection } from '@solana-app-kit/pumpfun';

// Usage
<PumpfunLaunchSection
  containerStyle={styles.customContainer}
  inputStyle={styles.customInput}
  buttonStyle={styles.customButton}
  launchButtonLabel="Create Token"
/>
```

### PumpfunCard

A base card component used by other PumpFun components.

```tsx
import { PumpfunCard } from '@solana-app-kit/pumpfun';

// Usage
<PumpfunCard containerStyle={styles.customCard}>
  <Text>Card Content</Text>
</PumpfunCard>
```

## Screen

### PumpfunScreen

A complete screen component that provides a full dashboard for managing tokens through Pump.fun.

```tsx
import { PumpfunScreen } from '@solana-app-kit/pumpfun';

// Usage
<PumpfunScreen />
```

## Hooks

### usePumpFun

A React hook that provides methods for buying, selling, and launching tokens through Pump.fun.

```tsx
import { usePumpFun } from '@solana-app-kit/pumpfun';

function MyComponent() {
  const { buyToken, sellToken, launchToken } = usePumpFun();
  
  const handleBuyToken = async () => {
    try {
      await buyToken({
        tokenAddress: "5tMi...",
        solAmount: 0.1,
        onStatusUpdate: (status) => console.log(status)
      });
    } catch (error) {
      console.error(error);
    }
  };
  
  return (
    <Button title="Buy Token" onPress={handleBuyToken} />
  );
}
```

## Services

The module provides services for direct interaction with the Pump.fun platform:

- `buyTokenViaPumpfun`: Buy tokens through Pump.fun or Raydium
- `sellTokenViaPumpfun`: Sell tokens through Pump.fun or Raydium
- `createAndBuyTokenViaPumpfun`: Create a new token and make an initial purchase

## Utilities

Various utilities for working with the Pump.fun platform:

- `getProvider`: Get an AnchorProvider for Solana operations
- `checkIfTokenIsOnRaydium`: Check if a token is available on Raydium
- `getSwapFee`: Get the current swap fee from Raydium
- `getSwapQuote`: Get a quote for a token swap on Raydium
- `getSwapTransaction`: Build a swap transaction for Raydium
- `buildPumpFunBuyTransaction`: Build a transaction for buying on Pump.fun
- `buildPumpFunSellTransaction`: Build a transaction for selling on Pump.fun

## Types

The module exports a comprehensive set of TypeScript interfaces for type safety:

- `PumpfunCardProps`
- `PumpfunBuySectionProps`
- `PumpfunSellSectionProps`
- `PumpfunLaunchSectionProps`
- `SelectedToken`
- And more...

## Integration

To integrate this module into your Solana project:

1. Ensure you have proper wallet integration
2. Import the necessary components from the module
3. Configure the styling to match your application's design
4. Use the components, hooks, and services as needed

## Customization

All components accept style props for customization:

- `containerStyle`: Style for the container
- `inputStyle`: Style for input fields
- `buttonStyle`: Style for buttons
- Custom labels for buttons

## Dependencies

This module depends on:

- React Native
- Solana Web3.js
- PumpFun SDK
- Expo Image Picker (for image upload)

## License

MIT
