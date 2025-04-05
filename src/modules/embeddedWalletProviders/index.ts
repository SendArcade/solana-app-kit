// Export wallet providers and hooks
export { default as EmbeddedWalletAuth } from './components/wallet/EmbeddedWallet';
export { useAuth } from './hooks/useAuth';
export { useWallet } from './hooks/useWallet';

// Export wallet providers
export { 
  initDynamicClient, 
  getDynamicClient, 
  isDynamicWallet 
} from './services/walletProviders/dynamic';

export { 
  initTurnkeyClient, 
  getTurnkeyClient, 
  isTurnkeySupported, 
  isTurnkeyWallet 
} from './services/walletProviders/turnkey';

// Export wallet hooks
export { usePrivyWalletLogic } from './services/walletProviders/privy';
export { useDynamicWalletLogic } from './hooks/useDynamicWalletLogic';
export { useTurnkeyWalletLogic } from './hooks/useTurnkeyWalletLogic';

// Export transaction service
export { 
  TransactionService, 
  useTransactionService 
} from './services/transaction/transactionService';

// Export types
export * from './types';
