[**solana-social-kit**](../../../../README.md)

***

[solana-social-kit](../../../../README.md) / [components/wallet/EmbeddedWallet](../README.md) / default

# Function: default()

> **default**(`props`, `deprecatedLegacyContext`?): `ReactNode`

Defined in: [src/components/wallet/EmbeddedWallet.tsx:53](https://github.com/SendArcade/solana-social-starter/blob/98f94bb63d3814df24512365f6ae706d273e698f/src/components/wallet/EmbeddedWallet.tsx#L53)

A component that provides embedded wallet authentication functionality

## Parameters

### props

[`EmbeddedWalletAuthProps`](../interfaces/EmbeddedWalletAuthProps.md)

### deprecatedLegacyContext?

`any`

**Deprecated**

**See**

[React Docs](https://legacy.reactjs.org/docs/legacy-context.html#referencing-context-in-lifecycle-methods)

## Returns

`ReactNode`

## Component

## Description

EmbeddedWalletAuth is a component that handles wallet authentication through
various providers (Google, Apple, Email) and manages the connection state.
It provides a user interface for authentication and handles wallet connection
callbacks.

Features:
- Multiple authentication methods:
  - Google Sign-In
  - Apple Sign-In
  - Email Sign-In
- Automatic wallet connection handling
- Error handling and user feedback
- Provider-specific wallet management

## Example

```tsx
<EmbeddedWalletAuth
  onWalletConnected={({provider, address}) => {
    console.log(`Connected with ${provider}: ${address}`);
  }}
  authMode="login"
/>
```
