// File: src/index.ts

export * from './config';
export {CustomizationProvider, useCustomization} from './CustomizationProvider';

// Export Redux store slices (optional: or let users combine them themselves)
export {store} from './state/store';
export type {RootState, AppDispatch} from './state/store';

// Export Hooks
export {useAuth} from './modules/embeddedWalletProviders/hooks/useAuth';
export {useTradeTransaction} from './hooks/useTradeTransaction';
export {useAppSelector, useAppDispatch} from './hooks/useReduxHooks';

// Export Services or Providers

// Export Components
export * from './core/thread/components';
export * from './core/sharedUI/Common/TradeCard';

// Export transaction utilities (if needed)
export {sendPriorityTransaction} from './utils/transactions/sendPriorityTx';
export {sendJitoBundleTransaction} from './utils/transactions/sendJitoBundleTx';

// Export modules
export * from './modules/tokenMill';
export * from './modules/pumpFun';