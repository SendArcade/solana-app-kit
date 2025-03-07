[**solana-social-kit**](../../../../README.md)

***

[solana-social-kit](../../../../README.md) / [utils/transactions/transactionUtils](../README.md) / signAndSendBase64Tx

# Function: signAndSendBase64Tx()

> **signAndSendBase64Tx**(`base64Tx`, `connection`, `provider`): `Promise`\<`string`\>

Defined in: [src/utils/transactions/transactionUtils.ts:40](https://github.com/SendArcade/solana-social-starter/blob/98f94bb63d3814df24512365f6ae706d273e698f/src/utils/transactions/transactionUtils.ts#L40)

Takes a base64-encoded transaction (could be legacy or versioned),
deserializes it, and then uses Privy provider to sign+send.

## Parameters

### base64Tx

`string`

### connection

`Connection`

### provider

`any`

## Returns

`Promise`\<`string`\>
