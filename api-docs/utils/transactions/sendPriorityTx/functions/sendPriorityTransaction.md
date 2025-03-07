[**solana-social-kit**](../../../../README.md)

***

[solana-social-kit](../../../../README.md) / [utils/transactions/sendPriorityTx](../README.md) / sendPriorityTransaction

# Function: sendPriorityTransaction()

> **sendPriorityTransaction**(`provider`, `feeTier`, `instructions`, `connection`, `walletPublicKey`, `feeMapping`): `Promise`\<`string`\>

Defined in: [src/utils/transactions/sendPriorityTx.ts:12](https://github.com/SendArcade/solana-social-starter/blob/98f94bb63d3814df24512365f6ae706d273e698f/src/utils/transactions/sendPriorityTx.ts#L12)

## Parameters

### provider

`any`

### feeTier

`"low"` | `"medium"` | `"high"` | `"very-high"`

### instructions

`TransactionInstruction`[]

### connection

`Connection`

### walletPublicKey

`PublicKey`

### feeMapping

`Record`\<`string`, `number`\>

## Returns

`Promise`\<`string`\>
