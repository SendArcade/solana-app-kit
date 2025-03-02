import {createClient} from '@dynamic-labs/client';
import {ReactNativeExtension} from '@dynamic-labs/react-native-extension';
import {SolanaExtension} from '@dynamic-labs/solana-extension';

let dynamicClient: any | null = null;

/**
 * Initialize the dynamic client once.
 * @param environmentId The environment ID from your config.
 * @param appName (optional) The name of your app, also from config.
 * @param appLogoUrl (optional) The logo URL for your app.
 */
export function initDynamicClient(
  environmentId: string,
  appName?: string,
  appLogoUrl?: string,
) {
  if (!environmentId) {
    throw new Error(
      'initDynamicClient: environmentId is required but was not provided!',
    );
  }
  // If already created, skip re-creation.
  if (dynamicClient) {
    return dynamicClient;
  }

  dynamicClient = createClient({
    environmentId,
    appName: appName || '',
    appLogoUrl: appLogoUrl || '',
  })
    .extend(ReactNativeExtension())
    .extend(SolanaExtension());

  return dynamicClient;
}

/**
 * Get the previously initialized dynamic client.
 * If the client was never initialized, this throws an error.
 */
export function getDynamicClient() {
  if (!dynamicClient) {
    throw new Error(
      'Dynamic client not initialized. Call initDynamicClient first.',
    );
  }
  return dynamicClient;
}
