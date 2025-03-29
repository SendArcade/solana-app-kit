import { walletProviders } from './base';
import { privyProvider } from './privy';
import { mwaProvider } from './mwa';

// Register all providers
walletProviders.register(privyProvider);
walletProviders.register(mwaProvider);

// Re-export providers registry
export { walletProviders };

// Re-export provider types
export { WalletProvider } from './base';
export type { PrivyWalletProvider } from './privy';
export type { MWAWalletProvider } from './mwa';

// Export individual providers if needed
export { privyProvider, mwaProvider }; 