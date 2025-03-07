[**solana-social-kit**](../../../README.md)

***

[solana-social-kit](../../../README.md) / [hooks/usePumpFun](../README.md) / usePumpfun

# Function: usePumpfun()

> **usePumpfun**(): `object`

Defined in: [src/hooks/usePumpFun.ts:15](https://github.com/SendArcade/solana-social-starter/blob/98f94bb63d3814df24512365f6ae706d273e698f/src/hooks/usePumpFun.ts#L15)

usePumpfun hook: centralizes buy, sell, and launch logic for Pumpfun tokens.

## Returns

`object`

### buyToken()

> **buyToken**: (`__namedParameters`) => `Promise`\<`void`\>

#### Parameters

##### \_\_namedParameters

###### solAmount

`number`

###### tokenAddress

`string`

#### Returns

`Promise`\<`void`\>

### launchToken()

> **launchToken**: (`__namedParameters`) => `Promise`\<`void`\>

#### Parameters

##### \_\_namedParameters

###### description?

`string` = `''`

###### imageUri

`string`

###### solAmount

`number`

###### telegram?

`string` = `''`

###### tokenName

`string`

###### tokenSymbol

`string`

###### twitter?

`string` = `''`

###### website?

`string` = `''`

#### Returns

`Promise`\<`void`\>

### sellToken()

> **sellToken**: (`__namedParameters`) => `Promise`\<`void`\>

#### Parameters

##### \_\_namedParameters

###### tokenAddress

`string`

###### tokenAmount

`number`

#### Returns

`Promise`\<`void`\>
