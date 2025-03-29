# Wallet Module

The Wallet Module provides a unified interface for integrating different wallet providers into your Solana application. It handles authentication, wallet connections, and transaction signing in a consistent way.

## Features

- Unified interface for different wallet providers (Privy, Dynamic, MWA, etc.)
- Standardized authentication flow
- Transaction signing and sending
- Built-in error handling and status updates
- Support for Mobile Wallet Adapter (Android)
- Redux integration for state management

## Architecture

The module follows a modular architecture with the following components:

```
wallet/
├── providers/              # Wallet providers
│   ├── privy/              # Privy implementation
│   ├── dynamic/            # Dynamic implementation
│   ├── turnkey/            # Turnkey implementation
│   ├── mwa/                # Mobile Wallet Adapter implementation
│   └── base.ts             # Provider interface and registry
├── components/             # UI components
│   └── LoginOptions.tsx    # Login UI component
├── services/               # Services
│   └── transactionService.ts # Transaction handling
├── hooks/                  # React hooks
│   ├── useAuth.ts          # Authentication hook
│   └── useWallet.ts        # Wallet operations hook
├── types/                  # Type definitions
│   └── index.ts            # Shared types
├── state/                  # Redux state management
│   └── authReducer.ts      # Auth state
└── index.ts                # Module exports
```

## Usage

### Basic Usage

```tsx
import { useAuth, useWallet } from 'solana-app-kit/modules/wallet';

// In a component:
function WalletComponent() {
  const { loginWithGoogle, loginWithApple, loginWithEmail, logout } = useAuth();
  const { wallet, address, sendTransaction } = useWallet();
  
  // Check if wallet is connected
  if (!wallet) {
    return (
      <button onClick={loginWithGoogle}>Login with Google</button>
    );
  }
  
  return (
    <div>
      <p>Connected: {address}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Using the Login Component

```tsx
import { LoginOptions } from 'solana-app-kit/modules/wallet';

function LoginScreen() {
  const handleWalletConnected = (result) => {
    console.log('Wallet connected:', result.address);
    // Navigate to main app
  };
  
  return (
    <div>
      <h1>Login to the App</h1>
      <LoginOptions onWalletConnected={handleWalletConnected} />
    </div>
  );
}
```

### Sending Transactions

```tsx
import { useWallet } from 'solana-app-kit/modules/wallet';
import { Connection, Transaction } from '@solana/web3.js';

function SendButton() {
  const { wallet, sendTransaction } = useWallet();
  const connection = new Connection('https://api.mainnet-beta.solana.com');
  
  const handleSend = async () => {
    // Create your transaction
    const transaction = new Transaction();
    // Add instructions...
    
    try {
      const signature = await sendTransaction(transaction, connection, {
        confirmTransaction: true,
        statusCallback: (status) => console.log('Transaction status:', status),
      });
      
      console.log('Transaction successful:', signature);
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };
  
  return <button onClick={handleSend} disabled={!wallet}>Send Transaction</button>;
}
```

## Adding a New Wallet Provider

To add a new wallet provider:

1. Create a new directory in `providers/` for your provider
2. Implement the `WalletProvider` interface from `base.ts`
3. Register your provider in `providers/index.ts`

Example:

```typescript
// providers/newProvider/newProvider.ts
import { WalletProvider } from '../base';
import { WalletAdapter } from '../../types';

export class NewWalletProvider implements WalletProvider {
  name = 'newProvider';
  status = 'disconnected';
  user = null;
  wallet = null;
  
  // Implement all required methods
  async login(options) {/* ... */}
  async logout(callback) {/* ... */}
  async connectWallet(callback) {/* ... */}
  async signAndSendTransaction(transaction, connection, options) {/* ... */}
  // Optional: initialize method if needed
}

export const newProvider = new NewWalletProvider();
```

Then register it:

```typescript
// providers/index.ts
import { walletProviders } from './base';
import { newProvider } from './newProvider';

// Register provider
walletProviders.register(newProvider);

// Re-export
export { newProvider };
```

## API Reference

### Hooks

#### `useAuth()`

Provides authentication methods.

- `loginWithGoogle()`: Login with Google
- `loginWithApple()`: Login with Apple
- `loginWithEmail()`: Login with email
- `loginWithMWA()`: Connect with Mobile Wallet Adapter (Android only)
- `logout()`: Log out
- `wallet`: Current wallet adapter
- `user`: Current user info
- `status`: Auth status ('', 'authenticated', etc.)

#### `useWallet()`

Provides wallet functionality.

- `wallet`: Current wallet adapter
- `address`: Wallet address
- `publicKey`: Wallet public key as `PublicKey` object
- `connected`: Whether a wallet is connected
- `sendTransaction(transaction, connection, options)`: Send a transaction
- `sendInstructions(instructions, feePayer, connection, options)`: Send instructions as a transaction
- `sendBase64Transaction(base64Tx, connection, options)`: Send a base64-encoded transaction
- `provider`: Current provider type
- `isMWA()`: Whether using MWA
- `isPrivy()`: Whether using Privy
- `isDynamic()`: Whether using Dynamic

### Components

#### `<LoginOptions onWalletConnected={callback} authMode="login" />`

Renders login buttons for different providers.

### Services

#### `TransactionService`

Handles transaction signing and sending.

- `signAndSendTransaction(txFormat, wallet, options)`: Sign and send a transaction
- `showSuccess(signature, type)`: Show success notification
- `showError(error)`: Show error notification

### Types

- `WalletAdapter`: Interface for wallet adapters
- `WalletProvider`: Interface for wallet providers
- `WalletProviderType`: Union of supported provider types
- `ProviderStatus`: Connection status types
- `LoginMethod`: Available login methods
- `TransactionFormat`: Transaction format options

## Contributing

When contributing to this module, please make sure to:

1. Follow the existing code structure
2. Write comprehensive tests for new functionality
3. Update documentation when adding or changing features
4. Follow TypeScript best practices for type safety 