[**solana-social-kit**](../../../../README.md)

***

[solana-social-kit](../../../../README.md) / [utils/transactions/transactionUtils](../README.md) / signAndSendWithPrivy

# Function: signAndSendWithPrivy()

> **signAndSendWithPrivy**(`transaction`, `connection`, `provider`): `Promise`\<`string`\>

Defined in: [src/utils/transactions/transactionUtils.ts:15](https://github.com/SendArcade/solana-social-starter/blob/98f94bb63d3814df24512365f6ae706d273e698f/src/utils/transactions/transactionUtils.ts#L15)

Signs and sends an in-memory transaction (legacy or versioned) via the
Privy provider's `signAndSendTransaction` method. Returns the tx signature.

## Parameters

### transaction

`Transaction` | `VersionedTransaction`

### connection

`Connection`

### provider

`any`

## Returns

`Promise`\<`string`\>
