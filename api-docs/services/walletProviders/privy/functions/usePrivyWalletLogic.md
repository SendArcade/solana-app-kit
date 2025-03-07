[**solana-social-kit**](../../../../README.md)

***

[solana-social-kit](../../../../README.md) / [services/walletProviders/privy](../README.md) / usePrivyWalletLogic

# Function: usePrivyWalletLogic()

> **usePrivyWalletLogic**(): `object`

Defined in: [src/services/walletProviders/privy.ts:13](https://github.com/SendArcade/solana-social-starter/blob/98f94bb63d3814df24512365f6ae706d273e698f/src/services/walletProviders/privy.ts#L13)

## Returns

`object`

### handlePrivyLogin()

> **handlePrivyLogin**: (`__namedParameters`) => `Promise`\<`void`\>

#### Parameters

##### \_\_namedParameters

###### loginMethod?

`"email"` \| `"sms"` \| `"google"` \| `"apple"` = `'email'`

###### setStatusMessage?

(`msg`) => `void`

#### Returns

`Promise`\<`void`\>

### handlePrivyLogout()

> **handlePrivyLogout**: (`setStatusMessage`?) => `Promise`\<`void`\>

#### Parameters

##### setStatusMessage?

(`msg`) => `void`

#### Returns

`Promise`\<`void`\>

### handleWalletRecovery()

> **handleWalletRecovery**: (`__namedParameters`) => `Promise`\<`void`\>

#### Parameters

##### \_\_namedParameters

###### onWalletRecovered?

(`info`) => `void`

###### password

`string`

###### recoveryMethod

`"user-passcode"` \| `"google-drive"` \| `"icloud"`

###### setStatusMessage?

(`msg`) => `void`

#### Returns

`Promise`\<`void`\>

### isReady

> **isReady**: `boolean`

### monitorSolanaWallet()

> **monitorSolanaWallet**: (`__namedParameters`) => `Promise`\<`void`\>

#### Parameters

##### \_\_namedParameters

###### onWalletConnected?

(`info`) => `void`

###### selectedProvider

`string`

###### setStatusMessage?

(`msg`) => `void`

#### Returns

`Promise`\<`void`\>

### solanaWallet

> **solanaWallet**: `EmbeddedSolanaWalletState`

### user

> **user**: `null` \| `PrivyUser`
