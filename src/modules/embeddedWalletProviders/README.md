# Embedded Wallet Providers Module

The Embedded Wallet Providers module offers a standardized interface for different wallet providers, making it easy to integrate and switch between wallet solutions like Privy, Dynamic, and Mobile Wallet Adapter (MWA).

## Architecture

The module follows a clean, modular architecture:

```
embeddedWalletProviders/
├── components/       # UI Components for wallets
├── hooks/            # React hooks for wallet functionality
├── providers/        # Context providers if needed
├── services/         # Core service implementations  
│   ├── transaction/  # Transaction handling services
│   └── walletProviders/ # Provider-specific implementations
└── types/            # TypeScript type definitions
    ├── auth.ts       # Authentication-related types
    ├── providers.ts  # Provider-specific configuration types
    ├── transaction.ts # Transaction-related types
    ├── wallet.ts     # Wallet interface types
    └── index.ts      # Re-exports all types
```

## Type Definitions

The `types` directory contains all TypeScript type definitions used throughout the module:

- **wallet.ts**: Core wallet interfaces like `StandardWallet`
- **transaction.ts**: Transaction-related types for signing and sending
- **auth.ts**: Authentication and login-related types
- **providers.ts**: Provider-specific configuration types
- **index.ts**: Re-exports all types for easier imports

## Usage

Basic usage example:

```typescript
import { useWallet } from 'src/modules/embeddedWalletProviders/hooks/useWallet';

function MyComponent() {
  const { 
    wallet, 
    address, 
    connected,
    sendTransaction,
    isDynamic,
    isPrivy,
    isMWA 
  } = useWallet();
  
  // Now you can use these wallet functions and properties
  // regardless of the underlying provider
}
```

## Supported Providers

- **Privy**: Full-featured embedded wallets with social login
- **Dynamic**: Embedded wallets with comprehensive authentication
- **MWA (Mobile Wallet Adapter)**: For Android devices using external wallet apps
- **Turnkey**: Basic integration support (extensible)

## Extending with New Providers

To add a new wallet provider:

1. Create a new service in `services/walletProviders/yourProvider.ts`
2. Implement the standard wallet interface
3. Update the `useAuth` hook to include your provider
4. Add provider-specific types to the types directory

## Wallet Interface

All providers implement a standardized wallet interface:

```typescript
interface StandardWallet {
  provider: string;
  address: string | null;
  publicKey: string | null;
  rawWallet: any;
  getProvider: () => Promise<any>;
  getWalletInfo: () => { walletType: string; address: string | null };
}
```

This ensures consistent functionality regardless of the underlying wallet provider.
