[**solana-social-kit**](../../../../README.md)

***

[solana-social-kit](../../../../README.md) / [utils/transactions/sendPriorityTx](../README.md) / sendPriorityTransaction

# Function: sendPriorityTransaction()

> **sendPriorityTransaction**(`provider`, `feeTier`, `instructions`, `connection`, `walletPublicKey`, `feeMapping`): `Promise`\<`string`\>

Defined in: [src/utils/transactions/sendPriorityTx.ts:12](https://github.com/SendArcade/solana-social-starter/blob/03568260ca96ed63f77049843c721de1cb011893/src/utils/transactions/sendPriorityTx.ts#L12)

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
