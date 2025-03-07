[**solana-social-kit**](../../../../README.md)

***

[solana-social-kit](../../../../README.md) / [utils/transactions/sendJitoBundleTx](../README.md) / sendJitoBundleTransaction

# Function: sendJitoBundleTransaction()

> **sendJitoBundleTransaction**(`provider`, `feeTier`, `instructions`, `walletPublicKey`, `connection`, `feeMapping`): `Promise`\<`string`\>

Defined in: [src/utils/transactions/sendJitoBundleTx.ts:29](https://github.com/SendArcade/solana-social-starter/blob/98f94bb63d3814df24512365f6ae706d273e698f/src/utils/transactions/sendJitoBundleTx.ts#L29)

For Jito bundling, we cannot do a typical "signAndSendTransaction" because
we must push multiple transactions to the block engine. Instead we do the partial
signature flow with `signTransaction`, then we call `sendJitoBundle`.

## Parameters

### provider

`any`

### feeTier

`"low"` | `"medium"` | `"high"` | `"very-high"`

### instructions

`TransactionInstruction`[]

### walletPublicKey

`PublicKey`

### connection

`Connection`

### feeMapping

`Record`\<`string`, `number`\>

## Returns

`Promise`\<`string`\>
