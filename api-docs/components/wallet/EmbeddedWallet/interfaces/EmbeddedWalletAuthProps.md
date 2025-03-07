[**solana-social-kit**](../../../../README.md)

***

[solana-social-kit](../../../../README.md) / [components/wallet/EmbeddedWallet](../README.md) / EmbeddedWalletAuthProps

# Interface: EmbeddedWalletAuthProps

Defined in: [src/components/wallet/EmbeddedWallet.tsx:12](https://github.com/SendArcade/solana-social-starter/blob/98f94bb63d3814df24512365f6ae706d273e698f/src/components/wallet/EmbeddedWallet.tsx#L12)

Props for the EmbeddedWalletAuth component
 EmbeddedWalletAuthProps

## Properties

### authMode?

> `optional` **authMode**: `"login"` \| `"signup"`

Defined in: [src/components/wallet/EmbeddedWallet.tsx:21](https://github.com/SendArcade/solana-social-starter/blob/98f94bb63d3814df24512365f6ae706d273e698f/src/components/wallet/EmbeddedWallet.tsx#L21)

The authentication mode to use (defaults to 'login')

***

### onWalletConnected()

> **onWalletConnected**: (`info`) => `void`

Defined in: [src/components/wallet/EmbeddedWallet.tsx:14](https://github.com/SendArcade/solana-social-starter/blob/98f94bb63d3814df24512365f6ae706d273e698f/src/components/wallet/EmbeddedWallet.tsx#L14)

Callback function that receives wallet connection information

#### Parameters

##### info

###### address

`string`

The connected wallet's public key

###### provider

`"privy"` \| `"dynamic"` \| `"turnkey"`

The authentication provider used

#### Returns

`void`
