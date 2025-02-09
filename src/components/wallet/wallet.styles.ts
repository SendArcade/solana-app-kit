// components/wallet/wallet.styles.ts

import {StyleSheet} from 'react-native';
import {WALLET_DEFAULT_THEME} from './wallet.theme';

export function getMergedWalletTheme(
  userTheme?: Partial<typeof WALLET_DEFAULT_THEME>,
) {
  return {
    ...WALLET_DEFAULT_THEME,
    ...(userTheme || {}),
  };
}

/**
 * Creates a complete set of wallet styles, merged from:
 *  1) default wallet theme,
 *  2) optional user-provided theme,
 *  3) base wallet styles,
 *  4) optional userStyleSheet,
 *  5) explicit override styles.
 */
export function createWalletStyles(
  theme: ReturnType<typeof getMergedWalletTheme>,
  overrideStyles?: {[key: string]: object},
  userStyleSheet?: {[key: string]: object},
) {
  const baseStyles: {[key: string]: any} = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme['--wallet-bg-primary'],
      padding: theme['--wallet-container-padding'],
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      fontSize: theme['--wallet-font-size'] + 2,
      fontWeight: '600',
      color: theme['--wallet-text-primary'],
      marginBottom: 20,
    },
    subHeader: {
      fontSize: theme['--wallet-font-size'],
      color: theme['--wallet-text-secondary'],
      marginBottom: 20,
    },
    providerButtonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
      marginBottom: 20,
    },
    providerButton: {
      paddingVertical: theme['--wallet-button-padding'],
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: theme['--wallet-border-color'],
      borderRadius: 8,
      backgroundColor: theme['--wallet-bg-secondary'],
    },
    providerButtonActive: {
      backgroundColor: theme['--wallet-button-bg'],
    },
    providerButtonText: {
      fontSize: theme['--wallet-font-size'],
      color: theme['--wallet-text-primary'],
    },
    providerButtonTextActive: {
      color: theme['--wallet-button-text-color'],
    },
    connectButton: {
      paddingVertical: theme['--wallet-button-padding'],
      paddingHorizontal: 32,
      backgroundColor: theme['--wallet-button-bg'],
      borderRadius: 8,
      marginTop: 10,
    },
    connectButtonText: {
      fontSize: theme['--wallet-font-size'],
      color: theme['--wallet-button-text-color'],
      fontWeight: '600',
    },
    input: {
      borderWidth: 1,
      borderColor: theme['--wallet-input-border-color'],
      borderRadius: 8,
      padding: 10,
      color: theme['--wallet-input-text-color'],
      fontSize: theme['--wallet-font-size'],
      marginBottom: 10,
      width: '100%',
    },
    statusText: {
      marginTop: 20,
      fontSize: theme['--wallet-font-size'],
      color: theme['--wallet-text-secondary'],
      textAlign: 'center',
    },
  });

  // Merge userStyleSheet if provided
  if (userStyleSheet) {
    Object.keys(userStyleSheet).forEach(key => {
      if (baseStyles[key]) {
        baseStyles[key] = StyleSheet.flatten([
          baseStyles[key],
          userStyleSheet[key],
        ]);
      }
    });
  }

  // Merge explicit overrideStyles last
  if (overrideStyles) {
    Object.keys(overrideStyles).forEach(key => {
      if (baseStyles[key]) {
        baseStyles[key] = StyleSheet.flatten([
          baseStyles[key],
          overrideStyles[key],
        ]);
      }
    });
  }

  return baseStyles;
}
