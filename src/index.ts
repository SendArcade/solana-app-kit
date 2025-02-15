// File: src/index.ts

export * from './config';
export {CustomizationProvider, useCustomization} from './CustomizationProvider';

// Export Redux store slices (optional: or let users combine them themselves)
export {store} from './state/store';
export type {RootState, AppDispatch} from './state/store';

// Export Hooks
export {useAuth} from './hooks/useAuth';
export {useTradeTransaction} from './hooks/useTradeTransaction';
export {useAppSelector, useAppDispatch} from './hooks/useReduxHooks';

// Export Services or Providers
export * from './services/walletProviders';

// Export Components
export * from './components/thread';
export * from './components/wallet';
export * from './components/TradeCard';

// Export transaction utilities (if needed)
export {sendPriorityTransaction} from './utils/sendPriorityTx';
export {sendJitoBundleTransaction} from './utils/sendJitoBundleTx';
