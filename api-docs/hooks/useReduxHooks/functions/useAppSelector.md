[**solana-social-kit**](../../../README.md)

***

[solana-social-kit](../../../README.md) / [hooks/useReduxHooks](../README.md) / useAppSelector

# Function: useAppSelector()

## Call Signature

> **useAppSelector**\<`TSelected`\>(`selector`, `equalityFn`?): `TSelected`

Defined in: [src/hooks/useReduxHooks.ts:5](https://github.com/SendArcade/solana-social-starter/blob/98f94bb63d3814df24512365f6ae706d273e698f/src/hooks/useReduxHooks.ts#L5)

### Type Parameters

• **TSelected**

### Parameters

#### selector

(`state`) => `TSelected`

#### equalityFn?

`EqualityFn`\<`NoInfer`\<`TSelected`\>\>

### Returns

`TSelected`

## Call Signature

> **useAppSelector**\<`Selected`\>(`selector`, `options`?): `Selected`

Defined in: [src/hooks/useReduxHooks.ts:5](https://github.com/SendArcade/solana-social-starter/blob/98f94bb63d3814df24512365f6ae706d273e698f/src/hooks/useReduxHooks.ts#L5)

### Type Parameters

• **Selected** = `unknown`

### Parameters

#### selector

(`state`) => `Selected`

#### options?

`UseSelectorOptions`\<`Selected`\>

### Returns

`Selected`
