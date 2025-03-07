[**solana-social-kit**](../../../README.md)

***

[solana-social-kit](../../../README.md) / [hooks/useDynamicWalletLogic](../README.md) / useDynamicWalletLogic

# Function: useDynamicWalletLogic()

> **useDynamicWalletLogic**(): `object`

Defined in: [src/hooks/useDynamicWalletLogic.ts:5](https://github.com/SendArcade/solana-social-starter/blob/98f94bb63d3814df24512365f6ae706d273e698f/src/hooks/useDynamicWalletLogic.ts#L5)

## Returns

`object`

### handleDynamicLogin()

> **handleDynamicLogin**: (`__namedParameters`) => `Promise`\<`void`\>

#### Parameters

##### \_\_namedParameters

###### loginMethod?

`"email"` \| `"sms"` \| `"google"` = `'email'`

###### setStatusMessage?

(`msg`) => `void`

#### Returns

`Promise`\<`void`\>

### handleDynamicLogout()

> **handleDynamicLogout**: (`setStatusMessage`?) => `Promise`\<`void`\>

#### Parameters

##### setStatusMessage?

(`msg`) => `void`

#### Returns

`Promise`\<`void`\>

### monitorDynamicWallet()

> **monitorDynamicWallet**: (`__namedParameters`) => `Promise`\<`void`\>

#### Parameters

##### \_\_namedParameters

###### onWalletConnected?

(`info`) => `void`

###### setStatusMessage?

(`msg`) => `void`

#### Returns

`Promise`\<`void`\>

### user

> **user**: `any`

### walletAddress

> **walletAddress**: `null` \| `string`
